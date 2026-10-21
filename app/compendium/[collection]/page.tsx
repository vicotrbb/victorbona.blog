import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBreadcrumbJsonLd,
  getItemListJsonLd,
  ogImage,
  withDefaultOpenGraphImage,
  withDefaultTwitterImage,
} from "app/lib/seo";
import { baseUrl } from "app/sitemap";
import { compendiumCollections, getCompendiumCollection } from "../collections";
import {
  CompendiumStats,
  NoteRows,
  getCompendiumCollectionSummary,
} from "../components/CompendiumIndex";
import { CompendiumMdx } from "../components/CompendiumMdx";
import {
  getCompendiumImportReport,
  getCompendiumNote,
  getCompendiumNotes,
} from "../utils";

type CollectionPageProps = {
  params: Promise<{
    collection: string;
  }>;
};

function getStudyIndex(collectionId: string) {
  if (collectionId === "software-engineering") {
    return getCompendiumNote("software-engineering", "software-engineering");
  }

  if (collectionId === "kubernetes") {
    return getCompendiumNote("kubernetes", "kubernetes");
  }

  if (collectionId === "linux-systems-engineering") {
    return getCompendiumNote(
      "linux-systems-engineering",
      "linux-systems-engineering"
    );
  }

  if (collectionId === "nodejs-v8-runtime-engineering") {
    return getCompendiumNote(
      "nodejs-v8-runtime-engineering",
      "node-js-v8-runtime-engineering"
    );
  }

  if (collectionId === "rust") {
    return getCompendiumNote("rust", "rust");
  }

  return undefined;
}

function withoutLeadingTitle(content: string, title: string) {
  const heading = `# ${title}`;

  return content.startsWith(heading)
    ? content.slice(heading.length).replace(/^\s+/, "")
    : content;
}

export function generateStaticParams() {
  return compendiumCollections.map((collection) => ({
    collection: collection.id,
  }));
}

export async function generateMetadata(
  props: CollectionPageProps,
): Promise<Metadata> {
  const params = await props.params;
  const collection = getCompendiumCollection(params.collection);

  if (!collection) {
    return {};
  }

  return {
    title: `${collection.title} Compendium`,
    description: collection.description,
    alternates: {
      canonical: `${baseUrl}${collection.route}`,
    },
    openGraph: withDefaultOpenGraphImage({
      title: `${collection.title} Compendium - Victor Bona`,
      description: collection.description,
      type: "website",
      url: `${baseUrl}${collection.route}`,
      images: [ogImage(collection.title, "P600 Compendium")],
    }),
    twitter: withDefaultTwitterImage({
      card: "summary_large_image",
      title: `${collection.title} Compendium - Victor Bona`,
      description: collection.description,
      images: [ogImage(collection.title, "P600 Compendium")],
    }),
  };
}

export default async function CompendiumCollectionPage(
  props: CollectionPageProps,
) {
  const params = await props.params;
  const collection = getCompendiumCollection(params.collection);

  if (!collection) {
    notFound();
  }

  const notes = getCompendiumNotes(collection.id);
  const studyIndex = getStudyIndex(collection.id);
  const importReport = getCompendiumImportReport();
  const summary = getCompendiumCollectionSummary({
    collection,
    notes,
    importReport,
  });
  const jsonLd = [
    getBreadcrumbJsonLd([
      { name: "Home", item: baseUrl },
      { name: "Compendium", item: `${baseUrl}/compendium` },
      { name: collection.title, item: `${baseUrl}${collection.route}` },
    ]),
    getItemListJsonLd(
      `${collection.title} Compendium Notes`,
      notes.map((note) => ({
        name: note.title,
        url: `${baseUrl}/compendium/${note.collection}/${note.slug}`,
        description: note.excerpt,
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
            <Link
              href="/compendium"
              className="font-mono text-sm font-normal tracking-normal text-[var(--dim)] hover:text-[var(--text)]"
            >
              P600
            </Link>
            {collection.title}
          </h1>
          <p className="font-mono text-sm tabular-nums text-[var(--dim)]">
            Annex {summary.annex} · <span className="text-[var(--text)]">{summary.noteCount}</span> notes
          </p>
        </div>
        <p className="mt-4 max-w-[60ch] text-[var(--dim)]">
          {collection.description}
        </p>
      </header>
      <div className="mt-8">
        <CompendiumStats summary={summary} />
      </div>
      {studyIndex && (
        <section className="mt-10">
          <h2 className="mb-6 cmd">
            <span aria-hidden="true">$ </span>cat study-map
          </h2>
          <div className="prose compendium-content">
            <CompendiumMdx
              source={withoutLeadingTitle(studyIndex.content, studyIndex.title)}
            />
          </div>
        </section>
      )}
      <h2 className="mb-6 mt-10 cmd">
        <span aria-hidden="true">$ </span>ls {collection.id}/ --order=reading
      </h2>
      <NoteRows notes={notes} />
    </section>
  );
}
