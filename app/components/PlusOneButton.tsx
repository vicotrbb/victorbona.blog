"use client";

import { useState } from "react";
import { Spinner } from "./Spinner";
import { track } from "@vercel/analytics/react";

export function PlusOneButton({ postSlug }: { postSlug: string }) {
  const [plusOned, setPlusOned] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePlusOne = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/plusone/${postSlug}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug: postSlug }),
      });

      if (response.ok) {
        track("Plus_One", { slug: postSlug });
        setPlusOned(true);
      }
    } catch (err) {
      console.error("+1 failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePlusOne}
      className="flex items-center justify-center text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
      disabled={loading}
    >
      {loading ? <Spinner /> : plusOned ? "+1'd!" : "+1"}
    </button>
  );
}
