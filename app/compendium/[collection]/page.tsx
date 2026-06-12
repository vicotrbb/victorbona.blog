import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionHeader } from "app/components/SectionHeader";
import { getBreadcrumbJsonLd, getItemListJsonLd } from "app/lib/seo";
import { baseUrl } from "app/sitemap";
import { compendiumCollections, getCompendiumCollection } from "../collections";
import {
  CompendiumStats,
  NoteRows,
  getCompendiumCollectionSummary,
} from "../components/CompendiumIndex";
import { getCompendiumImportReport, getCompendiumNotes } from "../utils";

type CollectionPageProps = {
  params: {
    collection: string;
  };
};

export function generateStaticParams() {
  return compendiumCollections.map((collection) => ({
    collection: collection.id,
  }));
}

export function generateMetadata({ params }: CollectionPageProps): Metadata {
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
    openGraph: {
      title: `${collection.title} Compendium - Victor Bona`,
      description: collection.description,
      type: "website",
      url: `${baseUrl}${collection.route}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${collection.title} Compendium - Victor Bona`,
      description: collection.description,
    },
  };
}

export default function CompendiumCollectionPage({
  params,
}: CollectionPageProps) {
  const collection = getCompendiumCollection(params.collection);

  if (!collection) {
    notFound();
  }

  const notes = getCompendiumNotes(collection.id);
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
    <section className="space-y-5">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <div className="grid gap-3 border-b border-[var(--color-rule)] pb-4 md:grid-cols-[12rem_1fr]">
        <p className="metadata-type text-[var(--color-accent)]">
          Compendium
        </p>
        <div>
          <h1 className="display-type text-2xl font-semibold text-[var(--color-foreground)]">
            {collection.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {collection.description}
          </p>
        </div>
      </div>
      <CompendiumStats summary={summary} />
      <SectionHeader index="NOTES" title="Ordered notes" />
      <NoteRows notes={notes} />
    </section>
  );
}
