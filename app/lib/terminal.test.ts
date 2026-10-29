import { test } from "node:test";
import assert from "node:assert/strict";
import { runCommand, searchIndex, type IndexEntry } from "./terminal.ts";

const index: IndexEntry[] = [
  { slug: "nidus-whitepaper", title: "Nidus: Module Composition for Axum", href: "/articles/nidus-whitepaper", kind: "paper" },
  { slug: "locus-whitepaper", title: "Locus whitepaper", href: "/articles/locus-whitepaper", kind: "paper" },
  { slug: "welcome", title: "Welcome", href: "/blog/welcome", kind: "post" },
];

test("cd by alias and by code", () => {
  assert.deepEqual(runCommand("cd papers", index), { kind: "navigate", href: "/articles", echo: "→ P300 Papers" });
  assert.equal((runCommand("cd P300", index) as { href: string }).href, "/articles");
  assert.equal((runCommand("cd p400", index) as { href: string }).href, "/projects");
});

test("cd with no argument, ~ or / goes home", () => {
  for (const input of ["cd", "cd ~", "cd /"]) {
    assert.equal(runCommand(input, index).kind, "navigate", input);
    assert.equal((runCommand(input, index) as { href: string }).href, "/", input);
  }
});

test("cd to an unknown address prints an error", () => {
  const r = runCommand("cd nowhere", index);
  assert.equal(r.kind, "print");
  assert.match((r as { lines: string[] }).lines[0], /no such address: nowhere/);
});

test("open navigates on a unique title prefix or exact slug", () => {
  assert.deepEqual(runCommand("open nidus", index), {
    kind: "navigate",
    href: "/articles/nidus-whitepaper",
    echo: "→ Nidus: Module Composition for Axum",
  });
  assert.equal((runCommand("open welcome", index) as { href: string }).href, "/blog/welcome");
});

test("open lists candidates when ambiguous, capped at 5", () => {
  const many: IndexEntry[] = Array.from({ length: 8 }, (_, i) => ({
    slug: `s${i}`, title: `Same ${i}`, href: `/x/${i}`, kind: "note",
  }));
  const r = runCommand("open same", many);
  assert.equal(r.kind, "print");
  assert.equal((r as { lines: string[] }).lines.filter((l) => / s[0-9] /.test(l)).length, 5);
});

test("open zzz prints not found", () => {
  const r = runCommand("open zzz", index);
  assert.equal(r.kind, "print");
  assert.ok((r as { lines: string[] }).lines.some((l) => l.includes("not found: zzz")));
});

test("mail", () => {
  assert.deepEqual(runCommand("mail", index), { kind: "mail", href: "mailto:victor.bona@hotmail.com" });
});

test("ls prints the addresses", () => {
  const r = runCommand("ls", index) as { kind: string; lines: string[] };
  assert.equal(r.kind, "print");
  assert.equal(r.lines.length, 10);
  assert.match(r.lines[0], /P100/);
});

test("empty, blank and unknown input print help without throwing", () => {
  for (const input of ["", "   ", "rm -rf /", "help"]) {
    const r = runCommand(input, index) as { kind: string; lines: string[] };
    assert.equal(r.kind, "print", input);
    assert.match(r.lines[0], /help|unknown command/, input);
  }
  assert.equal((runCommand("rm -rf /", index) as { lines: string[] }).lines[0], "unknown command: rm");
});


test("every slug printed in an ambiguity list opens its own entry", () => {
  const collision: IndexEntry[] = [
    { slug: "nidus-whitepaper", title: "Nidus: Explicit Application Composition", href: "/articles/nidus-whitepaper", kind: "paper" },
    { slug: "nidus", title: "Nidus", href: "/projects", kind: "system" },
  ];
  const r = runCommand("open nid", collision) as { kind: string; lines: string[] };
  assert.equal(r.kind, "print");
  for (const e of collision) {
    assert.ok(r.lines.some((l) => l.includes(` ${e.slug} `)), e.slug);
    assert.deepEqual(runCommand(`open ${e.slug}`, collision), { kind: "navigate", href: e.href, echo: `→ ${e.title}` });
  }
  assert.equal((runCommand("open NIDUS", collision) as { href: string }).href, "/projects");
});

test("cd reaches the extra pages", () => {
  assert.deepEqual(runCommand("cd now", index), { kind: "navigate", href: "/now", echo: "→ Now" });
  assert.equal((runCommand("cd research", index) as { href: string }).href, "/research");
});

test("searchIndex needs every word, ranks title hits first", () => {
  const withText: IndexEntry[] = [
    ...index,
    { slug: "rust-dsl", title: "A DSL", href: "/blog/rust-dsl", kind: "post", text: "axum modules in rust" },
  ];
  assert.deepEqual(searchIndex(withText, "axum").map((e) => e.slug), ["nidus-whitepaper", "rust-dsl"]);
  assert.deepEqual(searchIndex(withText, "axum rust").map((e) => e.slug), ["rust-dsl"]);
  assert.deepEqual(searchIndex(withText, "   "), []);
});

test("grep prints matches or a miss", () => {
  const hit = runCommand("grep locus", index) as { lines: string[] };
  assert.match(hit.lines[1], /locus-whitepaper/);
  assert.deepEqual(runCommand("grep zzz", index), { kind: "print", lines: ["no matches for zzz"] });
});
