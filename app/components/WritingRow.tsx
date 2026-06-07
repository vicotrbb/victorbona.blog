import Link from "next/link";
import { formatDate, getReadingTime } from "app/blog/utils";
import { MetadataLine } from "./MetadataLine";

type WritingRowProps = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  tags?: string;
  content?: string;
  compact?: boolean;
};

export function WritingRow({
  slug,
  title,
  summary,
  publishedAt,
  tags,
  content,
  compact = false,
}: WritingRowProps) {
  const primaryTag = tags?.split(",")[0]?.trim();
  const readingTime = content ? `${getReadingTime(content)} min` : undefined;

  return (
    <Link
      href={`/blog/${slug}`}
      className="group block border-b border-[var(--color-border)] py-3 last:border-b-0"
    >
      <article className="grid gap-2 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
        <MetadataLine
          items={[formatDate(publishedAt), primaryTag, readingTime]}
        />
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-snug text-[var(--color-foreground)] group-hover:text-[var(--color-accent)]">
            {title}
          </h3>
          {!compact && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              {summary}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
