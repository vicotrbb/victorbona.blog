import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function listFiles(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return listFiles(entryPath);
    }

    return entry.isFile() ? [entryPath] : [];
  });
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

function assertRouteMetadataUsesDefaultImages(file) {
  const content = read(file);

  if (content.includes("openGraph:")) {
    assert(
      content.includes("withDefaultOpenGraphImage("),
      `${file} should wrap openGraph metadata with withDefaultOpenGraphImage`
    );
  }

  if (content.includes("twitter:")) {
    assert(
      content.includes("withDefaultTwitterImage("),
      `${file} should wrap twitter metadata with withDefaultTwitterImage`
    );
  }
}

function hasRouteMetadata(file) {
  const content = read(file);

  return (
    content.includes("export const metadata") ||
    content.includes("function generateMetadata")
  );
}

assertNotIncludes(
  "app/blog/[slug]/page.tsx",
  "title: `${post.metadata.title} | Victor Bona Blog`"
);
assertNotIncludes("app/articles/[slug]/page.tsx", "title: `${article.title} | Victor Bona`");

for (const route of [
  '"/about"',
  '"/projects"',
  '"/articles"',
  '"/compendium"',
  '"/rss"',
  '"/llms.txt"',
  "getTags",
  "getArticles",
  "compendiumCollections",
  "getCompendiumNotes",
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
  "getCompendiumNoteJsonLd",
  "getItemListJsonLd",
  "ProfilePage",
  "SoftwareSourceCode",
]) {
  assertIncludes("app/lib/seo.ts", schema);
}
assertNotIncludes("app/lib/seo.ts", "articleBody: note.content");
assertIncludes("app/lib/profile.ts", "victor.bona@hotmail.com");
assertNotIncludes("app/lib/seo.ts", "victor@victorbona.dev");
assertNotIncludes("app/llms.txt/route.ts", "victor@victorbona.dev");
assertNotIncludes("app/lib/seo.ts", "Full-stack engineer");

for (const routeFile of [
  "app/blog/[slug]/page.tsx",
  "app/articles/[slug]/page.tsx",
  "app/blog/page.tsx",
  "app/about/page.tsx",
  "app/projects/page.tsx",
  "app/articles/page.tsx",
  "app/compendium/page.tsx",
  "app/compendium/[collection]/page.tsx",
  "app/compendium/[collection]/[slug]/page.tsx",
]) {
  assertIncludes(routeFile, "application/ld+json");
}

for (const routeFile of listFiles("app")
  .filter((file) => file.endsWith(".tsx"))
  .filter(hasRouteMetadata)) {
  assertRouteMetadataUsesDefaultImages(routeFile);
}

assertIncludes("app/lib/seo.ts", "defaultOpenGraphImage");
assertIncludes("app/lib/seo.ts", "withDefaultOpenGraphImage");
assertIncludes("app/lib/seo.ts", "withDefaultTwitterImage");

assertIncludes("app/llms.txt/route.ts", "Canonical Topics");
assertIncludes("app/llms.txt/route.ts", "Best First-Hand Sources");
assertIncludes("app/llms.txt/route.ts", "Compendium");
assertIncludes("app/llms.txt/route.ts", "formatCompendium");
assertIncludes("app/llms.txt/route.ts", "absoluteUrl");

assertIncludes("app/rss/route.ts", "<guid isPermaLink=\"true\">");
assertIncludes("app/rss/route.ts", "escapeXml");
assertIncludes("app/components/ControlPlane.tsx", "<ol");
assertIncludes("app/components/ControlPlane.tsx", "prefers-reduced-motion");

assertIncludes("app/rss/route.ts", 'xmlns:atom="http://www.w3.org/2005/Atom"');
assertIncludes("app/rss/route.ts", 'rel="self"');
assertIncludes("app/rss/route.ts", "getArticles");
assertIncludes("app/blog/tag/[tag]/page.tsx", "encodeURIComponent");
assertIncludes("app/lib/seo.ts", "export function ogImage(");
for (const routeFile of [
  "app/about/page.tsx",
  "app/articles/page.tsx",
  "app/articles/[slug]/page.tsx",
  "app/projects/page.tsx",
  "app/compendium/page.tsx",
  "app/compendium/[collection]/page.tsx",
  "app/compendium/[collection]/[slug]/page.tsx",
  "app/blog/tag/[tag]/page.tsx",
]) {
  assertIncludes(routeFile, "ogImage(");
}
assertIncludes("app/blog/utils.ts", "updatedAt?: string");
assertIncludes("app/lib/seo.ts", "post.metadata.updatedAt || post.metadata.publishedAt");
assertNotIncludes("app/sitemap.ts", "new Date().toISOString()");
assertIncludes("app/not-found.tsx", "httpRequestsCounter.inc(");
assertIncludes("app/not-found.tsx", "route not found:");
assertIncludes("app/not-found.tsx", "index: false");

console.log("SEO smoke checks passed");
