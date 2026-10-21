import type { Metadata } from "next";
import { baseUrl } from "app/sitemap";
import { articles } from "app/articles/articles";
import { researchThemes } from "app/articles/themes";
import { getBreadcrumbJsonLd, ogImage, withDefaultOpenGraphImage, withDefaultTwitterImage } from "app/lib/seo";
import { siteApa, siteBibtex } from "./cite";

const description = "Victor Bona's research by theme: distributed systems reliability, systems design, formal methods and protocols, with citations.";

export const metadata: Metadata = {
  title: "Research",
  description,
  alternates: { canonical: `${baseUrl}/research` },
  openGraph: withDefaultOpenGraphImage({ title: "Research - Victor Bona", description, url: `${baseUrl}/research`, images: [ogImage("Research", "P300 Papers · research")] }),
  twitter: withDefaultTwitterImage({ card: "summary_large_image", title: "Research - Victor Bona", description, images: [ogImage("Research", "P300 Papers · research")] }),
};

const linkClass = "text-[var(--text)] decoration-[var(--lit)] decoration-1 underline-offset-4 hover:underline";
const pre = "mt-3 whitespace-pre-wrap break-words border border-[var(--line)] bg-[var(--panel)] p-4 font-mono text-xs leading-relaxed text-[var(--text)] sm:text-sm";

export default function ResearchPage() {
  const bySlug = new Map(articles.map((a) => [a.slug, a]));
  const jsonLd = getBreadcrumbJsonLd([
    { name: "Home", item: baseUrl },
    { name: "Papers", item: `${baseUrl}/articles` },
    { name: "Research", item: `${baseUrl}/research` },
  ]);

  return (
    <section className="w-full space-y-16">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="border-b border-[var(--line)] pb-8">
        <p className="font-mono text-xs text-[var(--dim)] sm:text-sm">
          <a href="/articles" className="hover:text-[var(--text)]">P300 Papers</a>
          <span aria-hidden="true"> / </span>research
        </p>
        <h1 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-semibold leading-none tracking-[-0.03em] text-[var(--text)]">Research</h1>
        <p className="mt-4 max-w-[60ch] text-[var(--dim)]">
          {articles.length} papers grouped by the question they answer, each with the case studies and notes that sit
          next to it. Every artifact ships its data, failed attempts and executable checks.
        </p>
      </header>

      {researchThemes.map((theme) => (
        <section key={theme.id} aria-labelledby={`theme-${theme.id}`} className="grid gap-6 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <h2 id={`theme-${theme.id}`} className="text-xl font-semibold tracking-[-0.015em] text-balance text-[var(--text)]">
              {theme.title}
            </h2>
            <p className="mt-3 text-[var(--dim)]">{theme.question}</p>
          </div>
          <div className="md:col-span-8">
            <ol>
              {theme.papers.map((slug) => {
                const a = bySlug.get(slug);
                if (!a) return null;
                return (
                  <li key={slug} className="border-t border-[var(--line)] py-4">
                    <a href={`/articles/${a.slug}`} className={`font-semibold leading-snug ${linkClass}`}>{a.title}</a>
                    <p className="mt-1 flex flex-wrap gap-x-4 font-mono text-xs tabular-nums text-[var(--dim)]">
                      <span>{a.publishedAt}</span>
                      <span>{a.status}</span>
                      {a.doi && (
                        <a href={`https://doi.org/${a.doi}`} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text)] hover:underline">
                          doi:{a.doi}
                        </a>
                      )}
                    </p>
                  </li>
                );
              })}
            </ol>
            <p className="mt-2 border-t border-dashed border-[var(--line)] pt-3 font-mono text-xs text-[var(--dim)] sm:text-sm">
              <span>read next: </span>
              {theme.reading.map((r, i) => (
                <span key={r.href}>
                  <a href={r.href} className="hover:text-[var(--text)] hover:underline">{r.label}</a>
                  {i < theme.reading.length - 1 && " · "}
                </span>
              ))}
            </p>
          </div>
        </section>
      ))}

      <section aria-labelledby="cite-site" className="border-t border-[var(--line)] pt-10">
        <h2 id="cite-site" className="cmd">
          <span aria-hidden="true">$ </span>cite --site
        </h2>
        <p className="mt-3 max-w-[60ch] text-[var(--dim)]">
          To cite a single paper, use the BibTeX on its page. To cite this site, or to import everything at once:
        </p>
        <pre className={pre}><code>{siteBibtex}</code></pre>
        <pre className={pre}><code>{siteApa}</code></pre>
        <p className="mt-4 font-mono text-sm">
          <a href="/research/bibliography.bib" className={linkClass} download>
            download victor-bona.bib
          </a>
          <span className="text-[var(--dim)]"> ({articles.length + 1} entries)</span>
        </p>
      </section>
    </section>
  );
}
