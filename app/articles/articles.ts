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
