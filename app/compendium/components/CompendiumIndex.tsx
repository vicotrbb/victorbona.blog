import Link from "next/link";
import { MetadataLine } from "app/components/MetadataLine";
import type { CompendiumCollection, CompendiumNote } from "../types";

type ImportReference = {
  from: string;
};

type CompendiumImportReport = {
  externalReferences?: ImportReference[];
};

export type CompendiumCollectionSummary = CompendiumCollection & {
  noteCount: number;
  readingTime: number;
  referenceCount: number;
  diagramCount: number;
};

function formatCount(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getExternalReferenceCount(
  notes: CompendiumNote[],
  report: CompendiumImportReport
) {
  const sourcePaths = new Set(notes.map((note) => note.sourcePath));

  return (
    report.externalReferences?.filter((reference) =>
      sourcePaths.has(reference.from)
    ).length ?? 0
  );
}

export function getCompendiumCollectionSummary({
  collection,
  notes,
  importReport,
}: {
  collection: CompendiumCollection;
  notes: CompendiumNote[];
  importReport: CompendiumImportReport;
}): CompendiumCollectionSummary {
  return {
    ...collection,
    noteCount: notes.length,
    readingTime: notes.reduce((total, note) => total + note.readingTime, 0),
    referenceCount:
      notes.reduce((total, note) => total + note.outgoingLinks.length, 0) +
      getExternalReferenceCount(notes, importReport),
    diagramCount: notes.reduce((total, note) => total + note.diagramCount, 0),
  };
}

export function getCompendiumCollectionSummaries({
  collections,
  notes,
  importReport,
}: {
  collections: CompendiumCollection[];
  notes: CompendiumNote[];
  importReport: CompendiumImportReport;
}) {
  return collections.map((collection) =>
    getCompendiumCollectionSummary({
      collection,
      notes: notes.filter((note) => note.collection === collection.id),
      importReport,
    })
  );
}

export function CollectionRow({
  collection,
}: {
  collection: CompendiumCollectionSummary;
}) {
  return (
    <Link
      href={collection.route}
      className="group block border-b border-[var(--color-border)] py-3 last:border-b-0"
    >
      <article className="grid gap-2 sm:grid-cols-[11rem_1fr] sm:gap-4">
        <MetadataLine
          items={[
            formatCount(collection.noteCount, "note"),
            `${collection.readingTime} min`,
            collection.diagramCount > 0
              ? formatCount(collection.diagramCount, "diagram")
              : undefined,
          ]}
        />
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-snug text-[var(--color-foreground)] group-hover:text-[var(--color-accent)]">
            {collection.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {collection.description}
          </p>
        </div>
      </article>
    </Link>
  );
}

export function CollectionRows({
  collections,
}: {
  collections: CompendiumCollectionSummary[];
}) {
  return (
    <div className="border border-[var(--color-border)] px-3">
      {collections.map((collection) => (
        <CollectionRow key={collection.id} collection={collection} />
      ))}
    </div>
  );
}

export function NoteRow({ note }: { note: CompendiumNote }) {
  return (
    <article
      id={note.slug}
      className="scroll-mt-8 border-b border-[var(--color-border)] py-3 last:border-b-0"
    >
      <div className="grid gap-2 sm:grid-cols-[11rem_1fr] sm:gap-4">
        <MetadataLine
          items={[
            `No. ${note.order + 1}`,
            `${note.readingTime} min`,
            note.diagramCount > 0
              ? formatCount(note.diagramCount, "diagram")
              : undefined,
          ]}
        />
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-snug text-[var(--color-foreground)]">
            {note.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {note.excerpt}
          </p>
        </div>
      </div>
    </article>
  );
}

export function NoteRows({ notes }: { notes: CompendiumNote[] }) {
  return (
    <div className="border border-[var(--color-border)] px-3">
      {notes.map((note) => (
        <NoteRow key={`${note.collection}-${note.slug}`} note={note} />
      ))}
    </div>
  );
}

export function CompendiumStats({
  summary,
}: {
  summary: Pick<
    CompendiumCollectionSummary,
    "noteCount" | "readingTime" | "referenceCount" | "diagramCount"
  >;
}) {
  return (
    <dl className="grid gap-3 border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:grid-cols-4">
      <div>
        <dt className="metadata-type text-[var(--color-accent)]">Notes</dt>
        <dd className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
          {summary.noteCount}
        </dd>
      </div>
      <div>
        <dt className="metadata-type text-[var(--color-accent)]">Reading</dt>
        <dd className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
          {summary.readingTime} min
        </dd>
      </div>
      <div>
        <dt className="metadata-type text-[var(--color-accent)]">References</dt>
        <dd className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
          {summary.referenceCount}
        </dd>
      </div>
      <div>
        <dt className="metadata-type text-[var(--color-accent)]">Diagrams</dt>
        <dd className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
          {summary.diagramCount}
        </dd>
      </div>
    </dl>
  );
}
