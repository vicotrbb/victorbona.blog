import { getBlogPosts } from "app/blog/utils";
import { BlogPosts } from "app/components/posts";
import { baseUrl } from "app/sitemap";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const posts = getBlogPosts();
  const tags = new Set(
    posts.flatMap((post) => post.metadata.tags?.split(",").map((t) => t.trim()))
  );

  return Array.from(tags).map((tag) => ({
    tag: encodeURIComponent(tag),
  }));
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag);

  return {
    title: `Posts tagged with "${tag}"`,
    description: `Browse all articles about ${tag}`,
    openGraph: {
      title: `Posts tagged with "${tag}"`,
      description: `Browse all articles about ${tag}`,
      url: `${baseUrl}/blog/tag/${params.tag}`,
    },
  };
}

export default function TagPage({ params }) {
  const tag = decodeURIComponent(params.tag);
  const posts = getBlogPosts().filter((post) =>
    post.metadata.tags
      ?.split(",")
      .map((t) => t.trim())
      .includes(tag)
  );

  if (posts.length === 0) {
    notFound();
  }

  return (
    <section>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tighter mb-4">
          Posts tagged with "{tag}"
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          {posts.length} {posts.length === 1 ? "post" : "posts"} found
        </p>
      </div>
      <BlogPosts filter={{ tag }} />
    </section>
  );
}
