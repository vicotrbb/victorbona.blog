import { projects } from "app/projects/projects";
import { articles } from "app/articles/articles";
import { getBlogPosts } from "app/blog/utils";
import { getCompendiumNotes } from "app/compendium/utils";
import type { IndexEntry } from "app/lib/terminal";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function getTerminalIndex(): IndexEntry[] {
  return [
    ...getBlogPosts().map((p): IndexEntry => ({ slug: p.slug, title: p.metadata.title, href: `/blog/${p.slug}`, kind: "post" })),
    ...articles.map((a): IndexEntry => ({ slug: a.slug, title: a.title, href: `/articles/${a.slug}`, kind: "paper" })),
    // shortcut: systems have no detail route, so they open the /projects list; link an anchor once rows carry ids.
    ...projects.map((p): IndexEntry => ({ slug: slugify(p.name), title: p.name, href: "/projects", kind: "system" })),
    ...getCompendiumNotes().map((n): IndexEntry => ({
      slug: n.slug,
      title: n.title,
      href: `/compendium/${n.collection}/${n.slug}`,
      kind: "note",
    })),
  ];
}
