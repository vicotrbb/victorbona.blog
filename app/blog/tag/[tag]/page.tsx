import { getBlogPosts, getTags } from "app/blog/utils";
import { BlogPosts } from "app/components/posts";
import { baseUrl } from "app/sitemap";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getBreadcrumbJsonLd,
  getItemListJsonLd,
  ogImage,
  withDefaultOpenGraphImage,
  withDefaultTwitterImage,
} from "app/lib/seo";

export async function generateStaticParams() {
  return getTags().map((tag) => ({
    tag: encodeURIComponent(tag),
  }));
}

export async function generateMetadata(props: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const params = await props.params;
  const tag = decodeURIComponent(params.tag);
  // Same encoding as the sitemap, whatever form the param arrived in.
  const canonical = `${baseUrl}/blog/tag/${encodeURIComponent(tag)}`;

  return {
    title: `Posts tagged with "${tag}"`,
    description: `Browse all articles about ${tag}`,
    openGraph: withDefaultOpenGraphImage({
      title: `Posts tagged with "${tag}"`,
      description: `Browse all articles about ${tag}`,
      url: canonical,
      images: [ogImage(`Writing / ${tag}`, "P500 Writing")],
    }),
    twitter: withDefaultTwitterImage({
      card: "summary_large_image",
      title: `Posts tagged with "${tag}"`,
      description: `Browse all articles about ${tag}`,
      images: [ogImage(`Writing / ${tag}`, "P500 Writing")],
    }),
    alternates: {
      canonical,
    },
  };
}

export default async function TagPage(props: { params: Promise<{ tag: string }> }) {
  const params = await props.params;
  const tag = decodeURIComponent(params.tag);
  const posts = getBlogPosts().filter((post) =>
    post.metadata.tags
      ?.split(",")
      .map((t) => t.trim().toLowerCase())
      .includes(tag.toLowerCase())
  );

  if (posts.length === 0) {
    notFound();
  }
  const jsonLd = [
    getBreadcrumbJsonLd([
      { name: "Home", item: baseUrl },
      { name: "Blog", item: `${baseUrl}/blog` },
      { name: tag, item: `${baseUrl}/blog/tag/${encodeURIComponent(tag)}` },
    ]),
    getItemListJsonLd(
      `Posts tagged with ${tag}`,
      posts.map((post) => ({
        name: post.metadata.title,
        url: `${baseUrl}/blog/${post.slug}`,
        description: post.metadata.summary,
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
          <h1 className="flex flex-wrap items-baseline gap-x-4 gap-y-2 text-[clamp(2rem,4vw,3rem)] font-semibold leading-none tracking-[-0.03em] text-[var(--text)]">
            <span className="font-mono text-sm font-normal tracking-normal text-[var(--dim)]">P500</span>
            <span>
              Writing <span className="text-[var(--dim)]">/ {tag}</span>
            </span>
          </h1>
          <p className="font-mono text-sm tabular-nums text-[var(--dim)]">
            <span className="text-[var(--text)]">{posts.length}</span> {posts.length === 1 ? "post" : "posts"}
          </p>
        </div>
        <a
          href="/blog"
          className="mt-4 inline-block font-mono text-sm text-[var(--dim)] transition-colors duration-150 hover:text-[var(--text)]"
        >
          <span aria-hidden="true">$ </span>cd /blog
        </a>
      </header>
      <h2 className="mb-6 mt-10 font-mono text-sm text-[var(--dim)]">
        <span aria-hidden="true">$ </span>ls writing/ --tag="{tag}"
      </h2>
      <BlogPosts filter={{ tag }} />
    </section>
  );
}
