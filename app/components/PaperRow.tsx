import Link from "next/link";
import { Article } from "app/articles/articles";
import { MetadataLine } from "./MetadataLine";

export function PaperRow({ article }: { article: Article }) {
  return (
    <article className="border-b border-[var(--color-border)] py-3 last:border-b-0">
      <MetadataLine
        items={[article.status, article.type, article.publishedAt]}
      />
      <Link href={`/articles/${article.slug}`} className="group mt-1 block">
        <h3 className="font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-accent)]">
          {article.title}
        </h3>
      </Link>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        {article.abstract}
      </p>
    </article>
  );
}

export function EmptyPaperArchive() {
  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="metadata-type text-[var(--color-accent)]">Longer work</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        Papers and slower-form technical work will live here when they are
        ready. The archive stays quiet until it has something worth indexing.
      </p>
    </div>
  );
}
