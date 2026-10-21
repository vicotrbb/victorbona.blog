import { projects } from "app/projects/projects";
import { caseStudyHrefs } from "app/projects/case-studies";
import { articles } from "app/articles/articles";
import { getBlogPosts } from "app/blog/utils";
import { getCompendiumNotes } from "app/compendium/utils";
import type { IndexEntry } from "app/lib/terminal";

// Search text stays short so the lazily fetched index stays small.
const clip = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(" ").slice(0, 280);
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function getTerminalIndex(): IndexEntry[] {
  const studies = caseStudyHrefs();
  return [
    ...getBlogPosts().map((p): IndexEntry => ({ slug: p.slug, title: p.metadata.title, href: `/blog/${p.slug}`, kind: "post", text: clip(p.metadata.tags, p.metadata.summary) })),
    ...articles.map((a): IndexEntry => ({ slug: a.slug, title: a.title, href: `/articles/${a.slug}`, kind: "paper", text: clip(a.tags.join(" "), a.abstract) })),
    // Systems without a case study open the /projects list.
    ...projects.map((p): IndexEntry => ({ slug: slugify(p.name), title: p.name, href: studies.get(p.name) ?? "/projects", kind: "system", text: clip(p.tags.join(" "), p.description) })),
    ...getCompendiumNotes().map((n): IndexEntry => ({
      slug: n.slug,
      title: n.title,
      href: `/compendium/${n.collection}/${n.slug}`,
      kind: "note",
      text: clip(n.collection, n.excerpt),
    })),
  ];
}
