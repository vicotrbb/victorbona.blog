export interface Article {
  slug: string;
  title: string;
  abstract: string;
  authors: string[];
  publishedAt: string;
  journal?: string;
  doi?: string;
  tags: string[];
  type: "paper" | "article";
  status: "published" | "preprint" | "draft" | "independently published";
  pdfUrl?: string;
  citationKey?: string;
}

export const articles: Article[] = [
  {
    slug: "the-missing-http-verb-strut",
    title: "The Missing HTTP Verb: STRUT",
    abstract:
      "A position paper proposing STRUT, an idempotent but unsafe HTTP method for server-driven, minimal-input resource creation. The paper defines candidate semantics, compares the method with POST plus Idempotency-Key, conditional PUT, WebDAV, and Prefer, and discusses security, caching, intermediaries, browser behavior, and deployment.",
    authors: ["Victor Bona"],
    publishedAt: "2026-06-07",
    tags: ["HTTP", "REST", "API Design", "Web Standards", "Idempotency"],
    type: "paper",
    status: "independently published",
    pdfUrl: "/papers/the-missing-http-verb-strut.pdf",
    citationKey: "bona2026strut",
  },
  // {
  //   slug: "performance-optimization-techniques",
  //   title: "Advanced Performance Optimization Techniques in Web Applications",
  //   abstract: "A comprehensive study of performance optimization strategies for modern web applications, including lazy loading, code splitting, and runtime optimization techniques.",
  //   authors: ["Victor Bona"],
  //   publishedAt: "2023-11-22",
  //   journal: "Journal of Web Engineering",
  //   doi: "10.1000/182",
  //   tags: ["performance", "web development", "optimization", "javascript"],
  //   type: "paper",
  //   status: "published",
  //   citationKey: "bona2023performance",
  // },
];

export function getArticles(): Article[] {
  return articles.sort((a, b) => {
    if (new Date(a.publishedAt) > new Date(b.publishedAt)) {
      return -1;
    }
    return 1;
  });
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}

export function getArticlesByTag(tag: string): Article[] {
  return articles.filter((article) =>
    article.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

export function getPublishedArticles(): Article[] {
  return articles.filter((article) => article.status === "published");
}
