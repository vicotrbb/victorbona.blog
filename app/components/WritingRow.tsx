import Link from "next/link";

type WritingRowProps = {
  slug: string;
  title: string;
  publishedAt: string;
  tags?: string;
};

export function WritingRow({ slug, title, publishedAt, tags }: WritingRowProps) {
  const tagList = tags?.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 3) ?? [];

  return (
    <li className="border-t border-[var(--line)]">
      <Link
        href={`/blog/${slug}`}
        className="group grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto] sm:items-baseline"
      >
        <time dateTime={publishedAt} className="font-mono text-xs tabular-nums text-[var(--dim)]">
          {publishedAt.slice(0, 10)}
        </time>
        <span className="text-[var(--text)] decoration-[var(--lit)] decoration-1 underline-offset-4 group-hover:underline">
          {title}
        </span>
        {tagList.length > 0 && (
          <span className="font-mono text-xs text-[var(--dim)] sm:max-w-[22rem] sm:truncate sm:text-right">
            {tagList.join(", ")}
          </span>
        )}
      </Link>
    </li>
  );
}
