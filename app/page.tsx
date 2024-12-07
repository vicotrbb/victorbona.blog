import { BlogPosts } from "app/components/posts";
import { ArrowIcon } from "./components/ArrowIcon";

export default function Page() {
  return (
    <section>
      <h1 className="mb-8 text-2xl font-semibold tracking-tighter">My Blog</h1>
      <p className="mb-4">
        {`Welcome to my tech corner where I share insights about software engineering,
        emerging technologies, software design and architecture, and software best practices. 
        Through my articles, I explore various aspects of modern software development, 
        from architectural patterns to practical coding solutions. Join me as I
        document my journey and discoveries in the ever-evolving world of
        technology.`}
      </p>
      <div className="my-8">
        <BlogPosts limit={5} />
        <a
          href="/blog"
          className="flex w-fit items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
        >
          <ArrowIcon />
          <p className="ml-2 h-7">View All Posts</p>
        </a>
      </div>
    </section>
  );
}
