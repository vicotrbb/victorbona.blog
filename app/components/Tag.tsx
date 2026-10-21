import Link from "next/link";

interface TagProps {
  name: string;
  className?: string;
}

export function Tag({ name, className = "" }: TagProps) {
  const label = name.trim();

  return (
    <Link
      href={`/blog/tag/${encodeURIComponent(label.toLowerCase())}`}
      className={`text-[var(--dim)] decoration-1 underline-offset-4 transition-colors duration-150 hover:text-[var(--text)] hover:underline ${className}`}
    >
      {label}
    </Link>
  );
}
