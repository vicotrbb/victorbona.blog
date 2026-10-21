import { getBlogPosts } from "app/blog/utils";
import { getCompendiumNotes } from "app/compendium/utils";
import { articles } from "./articles/articles";
import { projects } from "./projects/projects";
import { getSiteCounts } from "./lib/counts";
import { profile } from "./lib/profile";
import { layoutRings } from "./lib/rings";
import { toStroke } from "./lib/status";
import { ContactCommand } from "./components/ContactCommand";
import { ControlPlane } from "./components/ControlPlane";
import { StatusTable, type StatusRow } from "./components/StatusTable";

const RING_SIZE = 640;
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const newestFirst = (a: string, b: string) => b.localeCompare(a);

export default function Page() {
  const counts = getSiteCounts();
  const posts = getBlogPosts().sort((a, b) => newestFirst(a.metadata.publishedAt, b.metadata.publishedAt));
  const papers = [...articles].sort((a, b) => newestFirst(a.publishedAt, b.publishedAt));

  const rings = layoutRings(
    [
      {
        id: "systems",
        label: "Systems",
        href: "/projects",
        count: counts.systems,
        items: projects.map((p) => ({ id: slugify(p.name), title: p.name, href: "/projects", status: toStroke(p.status) })),
      },
      {
        id: "papers",
        label: "Papers",
        href: "/articles",
        count: counts.papers,
        items: papers.map((a) => ({ id: a.slug, title: a.title, href: `/articles/${a.slug}`, status: toStroke(a.status) })),
      },
      {
        id: "writing",
        label: "Writing",
        href: "/blog",
        count: counts.writing,
        items: posts.map((p) => ({ id: p.slug, title: p.metadata.title, href: `/blog/${p.slug}`, status: "live" as const })),
      },
      {
        id: "compendium",
        label: "Compendium",
        href: "/compendium",
        count: counts.compendium,
        items: getCompendiumNotes().map((n) => ({
          id: `${n.collection}/${n.slug}`,
          title: n.title,
          href: `/compendium/${n.collection}/${n.slug}`,
        })),
      },
    ],
    RING_SIZE,
  );

  // Undated systems cannot be placed in time, so only dated ones compete for the table.
  const recent: StatusRow[] = [
    ...posts.map((p): StatusRow => ({ name: p.metadata.title, href: `/blog/${p.slug}`, kind: "post", status: "live", updated: p.metadata.publishedAt })),
    ...papers.map((a): StatusRow => ({ name: a.title, href: `/articles/${a.slug}`, kind: "paper", status: toStroke(a.status), updated: a.publishedAt })),
    ...projects
      .filter((p) => p.startDate)
      .map((p): StatusRow => ({ name: p.name, href: "/projects", kind: "system", status: toStroke(p.status), updated: p.startDate! })),
  ]
    .map((row) => ({ ...row, updated: row.updated.slice(0, 10) }))
    .sort((a, b) => newestFirst(a.updated, b.updated))
    .slice(0, 8);

  const featured = papers.find((a) => a.doi && a.status === "preprint");

  return (
    <div className="space-y-24">
      <section className="grid items-center gap-12 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <p className="font-mono text-xs text-[var(--dim)] sm:text-sm">
            leader: <span className="text-[var(--text)]">victor-bona</span> · status:{" "}
            <span className="text-[var(--lit)] [text-shadow:0_0_10px_rgb(77_255_143/0.5)]">Ready</span>
            {profile.yearsExperience !== null && <> · uptime: {profile.yearsExperience} yrs</>}
          </p>
          <h1 className="mt-6 text-[clamp(2.4rem,5vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-balance text-[var(--text)]">
            {profile.oneLiner}
          </h1>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <ContactCommand variant="hero" />
            <a
              href="/about"
              className="font-mono text-sm text-[var(--dim)] transition-colors duration-150 hover:text-[var(--text)]"
            >
              <span aria-hidden="true">$ </span>cd /about
            </a>
          </div>
        </div>
        <div className="md:col-span-7">
          <ControlPlane rings={rings} size={RING_SIZE} />
        </div>
      </section>

      <section aria-labelledby="recent-work">
        <h2 id="recent-work" className="mb-4 font-mono text-sm text-[var(--dim)]">
          <span aria-hidden="true">$ </span>get work --sort-by=updated
        </h2>
        <StatusTable rows={recent} />
      </section>

      {featured && (
        <section aria-labelledby="featured-paper" className="grid gap-4 border-y border-[var(--line)] py-8 md:grid-cols-12 md:gap-8">
          <h2 id="featured-paper" className="font-mono text-sm text-[var(--dim)] md:col-span-4">
            <span aria-hidden="true">$ </span>describe paper/latest
          </h2>
          <div className="md:col-span-8">
            <a
              href={`/articles/${featured.slug}`}
              className="text-xl font-semibold leading-snug tracking-[-0.015em] text-balance text-[var(--text)] decoration-[var(--lit)] decoration-1 underline-offset-4 hover:underline sm:text-2xl"
            >
              {featured.title}
            </a>
            <p className="mt-3 line-clamp-3 max-w-[68ch] text-[var(--dim)]">{featured.abstract}</p>
            <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-[var(--dim)]">
              <span>{featured.status}</span>
              <span className="tabular-nums">{featured.publishedAt}</span>
              <a
                href={`https://doi.org/${featured.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text)] decoration-1 underline-offset-4 hover:underline"
              >
                doi:{featured.doi}
              </a>
            </p>
          </div>
        </section>
      )}

      <section aria-labelledby="contact" className="border border-[var(--line-strong)] bg-[var(--panel)] px-6 py-10 sm:px-10">
        <h2 id="contact" className="max-w-[24ch] text-2xl font-semibold tracking-[-0.02em] text-balance text-[var(--text)] sm:text-3xl">
          Building something distributed, or making AI hold up in production?
        </h2>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <ContactCommand variant="inline" />
          <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className="text-[var(--dim)] transition-colors duration-150 hover:text-[var(--text)]">
            LinkedIn
          </a>
          <a href={profile.links.x} target="_blank" rel="noopener noreferrer" className="text-[var(--dim)] transition-colors duration-150 hover:text-[var(--text)]">
            X
          </a>
        </div>
      </section>
    </div>
  );
}
