import { BlogPosts } from "app/components/posts";
import { ArrowIcon } from "./components/ArrowIcon";
import { GitHubIcon } from "./components/icons/GitHubIcon";
import { XIcon } from "./components/icons/XIcon";
import { ArticleCard } from "./components/ArticleCard";
import { ProjectCard } from "./components/ProjectCard";
import { articles } from "./articles/articles";
import { projects } from "./projects/projects";

export default function Page() {
  const recentArticles = articles.slice(0, 3);
  const recentProjects = projects.slice(0, 3);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-8 md:py-12 animate-fade-in-up">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-neutral-900 dark:text-neutral-100">
          Victor Bona
        </h1>
        <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto leading-relaxed">
          Full-stack engineer sharing insights on software architecture, 
          emerging technologies, and engineering best practices.
        </p>
        
        <div className="flex justify-center gap-6 mb-8">
          <a
            href="https://github.com/vicotrbb"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-all duration-300 hover:scale-105"
          >
            <GitHubIcon />
            <span className="text-sm">GitHub</span>
          </a>
          <a
            href="https://twitter.com/BonaVictor"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-all duration-300 hover:scale-105"
          >
            <XIcon />
            <span className="text-sm">X (Twitter)</span>
          </a>
        </div>
      </section>

      {/* Recent Posts Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Recent Posts
          </h2>
          <a
            href="/blog"
            className="flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
          >
            View all
            <ArrowIcon />
          </a>
        </div>
        <BlogPosts limit={4} />
      </section>

      {/* Recent Articles Section */}
      {recentArticles.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Recent Articles
            </h2>
            <a
              href="/articles"
              className="flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
            >
              View all
              <ArrowIcon />
            </a>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recentArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Projects Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Recent Projects
          </h2>
          <a
            href="/projects"
            className="flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
          >
            View all
            <ArrowIcon />
          </a>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentProjects.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      </section>
    </div>
  );
}
