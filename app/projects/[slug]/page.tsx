import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getReadingTime } from "app/blog/utils";
import { baseUrl } from "app/sitemap";
import { ArticleWrapper } from "app/components/ArticleWrapper";
import { CustomMDX } from "app/components/mdx";
import { ReadingProgress } from "app/components/ReadingProgress";
import { TableOfContents } from "app/components/TableOfContents";
import { ContactCommand } from "app/components/ContactCommand";
import { StatusStroke } from "app/components/StatusStroke";
import { toStroke } from "app/lib/status";
import { getBreadcrumbJsonLd, ogImage, withDefaultOpenGraphImage, withDefaultTwitterImage } from "app/lib/seo";
import { getCaseStudies } from "../case-studies";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCaseStudies().map((s) => ({ slug: s.slug }));
}

const find = (slug: string) => getCaseStudies().find((s) => s.slug === slug);

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const study = find((await props.params).slug);
  if (!study) return {};
  const { title, summary, system, tags } = study.metadata;
  const url = `${baseUrl}/projects/${study.slug}`;
  const image = ogImage(title, `P400 Case study · ${system}`);
  return {
    title: `${system}: ${title}`,
    description: summary,
    keywords: [...tags.split(",").map((t) => t.trim()), "case study", system],
    alternates: { canonical: url },
    openGraph: withDefaultOpenGraphImage({ title, description: summary, type: "article", url, publishedTime: study.metadata.publishedAt, images: [image] }),
    twitter: withDefaultTwitterImage({ card: "summary_large_image", title, description: summary, images: [image] }),
  };
}

const linkClass = "text-[var(--text)] decoration-[var(--lit)] decoration-1 underline-offset-4 hover:underline";

export default async function CaseStudyPage(props: { params: Promise<{ slug: string }> }) {
  const study = find((await props.params).slug);
  if (!study) notFound();

  const { metadata: m, project } = study;
  const url = `${baseUrl}/projects/${study.slug}`;
  const status = project && toStroke(project.status);
  const facts = [
    { key: "system", value: m.system },
    { key: "role", value: m.role },
    { key: "period", value: m.period },
    { key: "stack", value: m.stack },
  ].filter((f) => f.value);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: m.title,
      description: m.summary,
      datePublished: m.publishedAt,
      url,
      author: { "@type": "Person", name: "Victor Bona", url: baseUrl },
      about: { "@type": "SoftwareSourceCode", name: m.system, ...(project?.repository && { codeRepository: project.repository }) },
      keywords: m.tags,
    },
    getBreadcrumbJsonLd([
      { name: "Home", item: baseUrl },
      { name: "Projects", item: `${baseUrl}/projects` },
      { name: m.system, item: url },
    ]),
  ];

  return (
    <section className="w-full">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ReadingProgress />

      <div className="mx-auto max-w-[var(--measure)] text-[clamp(1.0625rem,1rem+0.25vw,1.125rem)]">
        <article className="relative">
          <header className="border-b border-[var(--line)] pb-8">
            <p className="font-mono text-xs text-[var(--dim)] sm:text-sm">
              <a href="/projects" className="hover:text-[var(--text)]">P400 Systems</a>
              <span aria-hidden="true"> / </span>case study
            </p>
            <h1 className="mt-4 text-[clamp(2rem,1.4rem+2.4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-balance text-[var(--text)]">
              {m.title}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[var(--dim)] sm:text-xl">{m.summary}</p>

            <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-8 border border-[var(--line)] bg-[var(--panel)] px-5 py-4 font-mono text-xs leading-7 sm:text-sm">
              {facts.map((f) => (
                <div key={f.key} className="contents">
                  <dt className="text-[var(--dim)]">{f.key}</dt>
                  <dd className="text-[var(--text)]">{f.value}</dd>
                </div>
              ))}
              {project && status && (
                <div className="contents">
                  <dt className="text-[var(--dim)]">status</dt>
                  <dd className="flex items-center gap-2 text-[var(--text)]">
                    <span className="w-6 shrink-0"><StatusStroke status={status} /></span>
                    {project.status === "sold" ? "exited (sold)" : status}
                  </dd>
                </div>
              )}
              {(project?.website || project?.repository) && (
                <div className="contents">
                  <dt className="text-[var(--dim)]">links</dt>
                  <dd className="flex flex-wrap gap-x-4">
                    {project.website && <a href={project.website} target="_blank" rel="noopener noreferrer" className={linkClass}>site</a>}
                    {project.repository && <a href={project.repository} target="_blank" rel="noopener noreferrer" className={linkClass}>source</a>}
                  </dd>
                </div>
              )}
              <div className="contents">
                <dt className="text-[var(--dim)]">read</dt>
                <dd className="tabular-nums text-[var(--text)]">{getReadingTime(study.content)} min</dd>
              </div>
            </dl>
          </header>

          <aside className="absolute left-full top-0 ml-8 hidden h-full w-52 xl:block">
            <div className="sticky top-24">
              <TableOfContents />
            </div>
          </aside>

          <ArticleWrapper>
            <CustomMDX source={study.content} />
          </ArticleWrapper>
        </article>

        <section aria-labelledby="contact" className="mt-16 border border-[var(--line-strong)] bg-[var(--panel)] px-6 py-10 sm:px-10">
          <h2 id="contact" className="max-w-[24ch] text-2xl font-semibold tracking-[-0.02em] text-balance text-[var(--text)] sm:text-3xl">
            Want to talk through the design?
          </h2>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <ContactCommand variant="inline" />
          </div>
        </section>

        <nav aria-label="More case studies" className="mt-16">
          <h2 className="mb-4 cmd">
            <span aria-hidden="true">$ </span>get case-studies
          </h2>
          <ul>
            {getCaseStudies()
              .filter((s) => s.slug !== study.slug)
              .map((s) => (
                <li key={s.slug} className="border-t border-[var(--line)] py-3">
                  <a href={`/projects/${s.slug}`} className={linkClass}>{s.metadata.title}</a>
                  <span className="ml-3 font-mono text-xs text-[var(--dim)]">{s.metadata.system}</span>
                </li>
              ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
