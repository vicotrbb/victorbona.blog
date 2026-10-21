"use client";

import { track } from "@vercel/analytics/react";
import { useEffect, useRef, useState } from "react";

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
  const [showDropdown, setShowDropdown] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDropdown) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowDropdown(false);
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [showDropdown]);

  const shareToSocial = (platform: string) => {
    let shareUrl = "";

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          title
        )}&url=${encodeURIComponent(url)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url
        )}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          url
        )}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
      track("Share", { slug, platform });
      setShowDropdown(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      track("Share", { slug, platform: "copy" });
    } catch (err) {
      console.error("Copy failed:", err);
    }
    setShowDropdown(false);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        track("Share", { slug, platform: "native" });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  const itemClass =
    "block w-full px-4 py-2 text-left text-[var(--dim)] transition-colors duration-150 hover:bg-[var(--line)] hover:text-[var(--text)]";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={share}
        aria-expanded={showDropdown}
        className="font-mono text-[var(--dim)] transition-colors duration-150 hover:text-[var(--text)]"
      >
        {copied ? "link copied" : "share"}
      </button>

      {showDropdown && !navigator.share && (
        <div className="absolute right-0 z-20 mt-2 w-44 border border-[var(--line-strong)] bg-[var(--panel)] py-1 font-mono text-xs">
          <button type="button" onClick={() => shareToSocial("twitter")} className={itemClass}>
            share on X
          </button>
          <button type="button" onClick={() => shareToSocial("facebook")} className={itemClass}>
            share on Facebook
          </button>
          <button type="button" onClick={() => shareToSocial("linkedin")} className={itemClass}>
            share on LinkedIn
          </button>
          <button type="button" onClick={copyToClipboard} className={itemClass}>
            copy link
          </button>
        </div>
      )}
    </div>
  );
}
