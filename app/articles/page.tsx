import { getArticles } from "./articles";
import { PaperRow } from "app/components/PaperRow";
import { baseUrl } from "app/sitemap";
import type { Metadata } from "next";
import {
  getBreadcrumbJsonLd,
  getItemListJsonLd,
  ogImage,
  withDefaultOpenGraphImage,
  withDefaultTwitterImage,
} from "app/lib/seo";

export const metadata: Metadata = {
  title: "Articles & Papers",
  description: "Academic papers and technical articles on software engineering, distributed systems, and modern web development.",
  alternates: {
    canonical: `${baseUrl}/articles`,
  },
  openGraph: withDefaultOpenGraphImage({
    title: "Articles & Papers - Victor Bona",
    description: "Academic papers and technical articles on software engineering, distributed systems, and modern web development.",
    url: `${baseUrl}/articles`,
    images: [ogImage("Papers", "P300 Papers")],
  }),
  twitter: withDefaultTwitterImage({
    card: "summary_large_image",
    title: "Articles & Papers - Victor Bona",
    description: "Academic papers and technical articles on software engineering, distributed systems, and modern web development.",
    images: [ogImage("Papers", "P300 Papers")],
  }),
};

export default function ArticlesPage() {
  const articles = getArticles();
  const doiCount = articles.filter((article) => article.doi).length;
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
    <section className="w-full">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <header className="border-b border-[var(--line)] pb-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h1 className="flex items-baseline gap-4 text-[clamp(2rem,4vw,3rem)] font-semibold leading-none tracking-[-0.03em] text-[var(--text)]">
            <span className="font-mono text-sm font-normal tracking-normal text-[var(--dim)]">P300</span>
            Papers
          </h1>
          <p className="font-mono text-sm tabular-nums text-[var(--dim)]">
            <span className="text-[var(--text)]">{articles.length}</span> papers ·{" "}
            <span className="text-[var(--text)]">{doiCount}</span> with DOI
          </p>
        </div>
        <p className="mt-4 max-w-[60ch] text-[var(--dim)]">
          Preprints and technical white papers on distributed systems,
          observability, memory allocation, and protocol design. Each one ships
          with its PDF; preprints carry a DOI.
        </p>
      </header>
      <h2 className="mb-2 mt-10 font-mono text-sm text-[var(--dim)]">
        <span aria-hidden="true">$ </span>ls papers/ --format=references
      </h2>
      <ol className="border-b border-[var(--line)]">
        {articles.map((article, index) => (
          <PaperRow key={article.slug} article={article} index={index + 1} />
        ))}
      </ol>
    </section>
  );
}
