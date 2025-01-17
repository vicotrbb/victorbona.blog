import Link from "next/link";
import { formatDate, getBlogPosts } from "app/blog/utils";

interface BlogPostsProps {
  limit?: number;
  filter?: {
    tag?: string;
  };
}

export function BlogPosts({ limit, filter }: BlogPostsProps) {
  let allBlogs = getBlogPosts();

  // Apply tag filter if specified
  if (!!filter?.tag) {
    allBlogs = allBlogs.filter((post) =>
      post.metadata.tags
        ?.split(",")
        .map((t) => t.trim())
        .includes(filter.tag!)
    );
  }

  return (
    <div className="space-y-8">
      {allBlogs
        .sort(
          (a, b) =>
            new Date(b.metadata.publishedAt).getTime() -
            new Date(a.metadata.publishedAt).getTime()
        )
        .slice(0, limit)
        .map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block group"
          >
            <article className="space-y-2 transition-all">
              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <time dateTime={post.metadata.publishedAt}>
                  {formatDate(post.metadata.publishedAt)}
                </time>
                {post.metadata.tags && (
                  <>
                    <span>•</span>
                    <span>{post.metadata.tags.split(",")[0]}</span>
                  </>
                )}
              </div>

              <h2 className="text-xl font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {post.metadata.title}
              </h2>

              <p className="text-neutral-600 dark:text-neutral-400 line-clamp-2">
                {post.metadata.summary}
              </p>
            </article>
          </Link>
        ))}
    </div>
  );
}
