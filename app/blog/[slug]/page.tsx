import { notFound } from "next/navigation";
import { getBlogPosts, getReadingTime } from "app/blog/utils";
import { baseUrl } from "app/sitemap";
import { ShareButton } from "app/components/ShareButton";
import type { Metadata } from "next";
import { ArticleWrapper } from "app/components/ArticleWrapper";
import { CustomMDX } from "app/components/mdx";
import { Tag } from "app/components/Tag";
import { RelatedPosts } from "app/components/RelatedPosts";
import { ReadingProgress } from "app/components/ReadingProgress";
import { TableOfContents } from "app/components/TableOfContents";
import { ContactCommand } from "app/components/ContactCommand";
import { profile } from "app/lib/profile";
import {
  absoluteUrl,
  getBlogPostingJsonLd,
  getBreadcrumbJsonLd,
  withDefaultOpenGraphImage,
  withDefaultTwitterImage,
} from "app/lib/seo";

export async function generateStaticParams() {
  let posts = getBlogPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const post = getBlogPosts().find((post) => post.slug === params.slug);
  if (!post) {
    return {};
  }

  const readingTime = getReadingTime(post.content);
  const ogImageUrl = new URLSearchParams({
    title: post.metadata.title,
    publishedAt: post.metadata.publishedAt,
    readingTime: readingTime.toString(),
    summary: post.metadata.summary,
    tags: post.metadata.tags,
  }).toString();
  const imageUrl = post.metadata.image
    ? absoluteUrl(post.metadata.image)
    : `${baseUrl}/og?${ogImageUrl}`;

  const tags = post.metadata.tags.split(",").map((tag) => tag.trim());

  return {
    title: post.metadata.title,
    description: post.metadata.summary,
    authors: [{ name: "Victor Bona", url: baseUrl }],
    keywords: [...tags, "blog", "tech", "software development"],
    openGraph: withDefaultOpenGraphImage({
      title: post.metadata.title,
      description: post.metadata.summary,
      type: "article",
      url: `${baseUrl}/blog/${post.slug}`,
      publishedTime: post.metadata.publishedAt,
      modifiedTime: post.metadata.publishedAt,
      authors: ["Victor Bona"],
      tags: tags,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.metadata.title,
        },
      ],
      siteName: "Victor Bona Blog",
    }),
    twitter: withDefaultTwitterImage({
      card: "summary_large_image",
      title: post.metadata.title,
      description: post.metadata.summary,
      creator: "@BonaVictor",
      site: "@BonaVictor",
      images: [imageUrl],
    }),
    alternates: {
      canonical: `${baseUrl}/blog/${post.slug}`,
    },
  };
}

export default async function Blog(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const post = getBlogPosts().find((post) => post.slug === params.slug);

  if (!post) {
    notFound();
  }

  const readingTime = getReadingTime(post.content);
  const tags = post.metadata.tags.split(",").map((tag) => tag.trim());
  const jsonLd = [
    getBlogPostingJsonLd({
      post,
      slug: post.slug,
      tags,
      readingTime,
    }),
    getBreadcrumbJsonLd([
      { name: "Home", item: baseUrl },
      { name: "Blog", item: `${baseUrl}/blog` },
      { name: post.metadata.title, item: `${baseUrl}/blog/${post.slug}` },
    ]),
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
      <ReadingProgress />

      {/* Same font size as .prose so 68ch here equals the body's measure. */}
      <div className="mx-auto max-w-[var(--measure)] text-[clamp(1.0625rem,1rem+0.25vw,1.125rem)]">
        <article className="relative">
          <header className="border-b border-[var(--line)] pb-8">
            <h1 className="text-[clamp(2rem,1.4rem+2.4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-balance text-[var(--text)]">
              {post.metadata.title}
            </h1>
            {post.metadata.summary && (
              <p className="mt-5 text-lg leading-relaxed text-[var(--dim)] sm:text-xl">{post.metadata.summary}</p>
            )}
            <div className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-xs text-[var(--dim)] sm:text-sm">
              <time dateTime={post.metadata.publishedAt} className="tabular-nums text-[var(--text)]">
                {String(post.metadata.publishedAt).slice(0, 10)}
              </time>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{readingTime} min</span>
              <span aria-hidden="true">·</span>
              {tags.map((tag, index) => (
                <span key={tag}>
                  <Tag name={tag} />
                  {index < tags.length - 1 && ","}
                </span>
              ))}
              <span aria-hidden="true">·</span>
              <ShareButton
                url={`${baseUrl}/blog/${post.slug}`}
                title={post.metadata.title}
                slug={post.slug}
              />
            </div>
          </header>

          <aside className="absolute left-full top-0 ml-8 hidden h-full w-52 xl:block">
            <div className="sticky top-24">
              <TableOfContents />
            </div>
          </aside>

          <ArticleWrapper>
            <CustomMDX source={post.content} />
          </ArticleWrapper>
        </article>

        <section
          aria-labelledby="contact"
          className="mt-16 border border-[var(--line-strong)] bg-[var(--panel)] px-6 py-10 sm:px-10"
        >
          <h2 id="contact" className="max-w-[24ch] text-2xl font-semibold tracking-[-0.02em] text-balance text-[var(--text)] sm:text-3xl">
            Questions about this post, or building something like it?
          </h2>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <ContactCommand variant="inline" />
            <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className="text-[var(--dim)] transition-colors duration-150 hover:text-[var(--text)]">
              LinkedIn
            </a>
            <a href={profile.links.x} target="_blank" rel="noopener noreferrer" className="text-[var(--dim)] transition-colors duration-150 hover:text-[var(--text)]">
              X
            </a>
          </div>
        </section>

        <div className="mt-16">
          <RelatedPosts currentSlug={post.slug} tags={tags} />
        </div>
      </div>
    </section>
  );
}
