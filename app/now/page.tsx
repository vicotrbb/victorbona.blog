import type { Metadata } from "next";
import { baseUrl } from "app/sitemap";
import { profile } from "app/lib/profile";
import { projects } from "app/projects/projects";
import { caseStudyHrefs } from "app/projects/case-studies";
import { articles } from "app/articles/articles";
import { getGitHubSnapshot, repoKey } from "app/lib/github";
import { GitHubFeed } from "app/components/GitHubFeed";
import { Ago } from "app/components/Ago";
import { ogImage, withDefaultOpenGraphImage, withDefaultTwitterImage } from "app/lib/seo";
import { now } from "./now";

const description = "What Victor Bona is working on right now: current role, systems in progress, latest research and live GitHub activity.";

export const metadata: Metadata = {
  title: "Now",
  description,
  alternates: { canonical: `${baseUrl}/now` },
  openGraph: withDefaultOpenGraphImage({ title: "Now - Victor Bona", description, url: `${baseUrl}/now`, images: [ogImage("Now", "status --now")] }),
  twitter: withDefaultTwitterImage({ card: "summary_large_image", title: "Now - Victor Bona", description, images: [ogImage("Now", "status --now")] }),
};

const linkClass = "text-[var(--text)] decoration-[var(--lit)] decoration-1 underline-offset-4 hover:underline";

function Section({ id, cmd, children }: { id: string; cmd: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-4 cmd">
        <span aria-hidden="true">$ </span>
        {cmd}
      </h2>
      {children}
    </section>
  );
}

export default async function NowPage() {
  const github = await getGitHubSnapshot();
  const studies = caseStudyHrefs();
  const building = projects
    .filter((p) => p.status === "in-progress")
    .map((p) => ({ project: p, stats: github?.byRepo[repoKey(p.repository) ?? ""] }))
    // "In progress" in the data file is not proof of activity: with live data, show only repos pushed recently.
    .filter(({ stats }) => !github || !stats || Date.parse(stats.pushedAt) > Date.now() - 90 * 86_400_000)
    .sort((a, b) => (b.stats?.pushedAt ?? "").localeCompare(a.stats?.pushedAt ?? ""));
  const research = [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 3);
  const role = profile.timeline[0];

  return (
    <div className="space-y-16">
      <header className="border-b border-[var(--line)] pb-8">
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-none tracking-[-0.03em] text-[var(--text)]">Now</h1>
        <p className="mt-4 max-w-[60ch] text-[var(--dim)]">
          What I am working on at the moment. Systems and research are read from this site, activity streams from GitHub.
        </p>
        <p className="mt-4 font-mono text-xs tabular-nums text-[var(--dim)] sm:text-sm">updated {now.updated}</p>
      </header>

      <Section id="now-role" cmd="whoami --role">
        <p className="text-lg text-[var(--text)]">
          {role.role} <span className="text-[var(--dim)]">@ {role.org}</span>
        </p>
        <p className="mt-1 font-mono text-xs tabular-nums text-[var(--dim)] sm:text-sm">since {role.start} · {profile.location}</p>
        {now.notes.length > 0 && (
          <ul className="mt-6 max-w-[68ch] space-y-2 text-[var(--text)]">
            {now.notes.map((n) => (
              <li key={n} className="border-l border-[var(--line-strong)] pl-4">{n}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="now-building" cmd="get systems --status=in-progress">
        <ul className="border-b border-[var(--line)]">
          {building.map(({ project, stats }) => {
            const href = studies.get(project.name) ?? project.repository ?? project.website ?? "/projects";
            return (
              <li key={project.name} className="grid gap-1 border-t border-[var(--line)] py-4 sm:grid-cols-[12rem_minmax(0,1fr)_auto] sm:gap-6">
                <a href={href} className={`font-semibold ${linkClass}`}>{project.name}</a>
                <p className="text-[var(--dim)]">{project.description}</p>
                <span className="font-mono text-xs text-[var(--dim)] sm:text-right sm:text-sm">
                  {stats ? <>pushed <Ago iso={stats.pushedAt} /></> : project.startDate ? `since ${project.startDate}` : null}
                </span>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section id="now-research" cmd="get papers --latest">
        <ul>
          {research.map((a) => (
            <li key={a.slug} className="border-t border-[var(--line)] py-3">
              <a href={`/articles/${a.slug}`} className={linkClass}>{a.title}</a>
              <p className="mt-1 font-mono text-xs tabular-nums text-[var(--dim)]">{a.publishedAt} · {a.status}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 font-mono text-sm">
          <a href="/research" className="text-[var(--dim)] hover:text-[var(--text)]">all research by theme</a>
        </p>
      </Section>

      {github && github.activity.length > 0 && (
        <Section id="now-live" cmd="watch github --live">
          <GitHubFeed snapshot={github} />
        </Section>
      )}
    </div>
  );
}
