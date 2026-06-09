import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function assertIncludes(file, expected) {
  const content = read(file);
  assert(
    content.includes(expected),
    `${file} should include ${JSON.stringify(expected)}`
  );
}

function assertNotIncludes(file, unexpected) {
  const content = read(file);
  assert(
    !content.includes(unexpected),
    `${file} should not include ${JSON.stringify(unexpected)}`
  );
}

assertNotIncludes(
  "app/blog/[slug]/page.tsx",
  "title: `${post.metadata.title} | Victor Bona Blog`"
);
assertNotIncludes("app/articles/[slug]/page.tsx", "title: `${article.title} | Victor Bona`");

for (const route of [
  '"/projects"',
  '"/articles"',
  '"/rss"',
  '"/llms.txt"',
  "getTags",
  "getArticles",
]) {
  assertIncludes("app/sitemap.ts", route);
}

for (const bot of [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "ClaudeBot",
  "PerplexityBot",
  "CCBot",
  "Google-Extended",
]) {
  assertIncludes("app/robots.ts", bot);
}

for (const schema of [
  "getPersonJsonLd",
  "getWebsiteJsonLd",
  "getBreadcrumbJsonLd",
  "getBlogPostingJsonLd",
  "getItemListJsonLd",
]) {
  assertIncludes("app/lib/seo.ts", schema);
}

for (const routeFile of [
  "app/blog/[slug]/page.tsx",
  "app/articles/[slug]/page.tsx",
  "app/blog/page.tsx",
  "app/projects/page.tsx",
  "app/articles/page.tsx",
]) {
  assertIncludes(routeFile, "application/ld+json");
}

assertIncludes("app/llms.txt/route.ts", "Canonical Topics");
assertIncludes("app/llms.txt/route.ts", "Best First-Hand Sources");
assertIncludes("app/llms.txt/route.ts", "absoluteUrl");

assertIncludes("app/rss/route.ts", "<guid isPermaLink=\"true\">");
assertIncludes("app/rss/route.ts", "escapeXml");

console.log("SEO smoke checks passed");
