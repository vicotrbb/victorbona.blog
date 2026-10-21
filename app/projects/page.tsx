import { SystemRow } from "app/components/SystemRow";
import { projects } from "./projects";
import { baseUrl } from "app/sitemap";
import type { Metadata } from "next";
import {
  getBreadcrumbJsonLd,
  getItemListJsonLd,
  getProjectJsonLd,
  ogImage,
  withDefaultOpenGraphImage,
  withDefaultTwitterImage,
} from "app/lib/seo";

export const metadata: Metadata = {
  title: "Projects",
  description: "Explore my software projects and open source contributions.",
  alternates: {
    canonical: `${baseUrl}/projects`,
  },
  openGraph: withDefaultOpenGraphImage({
    title: "Projects - Victor Bona",
    description: "Explore my software projects and open source contributions.",
    url: `${baseUrl}/projects`,
    images: [ogImage("Systems", "P400 Systems")],
  }),
  twitter: withDefaultTwitterImage({
    card: "summary_large_image",
    title: "Projects - Victor Bona",
    description: "Explore my software projects and open source contributions.",
    images: [ogImage("Systems", "P400 Systems")],
  }),
};

export default function ProjectsPage() {
  const jsonLd = [
    getBreadcrumbJsonLd([
      { name: "Home", item: baseUrl },
      { name: "Projects", item: `${baseUrl}/projects` },
    ]),
    getItemListJsonLd(
      "Victor Bona Projects",
      projects.map((project) => ({
        name: project.name,
        url: project.website || project.repository || `${baseUrl}/projects`,
        description: project.description,
        item: getProjectJsonLd(project),
      }))
    ),
  ];

  return (
    <section className="w-full">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <header className="border-b border-[var(--line)] pb-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h1 className="flex items-baseline gap-4 text-[clamp(2rem,4vw,3rem)] font-semibold leading-none tracking-[-0.03em] text-[var(--text)]">
            <span className="font-mono text-sm font-normal tracking-normal text-[var(--dim)]">P400</span>
            Systems
          </h1>
          <p className="font-mono text-sm tabular-nums text-[var(--dim)]">
            <span className="text-[var(--text)]">{projects.length}</span> systems
          </p>
        </div>
        <p className="mt-4 max-w-[60ch] text-[var(--dim)]">
          Software that moved past the idea stage: platforms, security tools,
          infrastructure, developer products, and experiments with enough
          shape to judge.
        </p>
      </header>
      <h2 className="mb-2 mt-10 font-mono text-sm text-[var(--dim)]">
        <span aria-hidden="true">$ </span>get systems -o wide
      </h2>
      <ul className="border-b border-[var(--line)]">
        {projects.map((project) => (
          <SystemRow key={project.name} project={project} />
        ))}
      </ul>
    </section>
  );
}
