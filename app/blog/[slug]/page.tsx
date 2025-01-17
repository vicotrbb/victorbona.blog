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

  return {
    title: post.metadata.title,
    description: post.metadata.summary,
    authors: [{ name: "Victor Bona", url: baseUrl }],
    openGraph: {
      title: post.metadata.title,
      description: post.metadata.summary,
      type: "article",
      url: `${baseUrl}/blog/${post.slug}`,
      publishedTime: post.metadata.publishedAt,
      authors: ["Victor Bona"],
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
    },
    twitter: {
      card: "summary_large_image",
      title: post.metadata.title,
      description: post.metadata.summary,
      creator: "@BonaVictor",
      images: [post.metadata.image || `${baseUrl}/og?${ogImageUrl}`],
    },
  };
}

export default function Blog({ params }) {
  const post = getBlogPosts().find((post) => post.slug === params.slug);

  if (!post) {
    notFound();
  }

  const readingTime = getReadingTime(post.content);

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
            },
          }),
        }}
      />

      <div className="flex flex-col md:flex-row md:gap-16">
        <article className="flex-1 max-w-2xl">
          <div className="flex flex-col gap-2">
            <h1 className="font-semibold text-2xl tracking-tighter">
              {post.metadata.title}
            </h1>
            <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center gap-3">
                <time dateTime={post.metadata.publishedAt}>
                  {formatDate(post.metadata.publishedAt, true)}
                </time>
                <span>•</span>
                <span>{readingTime} min read</span>
                <span>•</span>
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

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <ArticleWrapper>
              <CustomMDX source={post.content} />
            </ArticleWrapper>
          </div>

          {post.metadata.tags && (
            <div className="flex flex-wrap gap-2 mt-8">
              {post.metadata.tags.split(",").map((tag) => (
                <Tag key={tag} name={tag} />
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
