import path from "path";
import { getMDXData } from "app/blog/utils";
import { projects, type Project } from "./projects";

export type CaseStudyMeta = {
  title: string;
  system: string;
  summary: string;
  publishedAt: string;
  role?: string;
  period?: string;
  stack?: string;
  tags: string;
};
export type CaseStudy = { slug: string; metadata: CaseStudyMeta; content: string; project: Project | undefined };

let cached: CaseStudy[] | undefined;

export function getCaseStudies(): CaseStudy[] {
  if (cached) return cached;
  const studies = getMDXData(path.join(process.cwd(), "app", "projects", "case-studies")).map((s) => {
    const metadata = s.metadata as unknown as CaseStudyMeta;
    return { slug: s.slug, metadata, content: s.content, project: projects.find((p) => p.name === metadata.system) };
  });
  if (process.env.NODE_ENV === "production") cached = studies;
  return studies;
}

// System name -> case study path, for linking rows, rings and the terminal index.
export function caseStudyHrefs(): Map<string, string> {
  return new Map(getCaseStudies().map((s) => [s.metadata.system, `/projects/${s.slug}`]));
}
