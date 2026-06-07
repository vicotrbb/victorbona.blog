"use client";

import React, { useState, useEffect } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const article = document.querySelector("article");
      if (!article) return;

      const totalHeight = article.clientHeight;
      const windowHeight = window.innerHeight;
      const scrollableHeight = totalHeight - windowHeight;
      const scrolled = window.scrollY;

      if (scrollableHeight <= 0) {
        setProgress(100);
        return;
      }

      const percentage = (scrolled / scrollableHeight) * 100;
      setProgress(Math.min(100, Math.max(0, percentage)));
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress);
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div className="fixed left-0 top-0 z-50 h-1 w-full bg-[var(--color-border)]">
      <div
        className="h-full bg-[var(--color-accent)] transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
