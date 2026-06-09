import { notFound } from "next/navigation";
import { formatDate, getBlogPosts, getReadingTime } from "app/blog/utils";
import { baseUrl } from "app/sitemap";
import { ShareButton } from "app/components/ShareButton";
import type { Metadata } from "next";
import { ArticleWrapper } from "app/components/ArticleWrapper";
import { CustomMDX } from "app/components/mdx";
import { Tag } from "app/components/Tag";
import { RelatedPosts } from "app/components/RelatedPosts";
import { ReadingProgress } from "app/components/ReadingProgress";
import { getBlogPostingJsonLd, getBreadcrumbJsonLd } from "app/lib/seo";

export async function generateStaticParams() {
  let posts = getBlogPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }): Promise<Metadata> {
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

  const tags = post.metadata.tags.split(",").map((tag) => tag.trim());

  return {
    title: post.metadata.title,
    description: post.metadata.summary,
    authors: [{ name: "Victor Bona", url: baseUrl }],
    keywords: [...tags, "blog", "tech", "software development"],
    openGraph: {
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
          url: post.metadata.image
            ? `${baseUrl}${post.metadata.image}`
            : `${baseUrl}/og?${ogImageUrl}`,
          width: 1200,
          height: 630,
          alt: post.metadata.title,
        },
      ],
      siteName: "Victor Bona Blog",
    },
    twitter: {
      card: "summary_large_image",
      title: post.metadata.title,
      description: post.metadata.summary,
      creator: "@BonaVictor",
      site: "@BonaVictor",
      images: [post.metadata.image || `${baseUrl}/og?${ogImageUrl}`],
    },
    alternates: {
      canonical: `${baseUrl}/blog/${post.slug}`,
    },
  };
}

export default function Blog({ params }) {
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
    <section>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <div className="mx-auto max-w-[var(--max-reading)]">
        <article itemScope itemType="https://schema.org/BlogPosting">
          <ReadingProgress />

          <header className="mb-8 border-b border-[var(--color-rule)] pb-5">
            <h1
              className="display-type text-2xl font-semibold leading-tight text-[var(--color-foreground)] sm:text-3xl lg:text-4xl"
              itemProp="headline"
            >
              {post.metadata.title}
            </h1>

            <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--color-muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center flex-wrap gap-4">
                <time
                  dateTime={post.metadata.publishedAt}
                  itemProp="datePublished"
                  className="font-medium"
                >
                  {formatDate(post.metadata.publishedAt, true)}
                </time>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline font-medium">
                  {readingTime} min read
                </span>
                <span className="hidden sm:inline">•</span>
              </div>
              <ShareButton
                url={`${baseUrl}/blog/${post.slug}`}
                title={post.metadata.title}
                slug={post.slug}
              />
            </div>

            {post.metadata.summary && (
              <div className="mb-6 border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <p className="text-base leading-relaxed text-[var(--color-muted-foreground)]">
                  {post.metadata.summary}
                </p>
              </div>
            )}
          </header>

          <div
            className="prose prose-neutral dark:prose-invert prose-lg max-w-none"
            itemProp="articleBody"
          >
            <ArticleWrapper>
              <CustomMDX source={post.content} />
            </ArticleWrapper>
          </div>

          {post.metadata.tags && (
            <footer className="mt-8 border-t border-[var(--color-border)] pt-5">
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-4">
                Filed under
              </h3>
              <div className="flex flex-wrap gap-2 mb-8">
                {tags.map((tag) => (
                  <Tag key={tag} name={tag} />
                ))}
              </div>

              <RelatedPosts currentSlug={post.slug} tags={tags} />
            </footer>
          )}
        </article>
      </div>
    </section>
  );
}
