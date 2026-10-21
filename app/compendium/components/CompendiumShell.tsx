import Link from "next/link";
import type { ReactNode } from "react";
import { ContactCommand } from "app/components/ContactCommand";
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
        "block border-l py-1.5 pl-3 leading-snug outline-none transition-colors focus-visible:border-[var(--lit)] focus-visible:text-[var(--text)]",
        active
          ? "border-[var(--lit)] text-[var(--text)]"
          : "border-[var(--line)] text-[var(--dim)] hover:border-[var(--line-strong)] hover:text-[var(--text)]",
      ].join(" ")}
    >
      {note.title}
    </Link>
  );
}

export function CompendiumShell({
  note,
  collectionTitle,
  annex,
  collectionNotes,
  relatedNotes,
  previous,
  next,
  children,
}: {
  note: CompendiumNote;
  collectionTitle: string;
  annex: string;
  collectionNotes: CompendiumNote[];
  relatedNotes: CompendiumNote[];
  previous?: CompendiumNote;
  next?: CompendiumNote;
  children: ReactNode;
}) {
  return (
    <article className="compendium-grid">
      <aside className="compendium-sidebar">
        <p className="font-mono text-xs text-[var(--dim)]">
          <Link href="/compendium" className="hover:text-[var(--text)]">P600</Link>
          {" / "}Annex {annex}
        </p>
        <p className="mt-1 font-semibold text-[var(--text)]">{collectionTitle}</p>
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
        <header className="border-b border-[var(--line)] pb-6">
          <h1 className="max-w-[var(--measure)] text-[clamp(2rem,1.4rem+2.4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-balance text-[var(--text)]">
            {note.title}
          </h1>
          <p className="mt-5 flex flex-wrap gap-x-2 gap-y-1 font-mono text-xs tabular-nums text-[var(--dim)] sm:text-sm">
            <span>{note.readingTime} min</span>
            <span aria-hidden="true">·</span>
            <span>{formatCount(note.wordCount, "word")}</span>
            <span aria-hidden="true">·</span>
            <span>{formatCount(note.diagramCount, "diagram")}</span>
          </p>
          <p className="mt-3 text-xs leading-relaxed text-[var(--dim)]">
            Source: Victor Bona&apos;s Obsidian Compendium snapshot,{" "}
            <span className="break-words">{note.sourcePath}</span>.
          </p>
        </header>

        <div className="prose compendium-content mt-8">{children}</div>

        {(relatedNotes.length > 0 || previous || next) && (
          <footer className="mt-10 border-t border-[var(--line)] pt-6">
            {relatedNotes.length > 0 && (
              <section aria-labelledby="compendium-related-notes">
                <h2
                  id="compendium-related-notes"
                  className="font-mono text-sm text-[var(--dim)]"
                >
                  <span aria-hidden="true">$ </span>ls related/
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {relatedNotes.map((related) => (
                    <Link
                      key={`${related.collection}-${related.slug}`}
                      href={noteHref(related)}
                      className="border border-[var(--line)] px-2 py-1 text-sm text-[var(--dim)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--text)] focus-visible:border-[var(--lit)] focus-visible:text-[var(--text)]"
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
                className="mt-6 grid gap-3 border-t border-[var(--line)] pt-5 text-sm md:grid-cols-2"
              >
                <div>
                  {previous && (
                    <Link
                      href={noteHref(previous)}
                      className="group block text-[var(--dim)] transition-colors hover:text-[var(--text)] focus-visible:text-[var(--text)]"
                    >
                      <span className="block font-mono text-xs text-[var(--dim)]">
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
                      className="group block text-[var(--dim)] transition-colors hover:text-[var(--text)] focus-visible:text-[var(--text)]"
                    >
                      <span className="block font-mono text-xs text-[var(--dim)]">
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

        <section
          aria-label="Contact"
          className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border border-[var(--line-strong)] bg-[var(--panel)] px-6 py-5 text-sm"
        >
          <ContactCommand variant="inline" />
        </section>
      </div>
    </article>
  );
}
