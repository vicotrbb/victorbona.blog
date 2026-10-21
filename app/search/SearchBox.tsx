"use client";

import { useEffect, useMemo, useState } from "react";
import { searchIndex, type IndexEntry } from "app/lib/terminal";
import { loadIndex } from "app/lib/load-index";

const kindLabel: Record<IndexEntry["kind"], string> = { post: "post", paper: "paper", system: "system", note: "note" };

export function SearchBox() {
  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get("q") ?? "");
    loadIndex().then(setIndex);
  }, []);

  // Keep the URL shareable without adding a history entry per keystroke.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  }, [query]);

  const hits = useMemo(() => (index ? searchIndex(index, query) : []), [index, query]);

  return (
    <div>
      <label className="flex items-center gap-3 border border-[var(--line-strong)] bg-[var(--panel)] px-4 py-3 font-mono text-sm focus-within:border-[var(--lit)]">
        <span aria-hidden="true" className="font-bold text-[var(--lit)]">$ grep</span>
        <span className="sr-only">Search posts, papers, systems and notes</span>
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="raft, ebpf, observability"
          autoComplete="off"
          spellCheck={false}
          className="min-h-8 flex-1 bg-transparent text-[var(--text)] outline-none placeholder:text-[var(--dim)]"
        />
      </label>

      <p role="status" className="mt-4 font-mono text-xs text-[var(--dim)] sm:text-sm">
        {!index
          ? "loading index..."
          : !query.trim()
            ? `${index.length} entries indexed`
            : `${hits.length}${hits.length === 50 ? "+" : ""} matches`}
      </p>

      {hits.length > 0 && (
        <ol className="mt-4 border-b border-[var(--line)]">
          {hits.map((e) => (
            <li key={`${e.kind}:${e.href}:${e.slug}`} className="grid grid-cols-[4rem_minmax(0,1fr)] gap-x-4 border-t border-[var(--line)] py-4">
              <span className="pt-0.5 font-mono text-xs text-[var(--dim)]">{kindLabel[e.kind]}</span>
              <div className="min-w-0">
                <a href={e.href} className="text-[var(--text)] decoration-[var(--lit)] decoration-1 underline-offset-4 hover:underline">
                  {e.title}
                </a>
                {e.text && <p className="mt-1 line-clamp-2 text-sm text-[var(--dim)]">{e.text}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
