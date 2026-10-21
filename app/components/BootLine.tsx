"use client";

import { useEffect, useState } from "react";

const KEY = "cp-booted";
const TYPE_MS = 1100; // whole line typed within the 1.2s budget
const HOLD_MS = 1800;

export function BootLine({ systems, papers }: { systems: number; papers: number }) {
  const text = `boot: victor-bona control-plane · ${systems} systems · ${papers} papers · ready`;
  const [shown, setShown] = useState(-1); // -1 = not a first visit, or not mounted yet
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return;
      localStorage.setItem(KEY, "1");
    } catch {
      return; // storage blocked: skip rather than replay on every page
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(text.length);
      return;
    }
    const step = TYPE_MS / text.length;
    const start = performance.now();
    const id = window.setInterval(() => {
      const n = Math.min(text.length, Math.ceil((performance.now() - start) / step));
      setShown(n);
      if (n === text.length) window.clearInterval(id);
    }, step);
    return () => window.clearInterval(id);
  }, [text]);

  useEffect(() => {
    if (shown !== text.length) return;
    const fade = window.setTimeout(() => setLeaving(true), HOLD_MS);
    const done = window.setTimeout(() => setShown(-1), HOLD_MS + 400);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(done);
    };
  }, [shown, text.length]);

  if (shown < 0) return null;

  // Zero-height anchor: the strip overlays the page top so it never shifts or blocks content.
  return (
    <div aria-hidden="true" className="pointer-events-none relative z-10 h-0">
      <p
        className={`boot-line absolute inset-x-0 top-0 border-b border-[var(--line)] bg-[var(--panel)] font-mono text-xs text-[var(--dim)] ${
          leaving ? "opacity-0" : ""
        }`}
      >
        <span className="mx-auto block max-w-[var(--max-shell)] truncate px-4 py-2 sm:px-6 lg:px-8">
          {shown === text.length ? (
            <>
              {text.slice(0, -"ready".length)}
              <span className="text-[var(--lit)]">ready</span>
            </>
          ) : (
            <>
              {text.slice(0, shown)}
              <span className="text-[var(--lit)]">▍</span>
            </>
          )}
        </span>
      </p>
    </div>
  );
}
