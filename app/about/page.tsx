import Image from "next/image";
import type { Metadata } from "next";
import { baseUrl } from "app/sitemap";
import { getSiteCounts } from "app/lib/counts";
import { isPending, profile } from "app/lib/profile";
import {
  getBreadcrumbJsonLd,
  getProfilePageJsonLd,
  ogImage,
  withDefaultOpenGraphImage,
  withDefaultTwitterImage,
} from "app/lib/seo";
import { ContactCommand } from "app/components/ContactCommand";

const description = `${profile.name}: ${profile.oneLiner}.`;

export const metadata: Metadata = {
  title: "Profile",
  description,
  alternates: { canonical: `${baseUrl}/about` },
  openGraph: withDefaultOpenGraphImage({
    title: "Profile - Victor Bona",
    description,
    url: `${baseUrl}/about`,
    type: "profile",
    images: [ogImage("Profile", "P200 Profile")],
  }),
  twitter: withDefaultTwitterImage({
    card: "summary_large_image",
    title: "Profile - Victor Bona",
    description,
    images: [ogImage("Profile", "P200 Profile")],
  }),
};

// Missing profile data is shown, never invented: Victor has not supplied it yet.
function Pending({ what }: { what: string }) {
  return (
    <span className="font-mono text-xs text-[var(--dim)] sm:text-sm">
      <span className="text-[var(--warn)]">[pending]</span> {what}
    </span>
  );
}

function SectionCommand({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="mb-4 cmd">
      <span aria-hidden="true">$ </span>
      {children}
    </h2>
  );
}

const linkClass =
  "text-[var(--text)] decoration-[var(--lit)] decoration-1 underline-offset-4 hover:underline";

export default function AboutPage() {
  const counts = getSiteCounts();
  const output = [
    { label: "systems", value: counts.systems, href: "/projects" },
    { label: "papers", value: counts.papers, href: "/articles" },
    { label: "posts", value: counts.writing, href: "/blog" },
    { label: "notes", value: counts.compendium, href: "/compendium" },
  ];
  const pending = <span className="text-[var(--warn)]">[pending]</span>;
  const rule = "mt-2 border-t border-dashed border-[var(--line)] pt-2";
  // Identity rows, then real output counts (index 3 starts the counts, under a rule).
  const readout = [
    { key: "node", value: "victor-bona" },
    { key: "role", value: "leader" },
    { key: "uptime", value: profile.yearsExperience !== null ? `${profile.yearsExperience} yrs` : pending },
    ...output.map((fact) => ({
      key: fact.label,
      value: (
        <a href={fact.href} className={linkClass}>
          {fact.value}
        </a>
      ),
    })),
    ...profile.scale.map((fact) => ({ key: fact.label, value: fact.value })),
    ...(isPending(profile.scale)
      ? [{ key: "scale", value: <>{pending} <span className="text-[var(--dim)]">traffic, team size, systems owned</span></> }]
      : []),
  ];
  const links = [
    { label: "linkedin", href: profile.links.linkedin },
    { label: "x", href: profile.links.x },
    { label: "github", href: profile.links.github },
    { label: "site source", href: "https://github.com/vicotrbb/victorbona.blog" },
  ];
  const jsonLd = [
    getProfilePageJsonLd(),
    getBreadcrumbJsonLd([
      { name: "Home", item: baseUrl },
      { name: "Profile", item: `${baseUrl}/about` },
    ]),
  ];

  return (
    <div className="space-y-20">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="grid items-end gap-8 sm:grid-cols-[10rem_1fr] md:grid-cols-[12rem_1fr]">
        {profile.headshot ? (
          <div className="relative aspect-square w-40 overflow-hidden border border-[var(--line-strong)] md:w-48">
            <Image
              src={profile.headshot}
              alt={profile.name}
              fill
              sizes="12rem"
              priority
              className="object-cover [filter:grayscale(1)_contrast(1.1)]"
            />
            <span aria-hidden="true" className="absolute inset-0 bg-[var(--lit)] mix-blend-multiply" />
          </div>
        ) : (
          <div className="flex aspect-square w-40 items-center justify-center p-3 text-center border border-dashed border-[var(--line-strong)] bg-[var(--panel)] md:w-48">
            <Pending what="headshot" />
          </div>
        )}
        <div>
          <h1 className="text-[clamp(2.4rem,6vw,4rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-[var(--text)]">
            {profile.name}
          </h1>
          <p className="mt-4 max-w-[40ch] text-lg leading-snug text-balance text-[var(--dim)] sm:text-xl">
            {profile.oneLiner}
          </p>
          <div className="mt-6">
            <ContactCommand variant="inline" />
          </div>
        </div>
      </header>

      <section aria-labelledby="scale">
        <SectionCommand id="scale">describe node/victor-bona --scale</SectionCommand>
        {/* One status readout in terminal grammar (key, value), not hero numbers. */}
        <dl className="grid max-w-xl grid-cols-[auto_1fr] gap-x-10 border border-[var(--line)] bg-[var(--panel)] px-5 py-4 font-mono text-sm leading-7 sm:px-6">
          {readout.map((row, i) => (
            <div key={row.key} className="contents">
              <dt className={`text-[var(--dim)] ${i === 3 ? rule : ""}`}>{row.key}</dt>
              <dd className={`tabular-nums text-[var(--text)] ${i === 3 ? rule : ""}`}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="timeline">
        <SectionCommand id="timeline">get roles --sort-by=start</SectionCommand>
        {isPending(profile.timeline) ? (
          <div className="border-l border-dashed border-[var(--line-strong)] py-2 pl-5">
            <Pending what="career timeline" />
          </div>
        ) : (
          <ol className="border-l border-[var(--line-strong)]">
            {profile.timeline.map((entry) => (
              <li key={`${entry.org}:${entry.start}`} className="relative pb-8 pl-5 last:pb-0">
                <span
                  aria-hidden="true"
                  className={`absolute top-2 -left-px w-3 border-t ${entry.end ? "border-[var(--line-strong)]" : "border-[var(--lit)]"}`}
                />
                <p className="font-mono text-xs tabular-nums text-[var(--dim)]">
                  {entry.start}–{entry.end ?? <span className="text-[var(--lit)]">present</span>}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--text)]">
                  {entry.role} <span className="font-normal text-[var(--dim)]">@ {entry.org}</span>
                </h3>
                <p className="mt-2 max-w-[68ch] text-[var(--dim)]">{entry.summary}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="talks" className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-8">
        <div>
          <SectionCommand id="talks">get talks</SectionCommand>
          {isPending(profile.talks) ? (
            <div className="border-t border-[var(--line)] pt-3">
              <Pending what="talks and appearances" />
            </div>
          ) : (
            <ul>
              {profile.talks.map((talk) => (
                <li key={`${talk.title}:${talk.date}`} className="border-t border-[var(--line)] py-3">
                  {talk.url ? (
                    <a href={talk.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {talk.title}
                    </a>
                  ) : (
                    <span className="text-[var(--text)]">{talk.title}</span>
                  )}
                  <p className="mt-1 font-mono text-xs tabular-nums text-[var(--dim)]">
                    {talk.venue} · {talk.date}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="mb-4 cmd">
            <span aria-hidden="true">$ </span>get links
          </h2>
          <ul className="font-mono text-sm">
            {links.map((link) => (
              <li key={link.label} className="flex min-w-0 items-baseline justify-between gap-4 border-t border-[var(--line)] py-3">
                <span className="shrink-0 text-[var(--dim)]">{link.label}</span>
                <a href={link.href} target="_blank" rel="noopener noreferrer" className={`min-w-0 truncate ${linkClass}`}>
                  {link.href.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "")}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
