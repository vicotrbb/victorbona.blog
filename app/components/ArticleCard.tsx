import { Article } from "app/articles/articles";
import Link from "next/link";
import { Tag } from "./Tag";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function getStatusBadgeStyle(status: Article['status']): string {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'independently published':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'preprint':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'draft':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeStyle(article.status)}`}>
            {article.status}
          </span>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {article.type}
          </span>
        </div>
        <time className="text-sm text-neutral-500 dark:text-neutral-400">
          {formatDate(article.publishedAt)}
        </time>
      </div>

      <Link href={`/articles/${article.slug}`} className="group">
        <h3 className="text-xl font-semibold mb-3 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors">
          {article.title}
        </h3>
      </Link>

      <div className="mb-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
          <strong>Authors:</strong> {article.authors.join(", ")}
        </p>
        {article.journal && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
            <strong>Published in:</strong> {article.journal}
          </p>
        )}
        {article.doi && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            <strong>DOI:</strong>{" "}
            <a 
              href={`https://doi.org/${article.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-700 dark:text-neutral-300 hover:underline"
            >
              {article.doi}
            </a>
          </p>
        )}
      </div>

      <p className="text-neutral-700 dark:text-neutral-300 mb-4 leading-relaxed">
        {article.abstract}
      </p>

      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags.map((tag) => (
            <Tag key={tag} name={tag} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <Link 
          href={`/articles/${article.slug}`}
          className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors font-medium"
        >
          Read full article →
        </Link>
        
        {article.pdfUrl && (
          <a 
            href={article.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors font-medium"
          >
            Download PDF
          </a>
        )}
      </div>
    </article>
  );
}