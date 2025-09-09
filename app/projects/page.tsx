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
  const activeProjects = projects.filter(project => 
    project.status === 'maintained' || project.status === 'in-progress'
  ).length;

  return (
    <section className="space-y-12">
      <div>
        <h1 className="font-semibold text-3xl mb-4 tracking-tighter text-neutral-900 dark:text-neutral-100">
          Projects
        </h1>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed">
          A collection of software projects, from open source contributions to personal experiments. 
          Currently maintaining {activeProjects} active projects.
        </p>
        
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-neutral-600 dark:text-neutral-400">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-neutral-600 dark:text-neutral-400">Maintained</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>
            <span className="text-neutral-600 dark:text-neutral-400">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-neutral-600 dark:text-neutral-400">Stopped</span>
          </div>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
