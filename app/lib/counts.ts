import { projects } from "app/projects/projects";
import { articles } from "app/articles/articles";
import { getBlogPosts } from "app/blog/utils";
import { compendiumCollections } from "app/compendium/collections";
import { getCompendiumNotes } from "app/compendium/utils";

export function getSiteCounts() {
  return {
    systems: projects.length,
    papers: articles.length,
    writing: getBlogPosts().length,
    compendium: compendiumCollections.flatMap((c) => getCompendiumNotes(c.id)).length,
  };
}
