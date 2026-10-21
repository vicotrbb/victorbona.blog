"use client";

import React, { useState, useEffect } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const article = document.querySelector("article");
      if (!article) return;

      const scrollableHeight = article.offsetTop + article.clientHeight - window.innerHeight;

      if (scrollableHeight <= 0) {
        setProgress(100);
        return;
      }

      setProgress(Math.min(100, Math.max(0, (window.scrollY / scrollableHeight) * 100)));
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div aria-hidden="true" className="fixed left-0 top-0 z-50 h-[2px] w-full">
      <div className="h-full bg-[var(--lit)]" style={{ width: `${progress}%` }} />
    </div>
  );
}
