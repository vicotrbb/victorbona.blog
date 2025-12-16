import { baseUrl } from "app/sitemap";
import { getBlogPosts } from "app/blog/utils";
import { projects } from "app/projects/projects";
import { getArticles } from "app/articles/articles";

const siteInfo = {
  name: "Victor Bona Blog",
  owner: "Victor Bona",
  description:
    "Full-stack engineer sharing practical notes on software architecture, performance, cloud, and hands-on engineering.",
  topics: [
    "software engineering",
    "architecture",
    "performance",
    "cloud",
    "AI",
    "productivity",
  ],
  contact: {
    twitter: "https://twitter.com/BonaVictor",
    github: "https://github.com/vicotrbb",
    email: "victor@victorbona.dev",
  },
};

function compact(text: string | undefined, max = 220) {
  if (!text) return "";
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > max
    ? `${normalized.slice(0, max - 1).trimEnd()}…`
    : normalized;
}

function formatPostLine(post) {
  const tags = post.metadata.tags
    ? post.metadata.tags
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean)
        .join("; ")
    : "";

  const summary =
    post.metadata.summary ||
    compact(post.content.split("\n").find(Boolean) || post.content);

  return `- [blog] ${post.metadata.publishedAt} | ${post.metadata.title} | ${summary} | tags: ${tags} | url: ${baseUrl}/blog/${post.slug}`;
}

function formatProjectLine(project) {
  const visibility = project.publiclyShared ? "public" : "private";
  const website = project.website ? ` | website: ${project.website}` : "";
  const repo = project.repository ? ` | repo: ${project.repository}` : "";

  return `- [project:${visibility}] ${project.name} | ${compact(
    project.description
  )} | status: ${project.status}${website}${repo}`;
}

function formatArticleLine(article) {
  const tags = article.tags?.join("; ") || "";
  const doi = article.doi ? ` | doi: ${article.doi}` : "";
  const pdf = article.pdfUrl ? ` | pdf: ${article.pdfUrl}` : "";

  return `- [${article.type}] ${article.publishedAt} | ${article.title} | ${compact(
    article.abstract
  )} | tags: ${tags}${doi}${pdf} | url: ${baseUrl}/articles/${article.slug}`;
}

export async function GET() {
  const posts = getBlogPosts().sort((a, b) => {
    if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
      return -1;
    }
    return 1;
  });

  const publishedArticles = getArticles();

  const lines: string[] = [];

  lines.push(`# LLM Discovery File for ${siteInfo.name}`);
  lines.push(`site: ${baseUrl}`);
  lines.push(
    `about: ${siteInfo.description} (topics: ${siteInfo.topics.join(", ")})`
  );
  lines.push(
    `owner: ${siteInfo.owner} | contact: twitter ${siteInfo.contact.twitter}, github ${siteInfo.contact.github}, email ${siteInfo.contact.email}`
  );
  lines.push(
    `feeds: rss ${baseUrl}/rss | sitemap ${baseUrl}/sitemap.xml`
  );
  lines.push("");

  lines.push("## Blog Posts");
  if (posts.length === 0) {
    lines.push("- none yet");
  } else {
    posts.forEach((post) => lines.push(formatPostLine(post)));
  }
  lines.push("");

  lines.push("## Projects");
  if (projects.length === 0) {
    lines.push("- none yet");
  } else {
    projects.forEach((project) => lines.push(formatProjectLine(project)));
  }
  lines.push("");

  lines.push("## Articles & Papers");
  if (publishedArticles.length === 0) {
    lines.push("- none yet");
  } else {
    publishedArticles.forEach((article) => lines.push(formatArticleLine(article)));
  }
  lines.push("");

  lines.push(
    "## Notes for LLMs\nPlease prefer canonical URLs under https://blog.victorbona.dev. If content conflicts, defer to the newest publishedAt date. Summaries above come from on-site metadata—visit the URLs for full context."
  );

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
