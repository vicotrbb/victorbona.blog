"use client";

import React, { useEffect, useState } from "react";

export function TableOfContents() {
  const [headings, setHeadings] = useState<
    Array<{ id: string; text: string; level: number }>
  >([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll("h2, h3")).map(
      (elem) => ({
        id: elem.id,
        text: elem.textContent || "",
        level: Number(elem.tagName.charAt(1)),
      })
    );
    setHeadings(elements);
  }, []);

  return (
    <nav className="hidden lg:block sticky top-8 ml-8 w-64">
      <h2 className="text-sm font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
        Table of Contents
      </h2>
      <ul className="space-y-2 text-sm">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 2) * 1}rem` }}
          >
            <a
              href={`#${heading.id}`}
              className={`block py-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                activeId === heading.id
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-neutral-600 dark:text-neutral-400"
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
