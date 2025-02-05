import { notFound } from "next/navigation";
import { formatDate, getBlogPosts, getReadingTime } from "app/blog/utils";
import { baseUrl } from "app/sitemap";
import { ShareButton } from "app/components/ShareButton";
import type { Metadata } from "next";
import { PlusOneButton } from "app/components/PlusOneButton";
import { PlusOneCount } from "app/components/PlusOneCount";
import { ArticleWrapper } from "app/components/ArticleWrapper";
import { CustomMDX } from "app/components/mdx";
import { Tag } from "app/components/Tag";
import { RelatedPosts } from "app/components/RelatedPosts";
import { TableOfContents } from "app/components/TableOfContents";
import { ReadingProgress } from "app/components/ReadingProgress";

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
    slug: params.slug,
    tags: post.metadata.tags,
  }).toString();

  const tags = post.metadata.tags.split(",").map((tag) => tag.trim());

  return {
    title: `${post.metadata.title} | Victor Bona Blog`,
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

  return (
    <section>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.summary,
            image: post.metadata.image
              ? `${baseUrl}${post.metadata.image}`
              : `${baseUrl}/og?title=${encodeURIComponent(
                  post.metadata.title
                )}&date=${post.metadata.publishedAt}`,
            url: `${baseUrl}/blog/${post.slug}`,
            author: {
              "@type": "Person",
              name: "Victor Bona",
              url: baseUrl,
              "@id": `${baseUrl}#author`,
            },
            publisher: {
              "@type": "Organization",
              name: "Victor Bona Blog",
              logo: {
                "@type": "ImageObject",
                url: `${baseUrl}/logo.png`,
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${baseUrl}/blog/${post.slug}`,
            },
            keywords: tags.join(", "),
            articleBody: post.content,
            wordCount: post.content.split(/\s+/).length,
            timeRequired: `PT${readingTime}M`,
          }),
        }}
      />

      <div className="flex flex-col md:flex-row md:gap-16">
        <article
          className="flex-1 max-w-2xl"
          itemScope
          itemType="https://schema.org/BlogPosting"
        >
          <ReadingProgress />

          <div className="flex flex-col gap-2">
            <h1
              className="font-semibold text-2xl tracking-tighter"
              itemProp="headline"
            >
              {post.metadata.title}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-neutral-600 dark:text-neutral-400 gap-2 sm:gap-0">
              <div className="flex items-center flex-wrap gap-3">
                <time
                  dateTime={post.metadata.publishedAt}
                  itemProp="datePublished"
                >
                  {formatDate(post.metadata.publishedAt, true)}
                </time>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">{readingTime} min read</span>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                  <PlusOneButton postSlug={post.slug} />
                  <PlusOneCount postSlug={post.slug} />
                </div>
              </div>
              <ShareButton
                url={`${baseUrl}/blog/${post.slug}`}
                title={post.metadata.title}
                slug={post.slug}
              />
            </div>
          </div>

          <div
            className="prose prose-neutral dark:prose-invert max-w-none"
            itemProp="articleBody"
          >
            <ArticleWrapper>
              <CustomMDX source={post.content} />
            </ArticleWrapper>
          </div>

          {post.metadata.tags && (
            <div className="flex flex-wrap gap-2 mt-8">
              {tags.map((tag) => (
                <Tag key={tag} name={tag} />
              ))}
            </div>
          )}

          <RelatedPosts currentSlug={post.slug} tags={tags} />
        </article>
      </div>
    </section>
  );
}
