import { getBlogPosts, getTags } from "app/blog/utils";
import { getArticles } from "app/articles/articles";
import { compendiumCollections } from "app/compendium/collections";
import { getCompendiumNotes } from "app/compendium/utils";

export const baseUrl = "https://blog.victorbona.dev";

// ISO YYYY-MM-DD strings sort chronologically.
function newest(dates: string[]) {
  return dates.reduce((a, b) => (b > a ? b : a), "");
}

export default async function sitemap() {
  const posts = getBlogPosts();
  const postDate = (post: (typeof posts)[number]) =>
    post.metadata.updatedAt || post.metadata.publishedAt;
  const latestPost = newest(posts.map(postDate));
  const latestArticle = newest(getArticles().map((article) => article.publishedAt));
  const latestContent = newest([latestPost, latestArticle]);

  let blogs = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: postDate(post),
  }));

  let tags = getTags(posts).map((tag) => ({
    url: `${baseUrl}/blog/tag/${encodeURIComponent(tag)}`,
    lastModified: newest(
      posts
        .filter((post) =>
          post.metadata.tags
            ?.split(",")
            .some((t) => t.trim().toLowerCase() === tag)
        )
        .map(postDate)
    ),
  }));

  let articles = getArticles().map((article) => ({
    url: `${baseUrl}/articles/${article.slug}`,
    lastModified: article.publishedAt,
  }));

  // Compendium notes carry no dates, so they get no lastModified rather than an invented one.
  let compendiumCollectionRoutes = compendiumCollections.map((collection) => ({
    url: `${baseUrl}${collection.route}`,
  }));

  let compendiumNoteRoutes = compendiumCollections.flatMap((collection) =>
    getCompendiumNotes(collection.id).map((note) => ({
      url: `${baseUrl}/compendium/${note.collection}/${note.slug}`,
    }))
  );

  const indexDates: Record<string, string | undefined> = {
    "": latestContent,
    "/about": latestContent,
    "/blog": latestPost,
    "/projects": latestContent,
    "/articles": latestArticle,
    "/compendium": undefined,
    "/rss": latestContent,
    "/llms.txt": latestContent,
  };

  let routes = Object.entries(indexDates).map(([route, lastModified]) => ({
    url: `${baseUrl}${route}`,
    ...(lastModified && { lastModified }),
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
