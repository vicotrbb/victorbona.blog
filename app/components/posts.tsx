import { getBlogPosts } from "app/blog/utils";
import { WritingRow } from "./WritingRow";

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
    <div className="border border-[var(--color-border)] px-3">
      {allBlogs
        .sort(
          (a, b) =>
            new Date(b.metadata.publishedAt).getTime() -
            new Date(a.metadata.publishedAt).getTime()
        )
        .slice(0, limit)
        .map((post) => (
          <WritingRow
            key={post.slug}
            slug={post.slug}
            title={post.metadata.title}
            summary={post.metadata.summary}
            publishedAt={post.metadata.publishedAt}
            tags={post.metadata.tags}
            content={post.content}
          />
        ))}
    </div>
  );
}
