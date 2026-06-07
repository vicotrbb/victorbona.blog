import type { Project } from "app/projects/projects";
import { SystemRow } from "./SystemRow";

export function ProjectCard({ project }: { project: Project }) {
  return <SystemRow project={project} />;
}
