import { test } from "node:test";
import assert from "node:assert/strict";
import { runCommand, type IndexEntry } from "./terminal.ts";

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
  assert.equal(r.lines.length, 6);
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

test("open counts slug and title matches together, listing slugs to disambiguate", () => {
  const withSystem: IndexEntry[] = [...index, { slug: "nidus", title: "Nidus", href: "/projects", kind: "system" }];
  const r = runCommand("open nidus", withSystem) as { kind: string; lines: string[] };
  assert.equal(r.kind, "print");
  assert.ok(r.lines.some((l) => l.includes("nidus-whitepaper")));
  assert.equal((runCommand("open nidus-whitepaper", withSystem) as { href: string }).href, "/articles/nidus-whitepaper");
});
