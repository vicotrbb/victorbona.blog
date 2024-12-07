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
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">My Blog</h1>
      <BlogPosts />
    </section>
  );
}
