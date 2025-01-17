import { ProjectCard } from "app/components/ProjectCard";
import { projects } from "./projects";
import { baseUrl } from "app/sitemap";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "Explore my software projects and open source contributions.",
  openGraph: {
    title: "Projects - Victor Bona",
    description: "Explore my software projects and open source contributions.",
    url: `${baseUrl}/projects`,
  },
};

export default function ProjectsPage() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">
        My Projects
      </h1>
      <p className="mb-8 text-neutral-600 dark:text-neutral-400">
        Here are some of the projects I've worked on. Most of them are open
        source and available on GitHub.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>
    </section>
  );
}
