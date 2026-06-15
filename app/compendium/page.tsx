import type { Metadata } from "next";
import { SectionHeader } from "app/components/SectionHeader";
import {
  getBreadcrumbJsonLd,
  getItemListJsonLd,
  withDefaultOpenGraphImage,
  withDefaultTwitterImage,
} from "app/lib/seo";
import { baseUrl } from "app/sitemap";
import { compendiumCollections } from "./collections";
import {
  CollectionRows,
  getCompendiumCollectionSummaries,
} from "./components/CompendiumIndex";
import { getCompendiumImportReport, getCompendiumNotes } from "./utils";

const title = "Compendium";
const description =
  "Indexed software engineering, data structures, design patterns, and Kubernetes notes from Victor Bona's technical compendium.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${baseUrl}/compendium`,
  },
  openGraph: withDefaultOpenGraphImage({
    title: `${title} - Victor Bona`,
    description,
    type: "website",
    url: `${baseUrl}/compendium`,
  }),
  twitter: withDefaultTwitterImage({
    card: "summary_large_image",
    title: `${title} - Victor Bona`,
    description,
  }),
};

export default function CompendiumPage() {
  const notes = getCompendiumNotes();
  const importReport = getCompendiumImportReport();
  const collections = getCompendiumCollectionSummaries({
    collections: compendiumCollections,
    notes,
    importReport,
  });
  const jsonLd = [
    getBreadcrumbJsonLd([
      { name: "Home", item: baseUrl },
      { name: "Compendium", item: `${baseUrl}/compendium` },
    ]),
    getItemListJsonLd(
      "Victor Bona Compendium Collections",
      collections.map((collection) => ({
        name: collection.title,
        url: `${baseUrl}${collection.route}`,
        description: collection.description,
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
          Technical index
        </p>
        <div>
          <h1 className="display-type text-2xl font-semibold text-[var(--color-foreground)]">
            Compendium
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            Durable notes organized as an archive: software engineering, data
            structures, design patterns, and Kubernetes.
          </p>
        </div>
      </div>
      <SectionHeader index="COLLECTIONS" title="Collections" />
      <CollectionRows collections={collections} />
    </section>
  );
}
