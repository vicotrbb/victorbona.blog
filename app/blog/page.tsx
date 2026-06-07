import { BlogPosts } from "app/components/posts";
import { SectionHeader } from "app/components/SectionHeader";
import { baseUrl } from "app/sitemap";

export const metadata = {
  title: "Victor Bona Blog",
  description:
    "Explore articles about software engineering, web development, and technology written by Victor Bona.",
  openGraph: {
    title: "Victor Bona Blog",
    description:
      "Explore articles about software engineering, web development, and technology written by Victor Bona.",
    type: "website",
    url: `${baseUrl}/blog`,
  },
};

export default function Page() {
  return (
    <section className="space-y-5">
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
