import React from "react";

// data-toc-root scopes TableOfContents to the post body's headings.
export function ArticleWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="prose" data-toc-root>
      {children}
    </div>
  );
}
