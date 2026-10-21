// Pure module: imported directly by node in tests, so no next/* or path aliases.
import { addresses, extraPages } from "./addresses.ts";
import { profile } from "./profile.ts";

export type IndexEntry = { slug: string; title: string; href: string; kind: "post" | "paper" | "system" | "note"; text?: string };
export type TerminalResult =
  | { kind: "navigate"; href: string; echo: string }
  | { kind: "print"; lines: string[] }
  | { kind: "mail"; href: string };

export const helpLines = [
  "help: commands",
  "  cd <section|P100-P600>   go to a page (cd papers, cd P400)",
  "  open <slug|title>        open a post, paper, system or note",
  "  grep <words>             search everything (grep raft)",
  "  ls                       list page addresses (cd now, cd research)",
  "  mail                     write to Victor",
  "  help                     show this list",
];

function cd(arg: string): TerminalResult {
  if (!arg || arg === "~" || arg === "/") return { kind: "navigate", href: "/", echo: "→ P100 Home" };
  const q = arg.toLowerCase();
  const a = addresses.find((x) => x.code.toLowerCase() === q || x.aliases.includes(q));
  if (a) return { kind: "navigate", href: a.href, echo: `→ ${a.code} ${a.label}` };
  const extra = extraPages.find((x) => x.aliases.includes(q));
  return extra
    ? { kind: "navigate", href: extra.href, echo: `→ ${extra.label}` }
    : { kind: "print", lines: [`cd: no such address: ${arg}`, "try ls"] };
}

function open(query: string, index: IndexEntry[]): TerminalResult {
  if (!query) return { kind: "print", lines: ["open: missing query", "usage: open <slug|title>"] };
  const q = query.toLowerCase();
  // A unique exact slug wins, so every slug printed in a candidate list stays reachable.
  const exact = index.filter((e) => e.slug.toLowerCase() === q);
  const hits = exact.length === 1 ? exact : index.filter((e) => e.slug.toLowerCase() === q || e.title.toLowerCase().startsWith(q));
  if (hits.length === 1) return { kind: "navigate", href: hits[0].href, echo: `→ ${hits[0].title}` };
  if (!hits.length) return { kind: "print", lines: [`not found: ${query}`] };
  return {
    kind: "print",
    lines: [
      `${hits.length} matches for ${query}, open one by slug:`,
      ...hits.slice(0, 5).map((e) => `  ${e.kind.padEnd(6)} ${e.slug}  ${e.title}`),
    ],
  };
}

// Every query word must appear in the title, slug or text; title hits rank first, then kind order.
export function searchIndex(index: IndexEntry[], query: string, limit = 50): IndexEntry[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return index
    .map((e) => {
      const title = `${e.title} ${e.slug}`.toLowerCase();
      const all = `${title} ${(e.text ?? "").toLowerCase()}`;
      if (!words.every((w) => all.includes(w))) return null;
      return { e, score: words.filter((w) => title.includes(w)).length };
    })
    .filter((x): x is { e: IndexEntry; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.e);
}

function grep(query: string, index: IndexEntry[]): TerminalResult {
  if (!query) return { kind: "print", lines: ["grep: missing words", "usage: grep <words>"] };
  const hits = searchIndex(index, query);
  if (!hits.length) return { kind: "print", lines: [`no matches for ${query}`] };
  return {
    kind: "print",
    lines: [
      `${hits.length} matches, open one by slug:`,
      ...hits.slice(0, 8).map((e) => `  ${e.kind.padEnd(6)} ${e.slug}  ${e.title}`),
      ...(hits.length > 8 ? [`  ... all results: cd search, or /search?q=${encodeURIComponent(query)}`] : []),
    ],
  };
}

export function runCommand(input: string, index: IndexEntry[]): TerminalResult {
  const [cmd = "", ...rest] = input.trim().split(/\s+/);
  const arg = rest.join(" ");
  switch (cmd.toLowerCase()) {
    case "cd":
      return cd(arg);
    case "open":
      return open(arg, index);
    case "grep":
    case "search":
    case "find":
      return grep(arg, index);
    case "mail":
      return { kind: "mail", href: `mailto:${profile.email}` };
    case "ls":
      return {
        kind: "print",
        lines: [
          ...addresses.map((a) => `${a.code}  ${a.label.padEnd(11)} ${a.href}`),
          ...extraPages.map((p) => `      ${p.label.padEnd(11)} ${p.href}`),
        ],
      };
    case "":
    case "help":
      return { kind: "print", lines: helpLines };
    default:
      return { kind: "print", lines: [`unknown command: ${cmd}`, ...helpLines] };
  }
}
