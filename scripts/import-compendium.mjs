import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const vaultRoot = "/Users/victorbona/Documents/Obsidian Vault";
const outputRoot = path.join(root, "app", "compendium", "content");

const collections = [
  {
    id: "software-engineering",
    title: "Software Engineering",
    sourceDir: path.join(
      vaultRoot,
      "Knowledge base",
      "Software Engineering"
    ),
  },
  {
    id: "data-structures",
    title: "Data Structures",
    sourceDir: path.join(vaultRoot, "Knowledge base", "Data Structures"),
  },
  {
    id: "design-patterns",
    title: "Design Patterns",
    sourceDir: path.join(vaultRoot, "Knowledge base", "Design Patterns"),
  },
];

function slugify(value) {
  return value
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/^\d+\s+/, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function headingSlug(value) {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

function readMarkdownFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(dir, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

function stripNumericPrefix(value) {
  return value.replace(/^\d+\s+/, "").trim();
}

function noteTitleFromFile(filePath) {
  const basename = path.basename(filePath, ".md");
  return stripNumericPrefix(basename);
}

function noteOrderFromFile(filePath, fallback) {
  const match = path.basename(filePath).match(/^(\d+)/);
  return match ? Number(match[1]) : fallback;
}

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function escapeYaml(value) {
  return JSON.stringify(value);
}

function publicSourcePath(sourcePath) {
  if (!path.isAbsolute(sourcePath)) return sourcePath;
  return path.relative(vaultRoot, sourcePath).split(path.sep).join("/");
}

function frontmatterFor(note) {
  return [
    "---",
    `title: ${escapeYaml(note.title)}`,
    `collection: ${escapeYaml(note.collection)}`,
    `sourcePath: ${escapeYaml(publicSourcePath(note.sourcePath))}`,
    `order: ${note.order}`,
    "---",
    "",
  ].join("\n");
}

function compactReferenceLabel(target, label) {
  return label && label.trim() ? label.trim() : target.trim();
}
