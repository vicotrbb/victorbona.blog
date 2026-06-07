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
      const scrolled = window.scrollY;

      const percentage = (scrolled / (totalHeight - windowHeight)) * 100;
      setProgress(Math.min(100, Math.max(0, percentage)));
    };

    window.addEventListener("scroll", updateProgress);
    return () => window.removeEventListener("scroll", updateProgress);
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
