import { test } from "node:test";
import assert from "node:assert/strict";
import { articles } from "./articles.ts";
import { researchThemes } from "./themes.ts";

test("every paper sits in exactly one research theme", () => {
  const placed = researchThemes.flatMap((t) => t.papers);
  assert.deepEqual([...placed].sort(), articles.map((a) => a.slug).sort());
});

test("reading links are site-relative", () => {
  for (const t of researchThemes) for (const r of t.reading) assert.match(r.href, /^\/(projects|compendium)\//);
});
