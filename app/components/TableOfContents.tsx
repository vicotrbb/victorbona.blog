"use client";

import React, { useEffect, useState } from "react";

type Heading = { id: string; text: string; level: number };

export function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-toc-root] h2[id], [data-toc-root] h3[id]")
    );
    setHeadings(
      elements.map((elem) => ({
        id: elem.id,
        text: elem.textContent || "",
        level: Number(elem.tagName.charAt(1)),
      }))
    );

    // The heading nearest the top third of the viewport is the active one.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "0px 0px -66% 0px" }
    );
    elements.forEach((elem) => observer.observe(elem));
    return () => observer.disconnect();
  }, []);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="Table of contents" className="max-h-[calc(100vh-6rem)] overflow-y-auto">
      <h2 className="mb-3 font-mono text-xs text-[var(--dim)]">contents</h2>
      <ul className="border-l border-[var(--line)] text-sm leading-snug">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={activeId === heading.id ? "location" : undefined}
              className={`-ml-px block border-l py-1.5 pr-2 transition-colors duration-150 hover:text-[var(--text)] ${
                heading.level === 3 ? "pl-7" : "pl-4"
              } ${
                activeId === heading.id
                  ? "border-[var(--lit)] text-[var(--text)]"
                  : "border-transparent text-[var(--dim)]"
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
