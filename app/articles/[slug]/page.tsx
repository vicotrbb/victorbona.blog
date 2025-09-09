import { notFound } from "next/navigation";
import { getArticles, getArticleBySlug } from "../articles";
import { baseUrl } from "app/sitemap";
import type { Metadata } from "next";
import { Tag } from "app/components/Tag";
import { CustomMDX } from "app/components/mdx";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export async function generateStaticParams() {
  const articles = getArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const article = getArticleBySlug(params.slug);
  if (!article) {
    return {};
  }

  return {
    title: `${article.title} | Victor Bona`,
    description: article.abstract,
    authors: article.authors.map(name => ({ name })),
    keywords: [...article.tags, "research", "paper", "academic"],
    openGraph: {
      title: article.title,
      description: article.abstract,
      type: "article",
      url: `${baseUrl}/articles/${article.slug}`,
      publishedTime: article.publishedAt,
      authors: article.authors,
      tags: article.tags,
      siteName: "Victor Bona Blog",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.abstract,
      creator: "@BonaVictor",
    },
    alternates: {
      canonical: `${baseUrl}/articles/${article.slug}`,
    },
  };
}

export default function ArticlePage({ params }) {
  const article = getArticleBySlug(params.slug);

  if (!article) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ScholarlyArticle",
            headline: article.title,
            author: article.authors.map(name => ({
              "@type": "Person",
              name: name,
            })),
            datePublished: article.publishedAt,
            description: article.abstract,
            url: `${baseUrl}/articles/${article.slug}`,
            publisher: {
              "@type": "Organization",
              name: "Victor Bona",
            },
            ...(article.journal && { 
              isPartOf: {
                "@type": "Periodical",
                name: article.journal,
              }
            }),
            ...(article.doi && { 
              sameAs: `https://doi.org/${article.doi}`,
            }),
            keywords: article.tags.join(", "),
          }),
        }}
      />

      <header className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
            article.status === 'published' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : article.status === 'preprint'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}>
            {article.status}
          </span>
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {article.type}
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-neutral-900 dark:text-neutral-100 leading-tight">
          {article.title}
        </h1>

        <div className="space-y-4 mb-8 text-neutral-600 dark:text-neutral-400">
          <div>
            <p className="font-medium text-neutral-800 dark:text-neutral-200">Authors</p>
            <p>{article.authors.join(", ")}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:gap-8 gap-4">
            <div>
              <p className="font-medium text-neutral-800 dark:text-neutral-200">Published</p>
              <time dateTime={article.publishedAt}>
                {formatDate(article.publishedAt)}
              </time>
            </div>
            
            {article.journal && (
              <div>
                <p className="font-medium text-neutral-800 dark:text-neutral-200">Journal</p>
                <p>{article.journal}</p>
              </div>
            )}
            
            {article.doi && (
              <div>
                <p className="font-medium text-neutral-800 dark:text-neutral-200">DOI</p>
                <a 
                  href={`https://doi.org/${article.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-700 dark:text-neutral-300 hover:underline"
                >
                  {article.doi}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="border-l-4 border-neutral-300 dark:border-neutral-700 pl-6 mb-8">
          <h2 className="font-medium text-lg mb-2 text-neutral-800 dark:text-neutral-200">Abstract</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {article.abstract}
          </p>
        </div>

        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map((tag) => (
              <Tag key={tag} name={tag} />
            ))}
          </div>
        )}

        {article.pdfUrl && (
          <div className="mb-8">
            <a 
              href={article.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-medium"
            >
              📄 Download PDF
            </a>
          </div>
        )}
      </header>

      {/* This would be where the article content goes - for now showing a placeholder */}
      <div className="prose prose-neutral dark:prose-invert max-w-none mb-12">
        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-8 text-center">
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Article content will be rendered here from LaTeX/MDX source files.
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Create <code>/app/articles/content/{article.slug}.mdx</code> or <code>/app/articles/content/{article.slug}.tex</code> to add the full content.
          </p>
        </div>
      </div>

      <footer className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
        <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
          <p>
            <strong>Citation:</strong> {article.authors.join(", ")}. ({new Date(article.publishedAt).getFullYear()}). 
            {article.title}. {article.journal && `${article.journal}.`} 
            {article.doi && ` https://doi.org/${article.doi}`}
          </p>
          {article.citationKey && (
            <p>
              <strong>BibTeX key:</strong> <code>{article.citationKey}</code>
            </p>
          )}
        </div>
      </footer>
    </article>
  );
}