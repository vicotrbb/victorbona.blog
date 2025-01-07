"use client";

import { useEffect, useState } from "react";
import { XIcon } from "./icons/XIcon";
import { ArrowUpIcon } from "./icons/ArrowUpIcon";

export function Toast({
  message,
  duration = 5000,
  onClose,
}: {
  message: string;
  duration?: number;
  onClose?: () => void;
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      onClose?.();
    }, 100);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in border border-neutral-200 dark:border-neutral-800 flex items-center gap-4">
      <span>{message}</span>
      <button
        onClick={scrollToTop}
        className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
        aria-label="Scroll to top"
      >
        <ArrowUpIcon />
      </button>
      <button
        onClick={handleClose}
        className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
        aria-label="Close notification"
      >
        <XIcon />
      </button>
    </div>
  );
}
