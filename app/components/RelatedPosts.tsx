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
    <section aria-labelledby="related-posts">
      <h2 id="related-posts" className="mb-4 font-mono text-sm text-[var(--dim)]">
        <span aria-hidden="true">$ </span>ls writing/ --related
      </h2>
      <ol className="border-b border-[var(--line)]">
        {posts.map((post) => (
          <WritingRow
            key={post.slug}
            slug={post.slug}
            title={post.metadata.title}
            publishedAt={post.metadata.publishedAt}
            tags={post.metadata.tags}
          />
        ))}
      </ol>
    </section>
  );
}
