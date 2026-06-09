import { baseUrl } from "app/sitemap";

export default function robots() {
  const allowedAgents = [
    "Googlebot",
    "Bingbot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "GPTBot",
    "ClaudeBot",
    "PerplexityBot",
    "CCBot",
    "Google-Extended",
    "*",
  ];

  return {
    rules: allowedAgents.map((userAgent) => ({
      userAgent,
      allow: "/",
    })),
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
