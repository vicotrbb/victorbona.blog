import { BlogPosts } from "app/components/posts";
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
    <section className="space-y-8">
      <div>
        <h1 className="font-semibold text-3xl mb-4 tracking-tighter text-neutral-900 dark:text-neutral-100">
          Blog Posts
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed">
          Thoughts on software engineering, architecture, and modern web development. 
          Exploring ideas from theory to practice.
        </p>
      </div>
      <BlogPosts />
    </section>
  );
}
