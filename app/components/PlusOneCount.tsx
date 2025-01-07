"use client";

import { useEffect, useState } from "react";

export function PlusOneCount({ postSlug }: { postSlug: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch(`/api/plusone/${postSlug}`);
        if (response.ok) {
          const data = await response.json();
          setCount(data.count);
        }
      } catch (err) {
        console.error("Failed to fetch +1 count:", err);
      }
    };

    fetchCount();
  }, [postSlug]);

  return (
    <>
      <span className="text-neutral-600 dark:text-neutral-400">•</span>
      <span className="text-neutral-600 dark:text-neutral-400">
        {count ?? "Loading"} {count === 1 ? "like" : "likes"}
      </span>
    </>
  );
}
