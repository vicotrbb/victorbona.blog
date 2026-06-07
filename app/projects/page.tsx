import { SectionHeader } from "app/components/SectionHeader";
import { SystemRow } from "app/components/SystemRow";
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
    <section className="space-y-5">
      <div className="grid gap-3 border-b border-[var(--color-rule)] pb-4 md:grid-cols-[12rem_1fr]">
        <p className="metadata-type text-[var(--color-accent)]">
          Shipped systems
        </p>
        <div>
          <h1 className="display-type text-2xl font-semibold text-[var(--color-foreground)]">
            Systems, tools, and infrastructure
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            Software that moved past the idea stage: platforms, security tools,
            infrastructure, developer products, and experiments with enough
            shape to judge.
          </p>
        </div>
      </div>
      <SectionHeader index="SYSTEMS" title="Project archive" />
      <div className="border border-[var(--color-border)] px-3">
        {projects.map((project) => (
          <SystemRow key={project.name} project={project} />
        ))}
      </div>
    </section>
  );
}
