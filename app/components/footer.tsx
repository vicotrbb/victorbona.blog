import { profile } from "app/lib/profile";
import { ContactCommand } from "./ContactCommand";

const links = [
  { href: "/now", label: "Now", external: false },
  { href: "/research", label: "Research", external: false },
  { href: profile.links.linkedin, label: "LinkedIn", external: true },
  { href: profile.links.x, label: "X", external: true },
  { href: profile.links.github, label: "GitHub", external: true },
  { href: "/rss", label: "RSS", external: false },
  { href: "/llms.txt", label: "llms.txt", external: false },
  { href: "https://github.com/vicotrbb/victorbona.blog", label: "Source", external: true },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--line)]">
      <div className="mx-auto flex w-full max-w-[var(--max-shell)] flex-col gap-6 px-4 py-8 text-sm sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <ContactCommand variant="inline" />
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="text-[var(--dim)] transition-colors duration-150 hover:text-[var(--text)]"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <p className="mx-auto w-full max-w-[var(--max-shell)] px-4 pb-8 font-mono text-xs text-[var(--dim)] sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Victor Bona · status: <span className="text-[var(--lit)]">Ready</span>
      </p>
    </footer>
  );
}
