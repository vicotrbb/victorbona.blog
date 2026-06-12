import { getBlogPosts, getTags } from "app/blog/utils";
import { getArticles } from "app/articles/articles";
import { compendiumCollections } from "app/compendium/collections";
import { getCompendiumNotes } from "app/compendium/utils";

export const baseUrl = "https://blog.victorbona.dev";

export default async function sitemap() {
  const today = new Date().toISOString().split("T")[0];
  const posts = getBlogPosts();

  let blogs = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }));

  let tags = getTags(posts).map((tag) => ({
    url: `${baseUrl}/blog/tag/${encodeURIComponent(tag)}`,
    lastModified: today,
  }));

  let articles = getArticles().map((article) => ({
    url: `${baseUrl}/articles/${article.slug}`,
    lastModified: article.publishedAt,
  }));

  let compendiumCollectionRoutes = compendiumCollections.map((collection) => ({
    url: `${baseUrl}${collection.route}`,
    lastModified: today,
  }));

  let compendiumNoteRoutes = compendiumCollections.flatMap((collection) =>
    getCompendiumNotes(collection.id).map((note) => ({
      url: `${baseUrl}/compendium/${note.collection}/${note.slug}`,
      lastModified: today,
    }))
  );

  let routes = [
    "",
    "/blog",
    "/projects",
    "/articles",
    "/compendium",
    "/rss",
    "/llms.txt",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: today,
  }));

  return [
    ...routes,
    ...blogs,
    ...tags,
    ...articles,
    ...compendiumCollectionRoutes,
    ...compendiumNoteRoutes,
  ];
}
