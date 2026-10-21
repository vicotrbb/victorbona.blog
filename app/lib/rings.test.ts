import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutRings, type RingInput } from "./rings.ts";

const items = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `i${i}`, title: `Item ${i}`, href: `/x/${i}` }));
const rings: RingInput[] = [
  { id: "systems", label: "Systems", href: "/projects", count: 15, items: items(15) },
  { id: "papers", label: "Papers", href: "/articles", count: 7, items: items(7) },
  { id: "writing", label: "Writing", href: "/blog", count: 0, items: [] },
  { id: "compendium", label: "Compendium", href: "/compendium", count: 150, items: items(150) },
];
const size = 640;
const placed = layoutRings(rings, size);

test("4 rings get 4 strictly increasing radii within size/2", () => {
  assert.equal(placed.length, 4);
  for (let i = 1; i < placed.length; i++) assert.ok(placed[i].r > placed[i - 1].r);
  for (const ring of placed) assert.ok(ring.r <= size / 2);
  assert.ok(Math.abs(placed[0].r - 0.22 * size / 2) < 1e-9);
  assert.ok(Math.abs(placed[3].r - 0.92 * size / 2) < 1e-9);
});

test("an empty ring has no nodes and keeps its count", () => {
  assert.equal(placed[2].nodes.length, 0);
  assert.equal(placed[2].count, 0);
});

test("a 150-item ring is capped at 24 nodes and keeps the real count", () => {
  assert.equal(placed[3].nodes.length, 24);
  assert.equal(placed[3].count, 150);
  assert.equal(layoutRings(rings, size, 5)[3].nodes.length, 5);
});

test("every coordinate is finite and inside [0, size]", () => {
  for (const node of placed.flatMap((r) => r.nodes)) {
    for (const v of [node.x, node.y]) assert.ok(Number.isFinite(v) && v >= 0 && v <= size, `${node.id}: ${v}`);
  }
});
