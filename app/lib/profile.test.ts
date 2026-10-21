import { test } from "node:test";
import assert from "node:assert/strict";
import { isPending, personJsonLd, profile } from "./profile.ts";

test("isPending", () => {
  assert.equal(isPending(null), true);
  assert.equal(isPending(undefined), true);
  assert.equal(isPending([]), true);
  assert.equal(isPending(3), false);
  assert.equal(isPending([1]), false);
});

test("one-liner is verbatim", () => {
  assert.equal(
    profile.oneLiner,
    "Senior Software Engineer, Distributed systems specialist and AI enthusiast"
  );
});

test("personJsonLd has no nulls and senior identity", () => {
  const ld = personJsonLd(profile, "https://example.com");
  const json = JSON.stringify(ld);
  assert.ok(!json.includes("null"));
  assert.ok(json.includes('"jobTitle":"Senior Software Engineer"'));
  assert.ok(json.includes("mailto:victor.bona@hotmail.com"));
  assert.equal(ld["@id"], "https://example.com/#victor-bona");
  assert.ok(!("image" in ld));
  assert.ok(ld.knowsAbout.includes("Distributed systems"));
  assert.equal(ld.sameAs.length, 3);
});

test("personJsonLd adds image when headshot set", () => {
  const ld = personJsonLd({ ...profile, headshot: "/me.jpg" }, "https://example.com");
  assert.equal(ld.image, "https://example.com/me.jpg");
});
