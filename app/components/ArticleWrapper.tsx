"use client";

import React, { useState, useEffect } from "react";
import { useReadingProgress } from "app/hooks/useReadingProgress";
import { Toast } from "./Toast";

export function ArticleWrapper({ children }: { children: React.ReactNode }) {
  const [showToast, setShowToast] = useState(false);
  const [toastShown, setToastShown] = useState(false);
  const isReadingComplete = useReadingProgress();

  useEffect(() => {
    if (isReadingComplete && !showToast && !toastShown) {
      setShowToast(true);
      setToastShown(true);
    }
  }, [isReadingComplete]);

  return (
    <React.Fragment>
      <article className="prose">{children}</article>
      {showToast && (
        <Toast
          message="Enjoyed the article? Give it a +1!"
          onClose={() => setShowToast(false)}
        />
      )}
    </React.Fragment>
  );
}
