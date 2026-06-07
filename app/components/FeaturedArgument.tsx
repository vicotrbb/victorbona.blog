import Link from "next/link";
import { formatDate, getReadingTime } from "app/blog/utils";
import { MetadataLine } from "./MetadataLine";

type FeaturedArgumentProps = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  tags: string;
  content: string;
};

export function FeaturedArgument({
  slug,
  title,
  summary,
  publishedAt,
  tags,
  content,
}: FeaturedArgumentProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group block min-h-full border border-[var(--color-rule)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]"
    >
      <MetadataLine
        items={[
          formatDate(publishedAt),
          `${getReadingTime(content)} min`,
          tags.split(",")[0]?.trim(),
        ]}
      />
      <h2 className="display-type mt-3 text-2xl font-semibold leading-tight text-[var(--color-foreground)] group-hover:text-[var(--color-accent)]">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        {summary}
      </p>
      <p className="metadata-type mt-5 text-[var(--color-accent)]">
        Read the argument
      </p>
    </Link>
  );
}
