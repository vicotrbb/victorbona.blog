import Link from "next/link";
import { getAnnexLetter } from "../collections";
import type { CompendiumCollection, CompendiumNote } from "../types";

type ImportReference = {
  from: string;
};

type CompendiumImportReport = {
  externalReferences?: ImportReference[];
};

export type CompendiumCollectionSummary = CompendiumCollection & {
  annex: string;
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
    annex: getAnnexLetter(collection.id),
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
    <li className="border-t border-[var(--line)]">
      <Link href={collection.route} className="group block py-4">
        <p className="font-mono text-sm">
          <span className="text-[var(--dim)]">Annex {collection.annex} — </span>
          <span className="text-[var(--text)] decoration-[var(--lit)] decoration-1 underline-offset-4 group-hover:underline">
            {collection.title}
          </span>
          <span className="tabular-nums text-[var(--dim)]">
            {" "}
            · {formatCount(collection.noteCount, "note")}
          </span>
        </p>
        <p className="mt-1.5 line-clamp-2 max-w-[68ch] text-sm leading-relaxed text-[var(--dim)]">
          {collection.description}
        </p>
        <p className="mt-1.5 font-mono text-xs tabular-nums text-[var(--dim)]">
          {collection.readingTime} min
          {collection.diagramCount > 0 &&
            ` · ${formatCount(collection.diagramCount, "diagram")}`}
        </p>
      </Link>
    </li>
  );
}

export function CollectionRows({
  collections,
}: {
  collections: CompendiumCollectionSummary[];
}) {
  return (
    <ul className="border-b border-[var(--line)]">
      {collections.map((collection) => (
        <CollectionRow key={collection.id} collection={collection} />
      ))}
    </ul>
  );
}

export function NoteRow({ note }: { note: CompendiumNote }) {
  return (
    <li className="border-t border-[var(--line)]">
      <Link
        href={`/compendium/${note.collection}/${note.slug}`}
        className="group grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-baseline"
      >
        <span className="font-mono text-xs tabular-nums text-[var(--dim)]">
          No. {note.order + 1}
        </span>
        <span className="min-w-0">
          <span className="block text-[var(--text)] decoration-[var(--lit)] decoration-1 underline-offset-4 group-hover:underline group-focus-visible:underline">
            {note.title}
          </span>
          <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-[var(--dim)]">
            {note.excerpt}
          </span>
        </span>
        <span className="font-mono text-xs tabular-nums text-[var(--dim)] sm:text-right">
          {note.readingTime} min
          {note.diagramCount > 0 &&
            ` · ${formatCount(note.diagramCount, "diagram")}`}
        </span>
      </Link>
    </li>
  );
}

export function NoteRows({ notes }: { notes: CompendiumNote[] }) {
  return (
    <ul className="border-b border-[var(--line)]">
      {notes.map((note) => (
        <NoteRow key={`${note.collection}-${note.slug}`} note={note} />
      ))}
    </ul>
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
  const stats = [
    ["notes", summary.noteCount],
    ["minutes", summary.readingTime],
    ["references", summary.referenceCount],
    ["diagrams", summary.diagramCount],
  ] as const;

  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-2 border border-[var(--line)] bg-[var(--panel)] px-4 py-3 font-mono text-sm">
      {stats.map(([label, value]) => (
        <div key={label} className="flex items-baseline gap-2">
          <dd className="tabular-nums text-[var(--text)]">{value}</dd>
          <dt className="text-[var(--dim)]">{label}</dt>
        </div>
      ))}
    </dl>
  );
}
