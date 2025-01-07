import { notFound } from "next/navigation";
import { CustomMDX } from "app/components/mdx";
import { formatDate, getBlogPosts, getReadingTime } from "app/blog/utils";
import { baseUrl } from "app/sitemap";
import { ShareButton } from "app/components/ShareButton";
import type { Metadata } from "next";
import { PlusOneButton } from "app/components/PlusOneButton";
import { PlusOneCount } from "app/components/PlusOneCount";

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
  let post = getBlogPosts().find((post) => post.slug === params.slug);

  if (!post) {
    notFound();
  }

  let readingTime = getReadingTime(post.content);

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
              : `${baseUrl}/og?${new URLSearchParams({
                  title: post.metadata.title,
                  publishedAt: post.metadata.publishedAt,
                  readingTime: readingTime.toString(),
                  summary: post.metadata.summary,
                }).toString()}`,
            url: `${baseUrl}/blog/${post.slug}`,
            author: {
              "@type": "Person",
              name: "Victor Bona",
              url: baseUrl,
              image: `${baseUrl}/avatar.jpg`,
            },
            twitter: {
              card: "summary_large_image",
              title: post.metadata.title,
              description: post.metadata.summary,
              creator: "@BonaVictor",
              images: [
                `${baseUrl}/og?${new URLSearchParams({
                  title: post.metadata.title,
                  publishedAt: post.metadata.publishedAt,
                  readingTime: readingTime.toString(),
                  summary: post.metadata.summary,
                }).toString()}`,
              ],
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
            keywords: ["software engineering", "web development", "technology"],
            timeRequired: `PT${readingTime}M`,
          }),
        }}
      />
      <h1 className="title font-semibold text-2xl tracking-tighter">
        {post.metadata.title}
      </h1>
      <div className="flex justify-between items-center mt-2 mb-8 text-sm">
        <p className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center space-x-2">
          <span>{formatDate(post.metadata.publishedAt)}</span>
          <span className="text-neutral-600 dark:text-neutral-400">•</span>
          <span>{readingTime} min read</span>
          <PlusOneCount postSlug={params.slug} />
        </p>
        <div className="flex items-center space-x-4">
          <PlusOneButton postSlug={params.slug} />
          <ShareButton
            url={`${baseUrl}/blog/${post.slug}`}
            title={post.metadata.title}
            slug={params.slug}
          />
        </div>
      </div>
      <article className="prose">
        <CustomMDX source={post.content} />
      </article>
    </section>
  );
}
