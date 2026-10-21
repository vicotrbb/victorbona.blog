import type { Metadata } from "next";
import {
  getBreadcrumbJsonLd,
  getItemListJsonLd,
  ogImage,
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
  "Indexed software engineering, data structures, design patterns, Kubernetes, Linux systems engineering, Node.js V8 runtime, Rust, and CPU LLM inference notes from Victor Bona's technical compendium.";

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
    images: [ogImage(title, "P600 Compendium")],
  }),
  twitter: withDefaultTwitterImage({
    card: "summary_large_image",
    title: `${title} - Victor Bona`,
    description,
    images: [ogImage(title, "P600 Compendium")],
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
            <span className="font-mono text-sm font-normal tracking-normal text-[var(--dim)]">P600</span>
            Compendium
          </h1>
          <p className="font-mono text-sm tabular-nums text-[var(--dim)]">
            <span className="text-[var(--text)]">{notes.length}</span> notes ·{" "}
            <span className="text-[var(--text)]">{collections.length}</span> annexes
          </p>
        </div>
        <p className="mt-4 max-w-[60ch] text-[var(--dim)]">
          Durable notes organized as an archive: software engineering, data
          structures, design patterns, Kubernetes, Linux systems engineering,
          Node.js V8 runtime engineering, Rust, and CPU LLM inference.
        </p>
      </header>
      <h2 className="mb-6 mt-10 font-mono text-sm text-[var(--dim)]">
        <span aria-hidden="true">$ </span>ls compendium/ --annex
      </h2>
      <CollectionRows collections={collections} />
    </section>
  );
}
