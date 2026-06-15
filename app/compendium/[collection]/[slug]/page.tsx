import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getBreadcrumbJsonLd,
  getCompendiumNoteJsonLd,
  withDefaultOpenGraphImage,
  withDefaultTwitterImage,
} from "app/lib/seo";
import { baseUrl } from "app/sitemap";
import {
  compendiumCollections,
  getCompendiumCollection,
} from "../../collections";
import { CompendiumMdx } from "../../components/CompendiumMdx";
import { CompendiumShell } from "../../components/CompendiumShell";
import {
  getAdjacentCompendiumNotes,
  getCompendiumNote,
  getCompendiumNotes,
  getRelatedCompendiumNotes,
} from "../../utils";

type CompendiumNotePageProps = {
  params: {
    collection: string;
    slug: string;
  };
};

function getNoteUrl(collection: string, slug: string) {
  return `${baseUrl}/compendium/${collection}/${slug}`;
}

export function generateStaticParams() {
  return compendiumCollections.flatMap((collection) =>
    getCompendiumNotes(collection.id).map((note) => ({
      collection: collection.id,
      slug: note.slug,
    }))
  );
}

export function generateMetadata({
  params,
}: CompendiumNotePageProps): Metadata {
  const note = getCompendiumNote(params.collection, params.slug);
  const collection = getCompendiumCollection(params.collection);

  if (!note || !collection) {
    return {};
  }

  const title = `${note.title} - ${collection.title} Compendium`;
  const url = getNoteUrl(note.collection, note.slug);

  return {
    title,
    description: note.excerpt,
    keywords: [
      collection.title,
      "compendium",
      "software engineering",
      note.title,
    ],
    alternates: {
      canonical: url,
    },
    openGraph: withDefaultOpenGraphImage({
      title,
      description: note.excerpt,
      type: "article",
      url,
      siteName: "Victor Bona Blog",
    }),
    twitter: withDefaultTwitterImage({
      card: "summary_large_image",
      title,
      description: note.excerpt,
      creator: "@BonaVictor",
    }),
  };
}

export default function CompendiumNotePage({
  params,
}: CompendiumNotePageProps) {
  const note = getCompendiumNote(params.collection, params.slug);
  const collection = getCompendiumCollection(params.collection);

  if (!note || !collection) {
    notFound();
  }

  const collectionNotes = getCompendiumNotes(note.collection);
  const relatedNotes = getRelatedCompendiumNotes(note);
  const adjacent = getAdjacentCompendiumNotes(note);
  const url = getNoteUrl(note.collection, note.slug);
  const jsonLd = [
    getCompendiumNoteJsonLd(note, collection),
    getBreadcrumbJsonLd([
      { name: "Home", item: baseUrl },
      { name: "Compendium", item: `${baseUrl}/compendium` },
      { name: collection.title, item: `${baseUrl}${collection.route}` },
      { name: note.title, item: url },
    ]),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <CompendiumShell
        note={note}
        collectionTitle={collection.title}
        collectionNotes={collectionNotes}
        relatedNotes={relatedNotes}
        previous={adjacent.previous}
        next={adjacent.next}
      >
        <CompendiumMdx source={note.content} />
      </CompendiumShell>
    </>
  );
}
