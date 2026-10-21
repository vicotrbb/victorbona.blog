import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticles, getArticleBySlug, toBibtex } from "../articles";
import { baseUrl } from "app/sitemap";
import type { Metadata } from "next";
import { Tag } from "app/components/Tag";
import { ContactCommand } from "app/components/ContactCommand";
import { profile } from "app/lib/profile";
import {
  absoluteUrl,
  getBreadcrumbJsonLd,
  getScholarlyArticleJsonLd,
  withDefaultOpenGraphImage,
  withDefaultTwitterImage,
} from "app/lib/seo";

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const monoLink =
  "text-[var(--text)] decoration-1 underline-offset-4 transition-colors duration-150 hover:underline";

export async function generateStaticParams() {
  return getArticles().map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata(
  props: ArticlePageProps,
): Promise<Metadata> {
  const params = await props.params;
  const article = getArticleBySlug(params.slug);
  if (!article) {
    return {};
  }

  return {
    title: article.title,
    description: article.abstract,
    authors: article.authors.map((name) => ({ name })),
    keywords: [...article.tags, "research", "paper", "academic"],
    openGraph: withDefaultOpenGraphImage({
      title: article.title,
      description: article.abstract,
      type: "article",
      url: `${baseUrl}/articles/${article.slug}`,
      publishedTime: article.publishedAt,
      authors: article.authors,
      tags: article.tags,
      siteName: "Victor Bona Blog",
    }),
    twitter: withDefaultTwitterImage({
      card: "summary_large_image",
      title: article.title,
      description: article.abstract,
      creator: "@BonaVictor",
    }),
    alternates: {
      canonical: `${baseUrl}/articles/${article.slug}`,
    },
  };
}

export default async function ArticlePage(props: ArticlePageProps) {
  const params = await props.params;
  const article = getArticleBySlug(params.slug);

  if (!article) {
    notFound();
  }

  const lit = Boolean(article.doi && article.status === "preprint");
  const bibtex = toBibtex(article, article.pdfUrl && absoluteUrl(article.pdfUrl));
  const jsonLd = [
    getScholarlyArticleJsonLd(article),
    getBreadcrumbJsonLd([
      { name: "Home", item: baseUrl },
      { name: "Articles", item: `${baseUrl}/articles` },
      { name: article.title, item: `${baseUrl}/articles/${article.slug}` },
    ]),
  ];
  const meta: Array<[string, React.ReactNode]> = [
    ["authors", article.authors.join(", ")],
    ["status", <span className={lit ? "text-[var(--lit)]" : undefined}>{article.status}</span>],
    ["published", <time dateTime={article.publishedAt} className="tabular-nums">{article.publishedAt}</time>],
  ];
  if (article.journal) meta.push(["venue", article.journal]);
  if (article.doi) {
    meta.push([
      "doi",
      <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noopener noreferrer" className={`break-all ${monoLink}`}>
        {article.doi}
      </a>,
    ]);
  }
  if (article.pdfUrl) {
    meta.push([
      "pdf",
      <a href={article.pdfUrl} target="_blank" rel="noopener noreferrer" className={monoLink}>
        open pdf
      </a>,
    ]);
  }
  if (article.citationKey) meta.push(["cite key", <span className="break-all">{article.citationKey}</span>]);

  return (
    <article className="w-full">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <header className="border-b border-[var(--line)] pb-8">
        <Link
          href="/articles"
          className="font-mono text-sm text-[var(--dim)] decoration-1 underline-offset-4 transition-colors duration-150 hover:text-[var(--text)] hover:underline"
        >
          P300 Papers
        </Link>
        <h1 className="mt-4 max-w-[30ch] text-[clamp(1.75rem,1.3rem+2vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-balance text-[var(--text)]">
          {article.title}
        </h1>
      </header>

      <div className="mt-10 grid gap-10 md:grid-cols-[17rem_minmax(0,var(--measure))] md:gap-12">
        <dl className="grid h-fit grid-cols-[6rem_minmax(0,1fr)] gap-x-3 gap-y-3 font-mono text-xs text-[var(--text)] sm:text-sm md:grid-cols-1 md:gap-y-1">
          {meta.map(([label, value]) => (
            <div key={label} className="contents md:mb-3 md:block">
              <dt className="text-[var(--dim)]">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <div className="min-w-0 text-[clamp(1.0625rem,1rem+0.25vw,1.125rem)]">
          <h2 className="font-mono text-sm text-[var(--dim)]">
            <span aria-hidden="true">$ </span>cat abstract
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--text)]">{article.abstract}</p>

          {article.tags.length > 0 && (
            <>
              <h2 className="mt-10 font-mono text-sm text-[var(--dim)]">
                <span aria-hidden="true">$ </span>ls index-terms/
              </h2>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-base">
                {article.tags.map((tag) => (
                  <Tag key={tag} name={tag} />
                ))}
              </p>
            </>
          )}

          <section aria-labelledby="cite" className="mt-10">
            <h2 id="cite" className="font-mono text-sm text-[var(--dim)]">
              <span aria-hidden="true">$ </span>cite --format=bibtex
            </h2>
            <pre className="mt-3 whitespace-pre-wrap break-words border border-[var(--line)] bg-[var(--panel)] p-4 font-mono text-xs leading-relaxed text-[var(--text)] sm:text-sm">
              <code>{bibtex}</code>
            </pre>
          </section>
        </div>
      </div>

      <section
        aria-labelledby="contact"
        className="mt-16 border border-[var(--line-strong)] bg-[var(--panel)] px-6 py-10 sm:px-10"
      >
        <h2 id="contact" className="max-w-[24ch] text-2xl font-semibold tracking-[-0.02em] text-balance text-[var(--text)] sm:text-3xl">
          Questions about this paper, or working on something close to it?
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
    </article>
  );
}
