import { notFound } from "next/navigation";
import { getArticles, getArticleBySlug } from "../articles";
import { baseUrl } from "app/sitemap";
import type { Metadata } from "next";
import { Tag } from "app/components/Tag";
import { MetadataLine } from "app/components/MetadataLine";
import {
  getBreadcrumbJsonLd,
  getScholarlyArticleJsonLd,
  withDefaultOpenGraphImage,
  withDefaultTwitterImage,
} from "app/lib/seo";

type ArticlePageProps = {
  params: {
    slug: string;
  };
};

function formatDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatStatus(status: string): string {
  return status.replace(/-/g, " ");
}

export async function generateStaticParams() {
  return getArticles().map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
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

export default function ArticlePage({ params }: ArticlePageProps) {
  const article = getArticleBySlug(params.slug);

  if (!article) {
    notFound();
  }

  const publishedYear = new Date(article.publishedAt).getFullYear();
  const jsonLd = [
    getScholarlyArticleJsonLd(article),
    getBreadcrumbJsonLd([
      { name: "Home", item: baseUrl },
      { name: "Articles", item: `${baseUrl}/articles` },
      { name: article.title, item: `${baseUrl}/articles/${article.slug}` },
    ]),
  ];

  return (
    <article className="space-y-6">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <header className="grid gap-4 border-b border-[var(--color-rule)] pb-5 md:grid-cols-[12rem_1fr]">
        <MetadataLine
          items={[
            formatStatus(article.status),
            article.type,
            formatDate(article.publishedAt),
          ]}
          className="text-[var(--color-accent)]"
        />
        <div>
          <h1 className="display-type max-w-3xl text-3xl font-semibold leading-tight text-[var(--color-foreground)] md:text-4xl">
            {article.title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {article.authors.join(", ")}
          </p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-[12rem_1fr]">
        <p className="metadata-type text-[var(--color-muted-foreground)]">
          Abstract
        </p>
        <p className="max-w-3xl text-base leading-relaxed text-[var(--color-foreground)]">
          {article.abstract}
        </p>
      </section>

      {article.tags.length > 0 && (
        <section className="grid gap-4 md:grid-cols-[12rem_1fr]">
          <p className="metadata-type text-[var(--color-muted-foreground)]">
            Index terms
          </p>
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Tag key={tag} name={tag} />
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 border-y border-[var(--color-rule)] py-5 md:grid-cols-[12rem_1fr]">
        <p className="metadata-type text-[var(--color-muted-foreground)]">
          Access
        </p>
        <div className="flex flex-wrap gap-4">
          {article.pdfUrl && (
            <a
              href={article.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="metadata-type text-[var(--color-accent)] transition-colors hover:text-[var(--color-foreground)]"
            >
              Open PDF
            </a>
          )}
          {article.doi && (
            <a
              href={`https://doi.org/${article.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="metadata-type text-[var(--color-accent)] transition-colors hover:text-[var(--color-foreground)]"
            >
              DOI
            </a>
          )}
        </div>
      </section>

      <footer className="grid gap-4 md:grid-cols-[12rem_1fr]">
        <p className="metadata-type text-[var(--color-muted-foreground)]">
          Citation
        </p>
        <div className="space-y-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          <p>
            {article.authors.join(", ")}. ({publishedYear}). {article.title}.{" "}
            {formatStatus(article.status)}.
          </p>
          {article.citationKey && (
            <p>
              BibTeX key:{" "}
              <code className="text-[var(--color-foreground)]">
                {article.citationKey}
              </code>
            </p>
          )}
        </div>
      </footer>
    </article>
  );
}
