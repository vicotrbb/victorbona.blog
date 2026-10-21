// Pure module: imported directly by node in tests, so no next/* or path aliases.
import { addresses } from "./addresses.ts";
import { profile } from "./profile.ts";

export type IndexEntry = { slug: string; title: string; href: string; kind: "post" | "paper" | "system" | "note" };
export type TerminalResult =
  | { kind: "navigate"; href: string; echo: string }
  | { kind: "print"; lines: string[] }
  | { kind: "mail"; href: string };

export const helpLines = [
  "help: commands",
  "  cd <section|P100-P600>   go to a page (cd papers, cd P400)",
  "  open <slug|title>        open a post, paper, system or note",
  "  ls                       list page addresses",
  "  mail                     write to Victor",
  "  help                     show this list",
];

function cd(arg: string): TerminalResult {
  if (!arg || arg === "~" || arg === "/") return { kind: "navigate", href: "/", echo: "→ P100 Home" };
  const q = arg.toLowerCase();
  const a = addresses.find((x) => x.code.toLowerCase() === q || x.aliases.includes(q));
  return a
    ? { kind: "navigate", href: a.href, echo: `→ ${a.code} ${a.label}` }
    : { kind: "print", lines: [`cd: no such address: ${arg}`, "try ls"] };
}

function open(query: string, index: IndexEntry[]): TerminalResult {
  if (!query) return { kind: "print", lines: ["open: missing query", "usage: open <slug|title>"] };
  const q = query.toLowerCase();
  const hits = index.filter((e) => e.slug === query || e.title.toLowerCase().startsWith(q));
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

export function runCommand(input: string, index: IndexEntry[]): TerminalResult {
  const [cmd = "", ...rest] = input.trim().split(/\s+/);
  const arg = rest.join(" ");
  switch (cmd.toLowerCase()) {
    case "cd":
      return cd(arg);
    case "open":
      return open(arg, index);
    case "mail":
      return { kind: "mail", href: `mailto:${profile.email}` };
    case "ls":
      return { kind: "print", lines: addresses.map((a) => `${a.code}  ${a.label.padEnd(11)} ${a.href}`) };
    case "":
    case "help":
      return { kind: "print", lines: helpLines };
    default:
      return { kind: "print", lines: [`unknown command: ${cmd}`, ...helpLines] };
  }
}
