import Link from "next/link";

interface TagProps {
  name: string;
  className?: string;
}

export function Tag({ name, className = "" }: TagProps) {
  return (
    <Link
      href={`/blog/tag/${encodeURIComponent(name.trim())}`}
      className={`metadata-type inline-block rounded-sm border border-[var(--color-border)] px-2 py-1 text-[var(--color-muted-foreground)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-foreground)] ${className}`}
    >
      {name.trim()}
    </Link>
  );
}
