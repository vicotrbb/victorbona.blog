import Link from "next/link";
import type { ReactNode } from "react";
import type { CompendiumNote } from "../types";

function noteHref(note: CompendiumNote) {
  return `/compendium/${note.collection}/${note.slug}`;
}

function formatCount(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function NoteLink({
  note,
  active = false,
}: {
  note: CompendiumNote;
  active?: boolean;
}) {
  return (
    <Link
      href={noteHref(note)}
      aria-current={active ? "page" : undefined}
      className={[
        "block border-l-2 py-1.5 pl-3 leading-snug outline-none transition-colors",
        active
          ? "border-[var(--color-accent)] font-semibold text-[var(--color-foreground)]"
          : "border-transparent text-[var(--color-muted-foreground)] hover:border-[var(--color-border)] hover:text-[var(--color-foreground)] focus-visible:border-[var(--color-accent)] focus-visible:text-[var(--color-foreground)]",
      ].join(" ")}
    >
      {note.title}
    </Link>
  );
}

export function CompendiumShell({
  note,
  collectionTitle,
  collectionNotes,
  relatedNotes,
  previous,
  next,
  children,
}: {
  note: CompendiumNote;
  collectionTitle: string;
  collectionNotes: CompendiumNote[];
  relatedNotes: CompendiumNote[];
  previous?: CompendiumNote;
  next?: CompendiumNote;
  children: ReactNode;
}) {
  return (
    <article className="compendium-grid">
      <aside className="compendium-sidebar">
        <p className="metadata-type text-[var(--color-accent)]">
          {collectionTitle}
        </p>
        <nav
          aria-label={`${collectionTitle} notes`}
          className="mt-3 grid gap-1 text-sm"
        >
          {collectionNotes.map((item) => (
            <NoteLink
              key={`${item.collection}-${item.slug}`}
              note={item}
              active={item.collection === note.collection && item.slug === note.slug}
            />
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-[var(--color-rule)] pb-5">
          <p className="metadata-type text-[var(--color-accent)]">
            Compendium note
          </p>
          <h1 className="display-type mt-2 text-3xl font-semibold leading-tight text-[var(--color-foreground)] md:text-4xl">
            {note.title}
          </h1>
          <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--color-muted-foreground)]">
            <div className="flex gap-1">
              <dt className="sr-only">Reading time</dt>
              <dd>{note.readingTime} min read</dd>
            </div>
            <div className="flex gap-1">
              <dt className="sr-only">Word count</dt>
              <dd>{formatCount(note.wordCount, "word")}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="sr-only">Diagram count</dt>
              <dd>{formatCount(note.diagramCount, "diagram")}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
            Source: Victor Bona&apos;s Obsidian Compendium snapshot,{" "}
            <span className="break-words">{note.sourcePath}</span>.
          </p>
        </header>

        <div className="prose compendium-content mt-6">{children}</div>

        {(relatedNotes.length > 0 || previous || next) && (
          <footer className="mt-10 border-t border-[var(--color-rule)] pt-5">
            {relatedNotes.length > 0 && (
              <section aria-labelledby="compendium-related-notes">
                <h2
                  id="compendium-related-notes"
                  className="metadata-type text-[var(--color-muted-foreground)]"
                >
                  Related notes
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {relatedNotes.map((related) => (
                    <Link
                      key={`${related.collection}-${related.slug}`}
                      href={noteHref(related)}
                      className="border border-[var(--color-border)] px-2 py-1 text-sm text-[var(--color-muted-foreground)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-foreground)] focus-visible:border-[var(--color-accent)] focus-visible:text-[var(--color-foreground)]"
                    >
                      {related.title}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {(previous || next) && (
              <nav
                aria-label="Adjacent Compendium notes"
                className="mt-6 grid gap-3 border-t border-[var(--color-border)] pt-5 text-sm md:grid-cols-2"
              >
                <div>
                  {previous && (
                    <Link
                      href={noteHref(previous)}
                      className="group block text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)] focus-visible:text-[var(--color-foreground)]"
                    >
                      <span className="metadata-type block text-[var(--color-accent)]">
                        Previous
                      </span>
                      <span className="mt-1 block leading-snug">
                        {previous.title}
                      </span>
                    </Link>
                  )}
                </div>
                <div className="md:text-right">
                  {next && (
                    <Link
                      href={noteHref(next)}
                      className="group block text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)] focus-visible:text-[var(--color-foreground)]"
                    >
                      <span className="metadata-type block text-[var(--color-accent)]">
                        Next
                      </span>
                      <span className="mt-1 block leading-snug">
                        {next.title}
                      </span>
                    </Link>
                  )}
                </div>
              </nav>
            )}
          </footer>
        )}
      </div>

      <aside className="compendium-toc">
        <p className="metadata-type text-[var(--color-muted-foreground)]">
          On this page
        </p>
        <nav aria-label="On this page" className="mt-3 grid gap-2 text-sm">
          {note.toc.length === 0 ? (
            <span className="text-[var(--color-muted-foreground)]">
              No sections
            </span>
          ) : (
            note.toc.map((item, index) => (
              <a
                key={`${item.id}-${index}`}
                href={`#${item.id}`}
                className={[
                  "leading-snug text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)] focus-visible:text-[var(--color-foreground)]",
                  item.level === 3 ? "pl-3" : "",
                ].join(" ")}
              >
                {item.text}
              </a>
            ))
          )}
        </nav>
      </aside>
    </article>
  );
}
