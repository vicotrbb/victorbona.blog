"use client";

import React from "react";

export function ArticleWrapper({ children }: { children: React.ReactNode }) {
  return <article className="prose">{children}</article>;
}
