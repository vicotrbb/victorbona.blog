import { getBlogPosts } from "app/blog/utils";
import { FeaturedArgument } from "./components/FeaturedArgument";
import { SectionHeader } from "./components/SectionHeader";
import { WritingRow } from "./components/WritingRow";
import { SystemRow } from "./components/SystemRow";
import { EmptyPaperArchive, PaperRow } from "./components/PaperRow";
import { articles } from "./articles/articles";
import { projects, type Project } from "./projects/projects";

function isProject(project: Project | undefined): project is Project {
  return project !== undefined;
}

export default function Page() {
  const posts = getBlogPosts().sort(
    (a, b) =>
      new Date(b.metadata.publishedAt).getTime() -
      new Date(a.metadata.publishedAt).getTime()
  );

  if (posts.length === 0) {
    return (
      <section className="space-y-4">
        <SectionHeader index="000" title="Archive" />
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            The writing archive is empty for now. Notes and field reports will
            appear here when they are ready.
          </p>
        </div>
      </section>
    );
  }

  const featured =
    posts.find((post) => post.slug.includes("hidden-cost-of-abstractions")) ??
    posts[0];
  const fieldNotes = posts
    .filter((post) => post.slug !== featured.slug)
    .slice(0, 6);
  const selectedProjects = ["Guara Cloud", "Purple Wolf", "SQLTemple"]
    .map((name) => projects.find((project) => project.name === name))
    .filter(isProject);
  const selectedArticles = articles.slice(0, 2);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 border-b border-[var(--color-rule)] pb-5 lg:grid-cols-[1fr_1.6fr] lg:items-end">
        <div>
          <p className="metadata-type text-[var(--color-accent)]">
            Software / systems / operational taste
          </p>
          <h1 className="display-type mt-2 text-2xl font-semibold leading-tight text-[var(--color-foreground)] sm:text-3xl">
            Victor Bona builds software systems and writes down the arguments
            that survive contact with production.
          </h1>
        </div>
        <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)] lg:max-w-xl">
          Notes on software architecture, infrastructure, product engineering,
          security, AI systems, and the cost of abstractions.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <SectionHeader index="001" title="Current Argument" />
          <FeaturedArgument
            slug={featured.slug}
            title={featured.metadata.title}
            summary={featured.metadata.summary}
            publishedAt={featured.metadata.publishedAt}
            tags={featured.metadata.tags}
            content={featured.content}
          />
        </div>
        <div>
          <SectionHeader
            index="002"
            title="Field Notes"
            href="/blog"
            actionLabel="All writing"
          />
          <div className="border border-[var(--color-border)] bg-[var(--color-background)] px-3">
            {fieldNotes.map((post) => (
              <WritingRow
                key={post.slug}
                slug={post.slug}
                title={post.metadata.title}
                summary={post.metadata.summary}
                publishedAt={post.metadata.publishedAt}
                tags={post.metadata.tags}
                content={post.content}
                compact
              />
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          index="003"
          title="Shipped Systems"
          href="/projects"
          actionLabel="All systems"
        />
        <div className="border border-[var(--color-border)] px-3">
          {selectedProjects.map((project) => (
            <SystemRow key={project.name} project={project} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div>
          <SectionHeader
            index="004"
            title="Longer Work"
            href="/articles"
            actionLabel="Papers"
          />
          {selectedArticles.length > 0 ? (
            <div className="border border-[var(--color-border)] px-3">
              {selectedArticles.map((article) => (
                <PaperRow key={article.slug} article={article} />
              ))}
            </div>
          ) : (
            <EmptyPaperArchive />
          )}
        </div>
        <div>
          <SectionHeader
            index="005"
            title="Archive"
            href="/blog"
            actionLabel="Enter"
          />
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              The full writing archive stays organized by date and topic: clean
              code, scalability, APIs, concurrency, AI tooling, homelab
              infrastructure, and the tradeoffs behind shipped software.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
