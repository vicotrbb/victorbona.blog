import Link from "next/link";

type SectionHeaderProps = {
  index: string;
  title: string;
  description?: string;
  href?: string;
  actionLabel?: string;
};

export function SectionHeader({
  index,
  title,
  description,
  href,
  actionLabel = "Open",
}: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4 border-b border-[var(--color-rule)] pb-2">
      <div className="min-w-0">
        <p className="metadata-type text-[var(--color-accent)]">[{index}]</p>
        <h2 className="display-type text-xl font-semibold text-[var(--color-foreground)]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
            {description}
          </p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
