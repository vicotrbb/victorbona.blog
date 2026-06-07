const links = [
  { href: "/rss", label: "RSS", external: false },
  {
    href: "https://github.com/vicotrbb/victorbona.blog",
    label: "Source",
    external: true,
  },
  {
    href: "https://www.linkedin.com/in/vicotrbb/",
    label: "LinkedIn",
    external: true,
  },
  { href: "https://x.com/BonaVictor", label: "X", external: true },
  { href: "/llms.txt", label: "llms.txt", external: false },
];

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-[var(--color-border)] py-5 text-sm text-[var(--color-muted-foreground)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>Victor Bona / {new Date().getFullYear()} / MIT</p>
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
