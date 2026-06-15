import { baseUrl } from "app/sitemap";
import type { CompendiumCollection, CompendiumNote } from "app/compendium/types";
import type { Metadata } from "next";

export const defaultOpenGraphImage = {
  url: `${baseUrl}/logos/og-image.png`,
  width: 1200,
  height: 630,
  alt: "Victor Bona monogram and site identity",
};

export const defaultTwitterImage = defaultOpenGraphImage.url;

type OpenGraphMetadata = NonNullable<Metadata["openGraph"]>;
type TwitterMetadata = NonNullable<Metadata["twitter"]>;

export const seoIds = {
  person: `${baseUrl}/#victor-bona`,
  website: `${baseUrl}/#website`,
  blog: `${baseUrl}/blog#blog`,
  compendium: `${baseUrl}/compendium#compendium`,
};

export function absoluteUrl(value?: string) {
  if (!value) return baseUrl;
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value, baseUrl).toString();
}

export function withDefaultOpenGraphImage(
  openGraph: OpenGraphMetadata
): OpenGraphMetadata {
  return {
    ...openGraph,
    images: openGraph.images ?? [defaultOpenGraphImage],
  };
}

export function withDefaultTwitterImage(
  twitter: TwitterMetadata
): TwitterMetadata {
  return {
    ...twitter,
    images: twitter.images ?? [defaultTwitterImage],
  };
}

export function getPersonJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": seoIds.person,
    name: "Victor Bona",
    url: baseUrl,
    email: "mailto:victor@victorbona.dev",
    jobTitle: "Full-stack engineer",
    sameAs: [
      "https://github.com/vicotrbb",
      "https://twitter.com/BonaVictor",
      "https://www.linkedin.com/in/victorbona/",
    ],
    knowsAbout: [
      "software architecture",
      "platform engineering",
      "Kubernetes",
      "cloud infrastructure",
      "security engineering",
      "AI systems",
      "developer tools",
      "observability",
    ],
  };
}

export function getWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": seoIds.website,
    name: "Victor Bona Blog",
    url: baseUrl,
    inLanguage: "en-US",
    author: { "@id": seoIds.person },
    publisher: { "@id": seoIds.person },
  };
}

export function getBlogJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": seoIds.blog,
    name: "Victor Bona Blog",
    url: `${baseUrl}/blog`,
    inLanguage: "en-US",
    author: { "@id": seoIds.person },
    publisher: { "@id": seoIds.person },
    isPartOf: { "@id": seoIds.website },
  };
}

export function getBreadcrumbJsonLd(
  items: Array<{ name: string; item: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.item),
    })),
  };
}

export function getItemListJsonLd(
  name: string,
  items: Array<{ name: string; url: string; description?: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(item.url),
      name: item.name,
      ...(item.description ? { description: item.description } : {}),
    })),
  };
}

export function getBlogPostingJsonLd({
  post,
  slug,
  tags,
  readingTime,
}: {
  post: {
    metadata: {
      title: string;
      publishedAt: string;
      summary: string;
      image?: string;
    };
    content: string;
  };
  slug: string;
  tags: string[];
  readingTime: number;
}) {
  const url = `${baseUrl}/blog/${slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.metadata.title,
    datePublished: post.metadata.publishedAt,
    dateModified: post.metadata.publishedAt,
    description: post.metadata.summary,
    image: post.metadata.image
      ? absoluteUrl(post.metadata.image)
      : `${baseUrl}/og?title=${encodeURIComponent(
          post.metadata.title
        )}&date=${post.metadata.publishedAt}`,
    url,
    inLanguage: "en-US",
    author: { "@id": seoIds.person },
    publisher: { "@id": seoIds.person },
    isPartOf: { "@id": seoIds.blog },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    keywords: tags.join(", "),
    articleSection: tags,
    articleBody: post.content,
    wordCount: post.content.split(/\s+/).length,
    timeRequired: `PT${readingTime}M`,
  };
}

export function getCompendiumNoteJsonLd(
  note: CompendiumNote,
  collection: CompendiumCollection
) {
  const url = `${baseUrl}/compendium/${note.collection}/${note.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${url}#article`,
    headline: note.title,
    description: note.excerpt,
    url,
    inLanguage: "en-US",
    author: { "@id": seoIds.person },
    publisher: { "@id": seoIds.person },
    isPartOf: {
      "@type": "CreativeWorkSeries",
      "@id": `${baseUrl}${collection.route}#collection`,
      name: `${collection.title} Compendium`,
      url: `${baseUrl}${collection.route}`,
      isPartOf: { "@id": seoIds.compendium },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    articleSection: collection.title,
    wordCount: note.wordCount,
    timeRequired: `PT${note.readingTime}M`,
    keywords: [collection.title, "compendium", note.title].join(", "),
  };
}

export function getScholarlyArticleJsonLd(article: {
  slug: string;
  title: string;
  abstract: string;
  authors: string[];
  publishedAt: string;
  pdfUrl?: string;
  journal?: string;
  doi?: string;
  tags: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "@id": `${baseUrl}/articles/${article.slug}#article`,
    headline: article.title,
    author: article.authors.map((name) =>
      name === "Victor Bona" ? { "@id": seoIds.person } : { "@type": "Person", name }
    ),
    datePublished: article.publishedAt,
    description: article.abstract,
    url: `${baseUrl}/articles/${article.slug}`,
    inLanguage: "en-US",
    publisher: { "@id": seoIds.person },
    isPartOf: { "@id": seoIds.website },
    ...(article.pdfUrl && {
      encoding: {
        "@type": "MediaObject",
        contentUrl: absoluteUrl(article.pdfUrl),
        encodingFormat: "application/pdf",
      },
    }),
    ...(article.journal && {
      isPartOf: {
        "@type": "Periodical",
        name: article.journal,
      },
    }),
    ...(article.doi && {
      sameAs: `https://doi.org/${article.doi}`,
    }),
    keywords: article.tags.join(", "),
  };
}
