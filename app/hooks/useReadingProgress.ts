"use client";

import { useState, useEffect } from "react";

export function useReadingProgress() {
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      // Consider reading complete when user has scrolled 85% of the content
      const readingProgress = (scrollTop + windowHeight) / documentHeight;
      if (readingProgress > 0.95 && !isComplete) {
        setIsComplete(true);
      } else {
        setIsComplete(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isComplete]);

  return isComplete;
}
