import { BlogPosts } from "app/components/posts";
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
            <span className="font-mono text-sm font-normal tracking-normal text-[var(--dim)]">P500</span>
            Writing
          </h1>
          <p className="font-mono text-sm tabular-nums text-[var(--dim)]">
            <span className="text-[var(--text)]">{posts.length}</span> posts
          </p>
        </div>
        <p className="mt-4 max-w-[60ch] text-[var(--dim)]">
          Essays and working notes on software architecture, infrastructure,
          AI tooling, APIs, and the tradeoffs behind production systems.
        </p>
      </header>
      <h2 className="mb-6 mt-10 font-mono text-sm text-[var(--dim)]">
        <span aria-hidden="true">$ </span>ls writing/ --sort=newest --group-by=year
      </h2>
      <BlogPosts />
    </section>
  );
}
