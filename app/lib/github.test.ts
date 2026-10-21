import { test } from "node:test";
import assert from "node:assert/strict";
import { repoKey, toActivity, toRepoStats, type RawEvent } from "./github.ts";

const ev = (type: string, repo: string, at: string, payload: RawEvent["payload"] = {}): RawEvent => ({
  type,
  created_at: at,
  repo: { name: repo },
  payload,
});

test("toActivity folds consecutive pushes to one branch and skips noise", () => {
  const rows = toActivity([
    ev("PushEvent", "vicotrbb/positron", "2026-10-21T22:00:00Z", { ref: "refs/heads/main" }),
    ev("PushEvent", "vicotrbb/positron", "2026-10-21T21:00:00Z", { ref: "refs/heads/main" }),
    ev("CreateEvent", "vicotrbb/positron", "2026-10-21T20:30:00Z", { ref: "feature", ref_type: "branch" }),
    ev("PullRequestEvent", "vicotrbb/positron", "2026-10-21T20:00:00Z", { action: "merged", number: 252 }),
    ev("PushEvent", "vicotrbb/positron", "2026-10-21T19:00:00Z", { ref: "refs/heads/main" }),
    ev("WatchEvent", "someone/else", "2026-10-21T18:00:00Z"),
  ]);
  assert.deepEqual(
    rows.map((r) => [r.verb, r.detail, r.count, r.at]),
    [
      ["push", "main", 2, "2026-10-21T22:00:00Z"],
      ["pr merged", "#252", 1, "2026-10-21T20:00:00Z"],
      ["push", "main", 1, "2026-10-21T19:00:00Z"],
    ],
  );
  assert.equal(rows[1].href, "https://github.com/vicotrbb/positron/pull/252");
});

test("toActivity respects the limit", () => {
  const events = ["a", "b", "c"].map((r) => ev("PushEvent", `u/${r}`, "2026-10-21T00:00:00Z", { ref: "refs/heads/main" }));
  assert.equal(toActivity(events, 2).length, 2);
});

test("toRepoStats ignores forks and private repos", () => {
  const s = toRepoStats([
    { full_name: "vicotrbb/Nidus", stargazers_count: 10, pushed_at: "x", fork: false },
    { full_name: "vicotrbb/fork", stargazers_count: 99, pushed_at: "x", fork: true },
    { full_name: "vicotrbb/secret", stargazers_count: 5, pushed_at: "x", fork: false, private: true },
  ]);
  assert.equal(s.stars, 10);
  assert.equal(s.repos, 1);
  assert.equal(s.byRepo["vicotrbb/nidus"].stars, 10);
});

test("repoKey", () => {
  assert.equal(repoKey("https://github.com/guaracloud/E-Navigator"), "guaracloud/e-navigator");
  assert.equal(repoKey("https://github.com/u/r.git"), "u/r");
  assert.equal(repoKey("https://example.com/u/r"), undefined);
  assert.equal(repoKey(undefined), undefined);
});

test("toActivity orders by created_at, not API order", () => {
  const rows = toActivity([
    ev("PushEvent", "u/a", "2026-10-20T00:00:00Z", { ref: "refs/heads/main" }),
    ev("PushEvent", "u/b", "2026-10-21T00:00:00Z", { ref: "refs/heads/main" }),
  ]);
  assert.deepEqual(rows.map((r) => r.repo), ["u/b", "u/a"]);
});
