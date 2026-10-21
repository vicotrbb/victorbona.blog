import Link from "next/link";
import type { Article } from "app/articles/articles";

const monoLink =
  "text-[var(--text)] decoration-1 underline-offset-4 transition-colors duration-150 hover:underline";

export function PaperRow({ article, index }: { article: Article; index: number }) {
  const lit = Boolean(article.doi && article.status === "preprint");

  return (
    <li className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-2 border-t border-[var(--line)] py-5 sm:grid-cols-[3.5rem_minmax(0,1fr)]">
      <span
        className={`pt-1 font-mono text-sm tabular-nums ${lit ? "font-semibold text-[var(--lit)]" : "text-[var(--dim)]"}`}
      >
        [{index}]
      </span>
      <div className="min-w-0">
        <Link
          href={`/articles/${article.slug}`}
          className="text-lg font-semibold leading-snug tracking-[-0.01em] text-balance text-[var(--text)] decoration-[var(--lit)] decoration-1 underline-offset-4 hover:underline"
        >
          {article.title}
        </Link>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-xs text-[var(--dim)] sm:text-sm">
          <span className={lit ? "text-[var(--lit)]" : "text-[var(--text)]"}>{article.status}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={article.publishedAt} className="tabular-nums">
            {article.publishedAt.slice(0, 4)}
          </time>
          {article.doi && (
            <>
              <span aria-hidden="true">·</span>
              <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noopener noreferrer" className={`break-all ${monoLink}`}>
                DOI {article.doi}
              </a>
            </>
          )}
          {article.pdfUrl && (
            <>
              <span aria-hidden="true">·</span>
              <a href={article.pdfUrl} target="_blank" rel="noopener noreferrer" className={monoLink}>
                PDF
              </a>
            </>
          )}
        </p>
      </div>
    </li>
  );
}
