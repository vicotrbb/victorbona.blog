import { BlogPosts } from "app/components/posts";
import { SectionHeader } from "app/components/SectionHeader";
import { baseUrl } from "app/sitemap";
import { getBlogPosts } from "./utils";
import {
  getBreadcrumbJsonLd,
  getItemListJsonLd,
  withDefaultOpenGraphImage,
  withDefaultTwitterImage,
} from "app/lib/seo";

export const metadata = {
  title: "Victor Bona Blog",
  description:
    "Explore articles about software engineering, web development, and technology written by Victor Bona.",
  alternates: {
    canonical: `${baseUrl}/blog`,
  },
  openGraph: withDefaultOpenGraphImage({
    title: "Victor Bona Blog",
    description:
      "Explore articles about software engineering, web development, and technology written by Victor Bona.",
    type: "website",
    url: `${baseUrl}/blog`,
  }),
  twitter: withDefaultTwitterImage({
    card: "summary_large_image",
    title: "Victor Bona Blog",
    description:
      "Explore articles about software engineering, web development, and technology written by Victor Bona.",
  }),
};

export default function Page() {
  const posts = getBlogPosts()
    .sort(
      (a, b) =>
        new Date(b.metadata.publishedAt).getTime() -
        new Date(a.metadata.publishedAt).getTime()
    )
    .map((post) => ({
      name: post.metadata.title,
      url: `${baseUrl}/blog/${post.slug}`,
      description: post.metadata.summary,
    }));
  const jsonLd = [
    getBreadcrumbJsonLd([
      { name: "Home", item: baseUrl },
      { name: "Blog", item: `${baseUrl}/blog` },
    ]),
    getItemListJsonLd("Victor Bona Blog Posts", posts),
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
        <p className="metadata-type text-[var(--color-accent)]">Field notes</p>
        <div>
          <h1 className="display-type text-2xl font-semibold text-[var(--color-foreground)]">
            Writing archive
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            Essays and working notes on software architecture, infrastructure,
            AI tooling, APIs, and the tradeoffs behind production systems.
          </p>
        </div>
      </div>
      <SectionHeader index="ALL" title="All notes" />
      <BlogPosts />
    </section>
  );
}
