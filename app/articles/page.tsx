import { getArticles } from "./articles";
import { ArticleCard } from "app/components/ArticleCard";
import { baseUrl } from "app/sitemap";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles & Papers",
  description: "Academic papers and technical articles on software engineering, distributed systems, and modern web development.",
  openGraph: {
    title: "Articles & Papers - Victor Bona",
    description: "Academic papers and technical articles on software engineering, distributed systems, and modern web development.",
    url: `${baseUrl}/articles`,
  },
};

export default function ArticlesPage() {
  const articles = getArticles();
  const publishedArticles = articles.filter(article => article.status === 'published');
  const independentlyPublishedArticles = articles.filter(article => article.status === 'independently published');
  const preprintArticles = articles.filter(article => article.status === 'preprint');

  return (
    <section className="space-y-8">
      <div>
        <h1 className="font-semibold text-3xl mb-4 tracking-tighter text-neutral-900 dark:text-neutral-100">
          Articles & Papers
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed">
          A collection of academic papers and in-depth technical articles exploring 
          software engineering, distributed systems, and modern development practices.
        </p>
      </div>

      {publishedArticles.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6 tracking-tight text-neutral-800 dark:text-neutral-200">
            Published Papers & Articles
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {publishedArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
      )}

      {independentlyPublishedArticles.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6 tracking-tight text-neutral-800 dark:text-neutral-200">
            Independently Published
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {independentlyPublishedArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
      )}

      {preprintArticles.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6 tracking-tight text-neutral-800 dark:text-neutral-200">
            Preprints & Working Papers
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {preprintArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
      )}

      {articles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-neutral-500 dark:text-neutral-400">
            No articles published yet. Check back soon!
          </p>
        </div>
      )}
    </section>
  );
}