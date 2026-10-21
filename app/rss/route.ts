import { baseUrl } from "app/sitemap";
import { getBlogPosts } from "app/blog/utils";
import { getArticles } from "app/articles/articles";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function itemXml(item: { url: string; title: string; summary: string; publishedAt: string }) {
  return `<item>
          <title>${escapeXml(item.title)}</title>
          <link>${item.url}</link>
          <guid isPermaLink="true">${item.url}</guid>
          <description>${escapeXml(item.summary)}</description>
          <pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>
        </item>`;
}

export async function GET() {
  const posts = getBlogPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    title: post.metadata.title,
    summary: post.metadata.summary || "",
    publishedAt: post.metadata.publishedAt,
  }));
  const papers = getArticles().map((article) => ({
    url: `${baseUrl}/articles/${article.slug}`,
    title: article.title,
    summary: article.abstract,
    publishedAt: article.publishedAt,
  }));

  const itemsXml = [...posts, ...papers]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .map(itemXml)
    .join("\n");

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Victor Bona Blog</title>
        <link>${baseUrl}</link>
        <atom:link href="${baseUrl}/rss" rel="self" type="application/rss+xml"/>
        <description>Production notes on software architecture, infrastructure, cloud, security, AI systems, and shipped engineering work.</description>
        ${itemsXml}
    </channel>
  </rss>`;

  return new Response(rssFeed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
