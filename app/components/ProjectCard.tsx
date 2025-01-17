import { Project } from "app/projects/projects";
import { GitHubIcon } from "./icons/GitHubIcon";
import { LinkIcon } from "./icons/LinkIcon";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="flex flex-col p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-lg">{project.name}</h2>
        <div className="flex items-center space-x-3">
          {project.website && (
            <a
              href={project.repository}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              <GitHubIcon />
            </a>
          )}
          {project.website && (
            <a
              href={project.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              <LinkIcon />
            </a>
          )}
        </div>
      </div>

      <p className="text-neutral-600 dark:text-neutral-400 mb-4">
        {project.description}
      </p>

      <div className="mt-auto">
        <div className="flex flex-wrap gap-2 mb-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center">
          <span
            className={`inline-block w-2 h-2 rounded-full mr-2 ${
              project.status === "completed"
                ? "bg-green-500"
                : project.status === "in-progress"
                ? "bg-yellow-500"
                : project.status === "maintained"
                ? "bg-blue-500"
                : project.status === "stopped"
                ? "bg-red-500"
                : "bg-gray-500"
            }`}
          />
          <span className="text-sm text-neutral-600 dark:text-neutral-400 capitalize">
            {project.status}
          </span>
        </div>
      </div>
    </div>
  );
}
