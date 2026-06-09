import { getArticles } from "./articles";
import { PaperRow, EmptyPaperArchive } from "app/components/PaperRow";
import { SectionHeader } from "app/components/SectionHeader";
import { baseUrl } from "app/sitemap";
import type { Metadata } from "next";
import { getBreadcrumbJsonLd, getItemListJsonLd } from "app/lib/seo";

export const metadata: Metadata = {
  title: "Articles & Papers",
  description: "Academic papers and technical articles on software engineering, distributed systems, and modern web development.",
  alternates: {
    canonical: `${baseUrl}/articles`,
  },
  openGraph: {
    title: "Articles & Papers - Victor Bona",
    description: "Academic papers and technical articles on software engineering, distributed systems, and modern web development.",
    url: `${baseUrl}/articles`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Articles & Papers - Victor Bona",
    description: "Academic papers and technical articles on software engineering, distributed systems, and modern web development.",
  },
};

export default function ArticlesPage() {
  const articles = getArticles();
  const jsonLd = [
    getBreadcrumbJsonLd([
      { name: "Home", item: baseUrl },
      { name: "Articles", item: `${baseUrl}/articles` },
    ]),
    getItemListJsonLd(
      "Victor Bona Articles and Papers",
      articles.map((article) => ({
        name: article.title,
        url: `${baseUrl}/articles/${article.slug}`,
        description: article.abstract,
      }))
    ),
  ];

  return (
    <section className="space-y-5">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <div className="grid gap-3 border-b border-[var(--color-rule)] pb-4 md:grid-cols-[12rem_1fr]">
        <p className="metadata-type text-[var(--color-accent)]">Longer work</p>
        <div>
          <h1 className="display-type text-2xl font-semibold text-[var(--color-foreground)]">
            Papers and articles
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            Slower-form research and technical writing. This section stays
            sparse until the work deserves the space.
          </p>
        </div>
      </div>
      <SectionHeader index="PAPERS" title="Indexed work" />
      {articles.length > 0 ? (
        <div className="border border-[var(--color-border)] px-3">
          {articles.map((article) => (
            <PaperRow key={article.slug} article={article} />
          ))}
        </div>
      ) : (
        <EmptyPaperArchive />
      )}
    </section>
  );
}
