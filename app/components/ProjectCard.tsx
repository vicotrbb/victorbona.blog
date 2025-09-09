"use client";

import { Project } from "app/projects/projects";
import { GitHubIcon } from "./icons/GitHubIcon";
import { LinkIcon } from "./icons/LinkIcon";
import { useState } from "react";
import Image from "next/image";

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

function GifCarousel({ gifs }: { gifs: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!gifs.length) return null;

  return (
    <div className="relative mb-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg overflow-hidden">
      <div className="aspect-video">
        <Image
          src={gifs[currentIndex]}
          alt="Project demo"
          fill
          className="object-cover"
          unoptimized // For GIFs
        />
      </div>
      
      {gifs.length > 1 && (
        <>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {gifs.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex
                    ? "bg-white shadow-lg"
                    : "bg-white/60 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={() => setCurrentIndex(currentIndex === 0 ? gifs.length - 1 : currentIndex - 1)}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
          >
            ←
          </button>
          
          <button
            onClick={() => setCurrentIndex((currentIndex + 1) % gifs.length)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
          >
            →
          </button>
        </>
      )}
    </div>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="flex flex-col h-full border border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors p-4"
    >

      {project.gifs && project.gifs.length > 0 && (
        <GifCarousel gifs={project.gifs} />
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 className={`font-medium ${project.featured ? 'text-xl' : 'text-lg'} mb-1`}>
            {project.name}
          </h2>
          {project.startDate && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Started {formatDate(project.startDate)}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {project.repository && (
            <a
              href={project.repository}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
              title="View repository"
            >
              <GitHubIcon />
            </a>
          )}
          {project.website && (
            <a
              href={project.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
              title="Visit website"
            >
              <LinkIcon />
            </a>
          )}
        </div>
      </div>

      <p className="text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
        {project.description}
      </p>

      {project.longDescription && (
        <div className="mb-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors font-medium"
          >
            {showDetails ? 'Hide details' : 'Show details'} →
          </button>
          
          {showDetails && (
            <div className="mt-3 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
                {project.longDescription}
              </p>
              
              {project.tech && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Tech Stack</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {project.tech.frontend && (
                      <div>
                        <span className="font-medium text-neutral-600 dark:text-neutral-400">Frontend:</span>
                        <p className="text-neutral-500 dark:text-neutral-500">{project.tech.frontend.join(", ")}</p>
                      </div>
                    )}
                    {project.tech.backend && (
                      <div>
                        <span className="font-medium text-neutral-600 dark:text-neutral-400">Backend:</span>
                        <p className="text-neutral-500 dark:text-neutral-500">{project.tech.backend.join(", ")}</p>
                      </div>
                    )}
                    {project.tech.database && (
                      <div>
                        <span className="font-medium text-neutral-600 dark:text-neutral-400">Database:</span>
                        <p className="text-neutral-500 dark:text-neutral-500">{project.tech.database.join(", ")}</p>
                      </div>
                    )}
                    {project.tech.deployment && (
                      <div>
                        <span className="font-medium text-neutral-600 dark:text-neutral-400">Deployment:</span>
                        <p className="text-neutral-500 dark:text-neutral-500">{project.tech.deployment.join(", ")}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-auto">
        <div className="flex flex-wrap gap-2 mb-3">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
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
              {project.status.replace("-", " ")}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-500">
            <span>{project.license}</span>
            {!project.publiclyShared && (
              <span className="px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                Private
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
