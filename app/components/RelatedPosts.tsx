import { getBlogPosts } from "app/blog/utils";
import { WritingRow } from "./WritingRow";

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
    <div className="mt-8 border-t border-[var(--color-border)] pt-5">
      <h2 className="metadata-type mb-2 text-[var(--color-accent)]">
        Related field notes
      </h2>
      <div className="border border-[var(--color-border)] px-3">
        {posts.map((post) => (
          <WritingRow
            key={post.slug}
            slug={post.slug}
            title={post.metadata.title}
            summary={post.metadata.summary}
            publishedAt={post.metadata.publishedAt}
            tags={post.metadata.tags}
            content={post.content}
            compact
          />
        ))}
      </div>
    </div>
  );
}
