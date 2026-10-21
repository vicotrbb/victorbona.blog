"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { addresses } from "app/lib/addresses";

const isCurrent = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

export function Navbar() {
  const pathname = usePathname() ?? "/";
  const row = useRef<HTMLUListElement>(null);
  // Server renders the Mac label; swap after mount so hydration matches.
  const [shortcut, setShortcut] = useState("⌘K");
  useEffect(() => {
    if (!/Mac|iPhone|iPad/.test(navigator.platform)) setShortcut("Ctrl K");
  }, []);

  // On narrow screens the address row scrolls; keep the current page in view.
  useEffect(() => {
    const el = row.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (row.current && el) row.current.scrollLeft = el.offsetLeft - 16;
  }, [pathname]);

  return (
    <header className="border-b border-[var(--line)]">
      <nav
        aria-label="Primary"
        className="mx-auto flex w-full max-w-[var(--max-shell)] flex-wrap items-center gap-x-8 px-4 sm:px-6 lg:px-8"
      >
        <Link
          href="/"
          className="order-1 py-4 font-mono text-sm font-semibold tracking-tight text-[var(--text)] hover:text-[var(--lit)]"
        >
          victor-bona
        </Link>
        <ul ref={row} className="relative order-3 -mx-4 flex w-[calc(100%+2rem)] overflow-x-auto border-t border-[var(--line)] px-4 [scrollbar-width:none] sm:-mx-6 sm:w-[calc(100%+3rem)] sm:px-6 lg:order-2 lg:mx-0 lg:w-auto lg:flex-1 lg:border-t-0 lg:px-0">
          {addresses.map(({ code, label, href }) => {
            const current = isCurrent(pathname, href);
            return (
              <li key={code} className="shrink-0">
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={`-mb-px flex items-baseline gap-2 border-b px-3 py-3 text-sm transition-colors duration-150 lg:py-4 ${
                    current
                      ? "border-[var(--lit)] text-[var(--text)]"
                      : "border-transparent text-[var(--dim)] hover:text-[var(--text)]"
                  }`}
                >
                  <span
                    className={`font-mono text-xs ${
                      current ? "font-bold text-[var(--lit)]" : "font-normal"
                    }`}
                  >
                    {code}
                  </span>
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          href="/search"
          aria-current={pathname === "/search" ? "page" : undefined}
          className="order-2 ml-auto inline-flex min-h-8 items-center px-2 py-1 font-mono text-xs text-[var(--dim)] transition-colors duration-150 hover:text-[var(--text)] aria-[current=page]:text-[var(--text)] lg:order-3"
        >
          search
        </Link>
        <button
          type="button"
          data-terminal-open
          aria-label="Open terminal"
          className="order-2 -ml-6 inline-flex min-h-8 min-w-8 items-center justify-center border border-[var(--line)] px-2 py-1 font-mono text-xs text-[var(--dim)] transition-colors duration-150 hover:border-[var(--line-strong)] hover:text-[var(--text)] lg:order-3"
        >
          <kbd>{shortcut}</kbd>
        </button>
      </nav>
    </header>
  );
}
