import { getBlogPosts } from "app/blog/utils";
import { WritingRow } from "./WritingRow";

interface BlogPostsProps {
  filter?: {
    tag?: string;
  };
}

export function BlogPosts({ filter }: BlogPostsProps) {
  let allBlogs = getBlogPosts();

  if (filter?.tag) {
    allBlogs = allBlogs.filter((post) =>
      post.metadata.tags
        ?.split(",")
        .map((t) => t.trim().toLowerCase())
        .includes(filter.tag!.toLowerCase())
    );
  }

  const sorted = [...allBlogs].sort((a, b) => String(b.metadata.publishedAt).localeCompare(String(a.metadata.publishedAt)));

  if (sorted.length === 0) {
    return <p className="font-mono text-sm text-[var(--dim)]">No posts match this view yet.</p>;
  }

  const years = new Map<string, typeof sorted>();
  for (const post of sorted) {
    const year = String(post.metadata.publishedAt).slice(0, 4);
    years.set(year, [...(years.get(year) ?? []), post]);
  }

  return (
    <div className="space-y-12">
      {Array.from(years).map(([year, posts]) => (
        <section key={year} aria-labelledby={`year-${year}`} className="grid gap-x-8 gap-y-3 md:grid-cols-[6rem_minmax(0,1fr)]">
          <h2 id={`year-${year}`} className="font-mono text-sm tabular-nums text-[var(--dim)] md:pt-3">
            {year}
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
      ))}
    </div>
  );
}
