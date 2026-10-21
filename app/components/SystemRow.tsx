"use client";

import type { Project } from "app/projects/projects";
import { useId, useState } from "react";
import { toStroke } from "app/lib/status";
import { StatusStroke, type Status } from "./StatusStroke";

const statusText: Record<Status, string> = {
  live: "text-[var(--lit)]",
  maintained: "text-[var(--text)]",
  archived: "text-[var(--dim)]",
};

const textLink =
  "text-[var(--text)] decoration-1 underline-offset-4 transition-colors duration-150 hover:underline";

function MonoTags({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className="border border-[var(--line)] px-1.5 py-0.5 font-mono text-xs text-[var(--dim)]">
          {item}
        </li>
      ))}
    </ul>
  );
}

function TechGroup({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;

  return (
    <div>
      <p className="mb-2 font-mono text-xs text-[var(--dim)]">{label}</p>
      <MonoTags items={items} />
    </div>
  );
}

export function SystemRow({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const status = toStroke(project.status);
  const media = [...(project.gifs ?? []), ...(project.images ?? [])].filter(Boolean);
  const canExpand = Boolean(project.longDescription || project.tech || media.length);

  return (
    <li className="border-t border-[var(--line)] py-6">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:gap-x-8">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-snug tracking-[-0.01em] text-[var(--text)]">
            {project.name}
          </h2>
          <p className="mt-2 max-w-[68ch] text-[var(--dim)]">{project.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs sm:text-sm md:flex-col md:items-end md:gap-y-3">
          <span className="flex items-center gap-2">
            <span className="w-6 shrink-0">
              <StatusStroke status={status} />
            </span>
            <span className={statusText[status]}>{status}</span>
          </span>
          <span className="flex flex-wrap gap-x-4 gap-y-1 md:justify-end">
            {project.website && (
              <a href={project.website} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${project.name} site`} className={textLink}>
                site
              </a>
            )}
            {project.repository && (
              <a href={project.repository} target="_blank" rel="noopener noreferrer" aria-label={`View ${project.name} source`} className={textLink}>
                source
              </a>
            )}
            {canExpand && (
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={detailsId}
                onClick={() => setExpanded((value) => !value)}
                className="text-[var(--dim)] transition-colors duration-150 hover:text-[var(--text)]"
              >
                {expanded ? "- details" : "+ details"}
              </button>
            )}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <MonoTags items={project.tags} />
        <span className="font-mono text-xs text-[var(--dim)]">{project.license}</span>
      </div>

      {canExpand && (
        <div id={detailsId} hidden={!expanded} className="mt-6 border-t border-dashed border-[var(--line)] pt-6">
          {project.longDescription && (
            <p className="max-w-[68ch] leading-relaxed text-[var(--text)]">{project.longDescription}</p>
          )}

          {project.tech && (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <TechGroup label="frontend" items={project.tech.frontend} />
              <TechGroup label="backend" items={project.tech.backend} />
              <TechGroup label="data" items={project.tech.database} />
              <TechGroup label="deploy" items={project.tech.deployment} />
            </div>
          )}

          {media.length > 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {media.map((src, index) => (
                <figure key={src} className="border border-[var(--line)] bg-[var(--panel)] p-1">
                  <img
                    src={src}
                    alt={`${project.name} preview ${index + 1}`}
                    className="aspect-video w-full object-contain"
                    loading="lazy"
                  />
                </figure>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
