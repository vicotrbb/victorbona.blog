import Link from "next/link";

interface TagProps {
  name: string;
  className?: string;
}

export function Tag({ name, className = "" }: TagProps) {
  return (
    <Link
      href={`/blog/tag/${encodeURIComponent(name.trim())}`}
      className={`inline-block px-3 py-1 rounded-full text-sm bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors ${className}`}
    >
      {name.trim()}
    </Link>
  );
}
