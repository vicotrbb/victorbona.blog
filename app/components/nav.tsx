import Link from "next/link";

const navItems = [
  { href: "/blog", label: "Writing" },
  { href: "/projects", label: "Systems" },
  { href: "/articles", label: "Papers" },
  { href: "/compendium", label: "Compendium" },
];

export function Navbar() {
  return (
    <header className="mb-6 border-b border-[var(--color-border)] pb-3">
      <nav className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="display-type text-lg font-semibold text-[var(--color-foreground)]"
        >
          Victor Bona
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-sm px-2 py-1 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
