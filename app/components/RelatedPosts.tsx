import { getBlogPosts } from "app/blog/utils";
import Link from "next/link";

export function RelatedPosts({
  currentSlug,
  tags,
}: {
  currentSlug: string;
  tags: string[];
}) {
  const posts = getBlogPosts()
    .filter(
      (post) =>
        post.slug !== currentSlug &&
        post.metadata.tags.split(",").some((tag) => tags.includes(tag.trim()))
    )
    .slice(0, 3);

  if (posts.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800">
      <h2 className="text-xl font-semibold mb-4">Related Posts</h2>
      <div className="space-y-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block group"
          >
            <h3 className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {post.metadata.title}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              {post.metadata.summary}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
