import { test } from "node:test";
import assert from "node:assert/strict";
import { toStroke } from "./status.ts";

test("project statuses map to strokes", () => {
  assert.equal(toStroke("completed"), "live");
  assert.equal(toStroke("in-progress"), "live");
  assert.equal(toStroke("maintained"), "maintained");
  assert.equal(toStroke("stopped"), "archived");
  assert.equal(toStroke("sold"), "archived");
});

test("published papers are live", () => {
  assert.equal(toStroke("published"), "live");
  assert.equal(toStroke("preprint"), "live");
  assert.equal(toStroke("independently published"), "live");
});

test("unknown status falls back to maintained", () => {
  assert.equal(toStroke("draft"), "maintained");
  assert.equal(toStroke("whatever"), "maintained");
});
