"use client";

import type { Project } from "app/projects/projects";
import { useState } from "react";
import { MetadataLine } from "./MetadataLine";

function statusLabel(status: Project["status"]) {
  return status.replace("-", " ");
}

function hasExtraDetails(project: Project) {
  return Boolean(
    project.longDescription ||
      project.tech ||
      project.gifs?.length ||
      project.images?.length
  );
}

function mediaItems(project: Project) {
  return [...(project.gifs ?? []), ...(project.images ?? [])].filter(Boolean);
}

function TechGroup({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) {
    return null;
  }

  return (
    <div>
      <p className="metadata-type text-[var(--color-accent)]">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        {items.join(" / ")}
      </p>
    </div>
  );
}

export function SystemRow({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false);
  const stack = project.tags.slice(0, 4).join(" / ");
  const canExpand = hasExtraDetails(project);
  const media = mediaItems(project);

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
      <div className="flex flex-wrap gap-3 text-sm md:justify-end">
        {canExpand && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="text-[var(--color-accent)] hover:text-[var(--color-foreground)]"
          >
            {expanded ? "Close" : "Details"}
          </button>
        )}
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
      {expanded && canExpand && (
        <div className="border-t border-[var(--color-border)] pt-3 md:col-span-3">
          {project.longDescription && (
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              {project.longDescription}
            </p>
          )}

          {project.tech && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <TechGroup label="Frontend" items={project.tech.frontend} />
              <TechGroup label="Backend" items={project.tech.backend} />
              <TechGroup label="Data" items={project.tech.database} />
              <TechGroup label="Deploy" items={project.tech.deployment} />
            </div>
          )}

          {media.length > 0 && (
            <div className="mt-4">
              <p className="metadata-type text-[var(--color-accent)]">
                Project media
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {media.map((src, index) => (
                  <figure
                    key={`${project.name}-${src}`}
                    className="border border-[var(--color-border)] bg-[var(--color-surface)] p-2"
                  >
                    <img
                      src={src}
                      alt={`${project.name} preview ${index + 1}`}
                      className="aspect-video w-full object-contain"
                      loading="lazy"
                    />
                  </figure>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
