"use client";

import { useState } from "react";

export function CopyButton({ text, label, done }: { text: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the text stays selectable on the page.
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="font-mono text-xs text-[var(--dim)] transition-colors duration-150 hover:text-[var(--lit)] sm:text-sm"
    >
      <span aria-live="polite">{copied ? done : label}</span>
    </button>
  );
}
