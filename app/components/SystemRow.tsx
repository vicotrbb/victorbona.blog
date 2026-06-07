import type { Project } from "app/projects/projects";
import { MetadataLine } from "./MetadataLine";

function statusLabel(status: Project["status"]) {
  return status.replace("-", " ");
}

export function SystemRow({ project }: { project: Project }) {
  const stack = project.tags.slice(0, 4).join(" / ");

  return (
    <article className="grid gap-2 border-b border-[var(--color-border)] py-3 last:border-b-0 md:grid-cols-[10rem_1fr_auto] md:items-start md:gap-4">
      <div>
        <p className="font-semibold text-[var(--color-foreground)]">
          {project.name}
        </p>
        <MetadataLine items={[statusLabel(project.status), project.license]} />
      </div>
      <div className="min-w-0">
        <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {project.description}
        </p>
        <p className="metadata-type mt-2 text-[var(--color-muted-foreground)]">
          {stack}
        </p>
      </div>
      <div className="flex gap-3 text-sm md:justify-end">
        {project.website && (
          <a
            href={project.website}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${project.name} site`}
            className="text-[var(--color-accent)] hover:text-[var(--color-foreground)]"
          >
            Site
          </a>
        )}
        {project.repository && (
          <a
            href={project.repository}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${project.name} source`}
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            Source
          </a>
        )}
      </div>
    </article>
  );
}
