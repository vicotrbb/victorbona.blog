import { test } from "node:test";
import assert from "node:assert/strict";
import { getUniqueHeadingId, slugifyHeading } from "./slug.ts";

test("slugifyHeading", () => {
  assert.equal(slugifyHeading("  Hello World  "), "hello-world");
  assert.equal(slugifyHeading("R&D: What's Next?"), "r-and-d-whats-next");
  assert.equal(slugifyHeading("-- Edge --"), "edge");
});

test("getUniqueHeadingId suffixes duplicates", () => {
  const counts = new Map<string, number>();
  assert.equal(getUniqueHeadingId("Setup", counts), "setup");
  assert.equal(getUniqueHeadingId("Setup", counts), "setup-1");
  assert.equal(getUniqueHeadingId("Other", counts), "other");
  assert.equal(getUniqueHeadingId("Setup", counts), "setup-2");
});
