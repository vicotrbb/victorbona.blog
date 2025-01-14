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
  const [showDropdown, setShowDropdown] = useState(false);

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

  return (
    <div className="relative">
      <button
        onClick={share}
        className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
      >
        {copied ? "Copied!" : "Share"}
      </button>

      {showDropdown && !navigator.share && (
        <div className="absolute right-0 mt-2 py-2 w-48 bg-white dark:bg-neutral-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
          <button
            onClick={() => shareToSocial("twitter")}
            className="block w-full px-4 py-2 text-sm text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            Share on Twitter
          </button>
          <button
            onClick={() => shareToSocial("facebook")}
            className="block w-full px-4 py-2 text-sm text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            Share on Facebook
          </button>
          <button
            onClick={() => shareToSocial("linkedin")}
            className="block w-full px-4 py-2 text-sm text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            Share on LinkedIn
          </button>
          <button
            onClick={copyToClipboard}
            className="block w-full px-4 py-2 text-sm text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
}
