"use client";

import { track } from "@vercel/analytics/react";
import { useState } from "react";

export function ShareButton({
  url,
  title,
  slug,
}: {
  url: string;
  title: string;
  slug: string;
}) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (err) {
        // User cancelled or share failed
        console.error("Share failed:", err);
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Copy failed:", err);
      }
    }

    track("Share", { slug });
  };

  return (
    <button
      onClick={share}
      className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
    >
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
