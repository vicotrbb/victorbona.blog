import fs from "fs";
import path from "path";
import { compendiumCollections, isCompendiumCollectionId } from "./collections";
import type {
  CompendiumCollectionId,
  CompendiumFrontmatter,
  CompendiumNote,
  CompendiumTocItem,
} from "./types";

const contentRoot = path.join(process.cwd(), "app", "compendium", "content");
const wordsPerMinute = 200;

function parseYamlValue(value: string) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return JSON.parse(trimmed);
  }

  return trimmed;
}

function parseFrontmatter(fileContent: string) {
  const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);

  if (!match) {
    throw new Error("Compendium note is missing frontmatter");
  }

  const metadata: Partial<CompendiumFrontmatter> = {};

  for (const line of match[1].trim().split("\n")) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = parseYamlValue(line.slice(separatorIndex + 1));

    if (key === "title") {
      metadata.title = String(value);
    }

    if (key === "collection") {
      const collection = String(value);
      if (!isCompendiumCollectionId(collection)) {
        throw new Error(`Unknown Compendium collection "${collection}"`);
      }
      metadata.collection = collection;
    }

    if (key === "sourcePath") {
      metadata.sourcePath = String(value);
    }

    if (key === "order") {
      metadata.order = Number(value);
    }
  }

  if (
    !metadata.title ||
    !metadata.collection ||
    !metadata.sourcePath ||
    typeof metadata.order !== "number" ||
    Number.isNaN(metadata.order)
  ) {
    throw new Error("Compendium note has invalid frontmatter");
  }

  return {
    metadata: metadata as CompendiumFrontmatter,
    content: fileContent.replace(frontmatterRegex, "").trim(),
  };
}

function slugFromFilename(file: string) {
  return path.basename(file, path.extname(file));
}

function getMarkdownFiles(collection: CompendiumCollectionId) {
  const dir = path.join(contentRoot, collection);

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));
}

function slugifyHeading(value: string) {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripMarkdown(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_>|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getWordCount(content: string) {
  const text = stripMarkdown(content);
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function getExcerpt(content: string) {
  const text = stripMarkdown(content);
  if (text.length <= 220) return text;

  const clipped = text.slice(0, 220).trim();
  return `${clipped.replace(/\s+\S*$/, "")}...`;
}

function getUniqueHeadingId(heading: string, counts: Map<string, number>) {
  const baseId = slugifyHeading(heading);
  const count = counts.get(baseId) ?? 0;
  counts.set(baseId, count + 1);

  return count === 0 ? baseId : `${baseId}-${count}`;
}

export function getReadingTime(content: string) {
  return Math.max(1, Math.ceil(getWordCount(content) / wordsPerMinute));
}

export function getTableOfContents(content: string): CompendiumTocItem[] {
  const counts = new Map<string, number>();
  const toc: CompendiumTocItem[] = [];
  let inCodeFence = false;

  for (const line of content.split("\n")) {
    if (line.trim().startsWith("```")) {
      inCodeFence = !inCodeFence;
      continue;
    }

    if (inCodeFence) continue;

    const match = /^(#{2,3})\s+(.+)$/.exec(line);
    if (!match) continue;

    const text = match[2].replace(/#+$/, "").replace(/[`*_]/g, "").trim();
    if (!text) continue;

    toc.push({
      id: getUniqueHeadingId(text, counts),
      text,
      level: match[1].length as 2 | 3,
    });
  }

  return toc;
}

export function getOutgoingCompendiumLinks(content: string) {
  const links = new Set<string>();
  const linkRegex = /\]\((\/compendium\/[^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  let match = linkRegex.exec(content);

  while (match) {
    links.add(match[1].split("#")[0]);
    match = linkRegex.exec(content);
  }

  return Array.from(links).sort((a, b) => a.localeCompare(b));
}

export function readCompendiumNote(
  collection: CompendiumCollectionId,
  file: string
): CompendiumNote {
  const filePath = path.join(contentRoot, collection, file);
  const { metadata, content } = parseFrontmatter(
    fs.readFileSync(filePath, "utf8")
  );
  const wordCount = getWordCount(content);

  return {
    title: metadata.title,
    slug: slugFromFilename(file),
    collection: metadata.collection,
    sourcePath: metadata.sourcePath,
    order: metadata.order,
    content,
    excerpt: getExcerpt(content),
    readingTime: Math.max(1, Math.ceil(wordCount / wordsPerMinute)),
    wordCount,
    diagramCount: (content.match(/```mermaid\b/g) || []).length,
    outgoingLinks: getOutgoingCompendiumLinks(content),
    toc: getTableOfContents(content),
  };
}

export function getCompendiumNotes(collection?: CompendiumCollectionId) {
  const ids = collection
    ? [collection]
    : compendiumCollections.map((item) => item.id);

  return ids
    .flatMap((id) =>
      getMarkdownFiles(id).map((file) => readCompendiumNote(id, file))
    )
    .sort((a, b) => {
      if (a.collection !== b.collection) {
        return a.collection.localeCompare(b.collection);
      }

      return a.order - b.order || a.title.localeCompare(b.title);
    });
}

export function getCompendiumNote(collection: string, slug: string) {
  const knownCollection = compendiumCollections.find(
    (item) => item.id === collection
  );
  if (!knownCollection) return undefined;

  return getCompendiumNotes(knownCollection.id).find(
    (note) => note.slug === slug
  );
}

export function getRelatedCompendiumNotes(note: CompendiumNote) {
  const allNotes = getCompendiumNotes();
  const noteUrl = `/compendium/${note.collection}/${note.slug}`;

  return allNotes
    .filter(
      (candidate) =>
        candidate.slug !== note.slug || candidate.collection !== note.collection
    )
    .filter((candidate) => {
      const candidateUrl = `/compendium/${candidate.collection}/${candidate.slug}`;
      return (
        note.outgoingLinks.includes(candidateUrl) ||
        candidate.outgoingLinks.includes(noteUrl)
      );
    })
    .slice(0, 8);
}

export function getAdjacentCompendiumNotes(note: CompendiumNote) {
  const notes = getCompendiumNotes(note.collection);
  const index = notes.findIndex((item) => item.slug === note.slug);

  return {
    previous: index > 0 ? notes[index - 1] : undefined,
    next: index >= 0 && index < notes.length - 1 ? notes[index + 1] : undefined,
  };
}

export function getCompendiumImportReport() {
  const reportPath = path.join(contentRoot, "import-report.json");
  return JSON.parse(fs.readFileSync(reportPath, "utf8"));
}
