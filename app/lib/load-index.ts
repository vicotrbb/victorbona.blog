import type { IndexEntry } from "./terminal";

// Client-side: fetched once on first use, then shared by the terminal and /search.
let indexPromise: Promise<IndexEntry[]> | null = null;
export function loadIndex(): Promise<IndexEntry[]> {
  indexPromise ??= fetch("/terminal-index.json")
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => {
      indexPromise = null;
      return [];
    });
  return indexPromise;
}
