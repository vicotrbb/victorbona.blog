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

function stripMarkdownExtension(value) {
  return value.replace(/\.md$/i, "").trim();
}

function indexKey(value) {
  return stripMarkdownExtension(value).toLowerCase();
}

function pushIndexEntry(map, key, note) {
  const normalized = indexKey(key);
  if (!normalized) return;
  if (!map.has(normalized)) map.set(normalized, []);
  map.get(normalized).push(note);
}

function uniqueNotes(notes) {
  return [...new Set(notes)];
}

function buildImportedNoteIndex() {
  const notes = [];
  const byTitle = new Map();
  const byPathSuffix = new Map();
  const byRoute = new Map();

  for (const collection of collections) {
    readMarkdownFiles(collection.sourceDir).forEach((filePath, index) => {
      const sourcePath = publicSourcePath(filePath);
      const title = noteTitleFromFile(filePath);
      const slug = slugify(title);
      const note = {
        title,
        slug,
        collection: collection.id,
        collectionTitle: collection.title,
        sourceFile: filePath,
        sourcePath,
        outputFile: path.join(outputRoot, collection.id, `${slug}.md`),
        order: noteOrderFromFile(filePath, index + 1),
      };

      notes.push(note);
      pushIndexEntry(byTitle, title, note);

      const suffixes = [
        title,
        path.basename(filePath, ".md"),
        path.posix.join(collection.title, title),
        path.posix.join(collection.title, path.basename(filePath, ".md")),
        path.posix.join("Knowledge base", collection.title, title),
        path.posix.join(
          "Knowledge base",
          collection.title,
          path.basename(filePath, ".md")
        ),
        sourcePath.replace(/\.md$/i, ""),
      ];

      suffixes.forEach((suffix) => pushIndexEntry(byPathSuffix, suffix, note));

      const routeKey = `${note.collection}/${note.slug}`;
      if (!byRoute.has(routeKey)) byRoute.set(routeKey, []);
      byRoute.get(routeKey).push(note);
    });
  }

  const duplicateRoutes = [...byRoute.entries()].filter(
    ([, matchingNotes]) => matchingNotes.length > 1
  );

  if (duplicateRoutes.length > 0) {
    const details = duplicateRoutes
      .map(([route, matchingNotes]) => {
        const paths = matchingNotes.map((note) => note.sourcePath).join(", ");
        return `${route}: ${paths}`;
      })
      .join("\n");
    throw new Error(`Duplicate Compendium routes detected:\n${details}`);
  }

  return { notes, byTitle, byPathSuffix };
}

function findImportedNote(rawTarget, index) {
  const target = stripMarkdownExtension(rawTarget);
  const key = indexKey(target);
  if (!key) return undefined;

  const directTitleMatches = index.byTitle.get(key) || [];
  const pathSuffixMatches = index.byPathSuffix.get(key) || [];
  const sourceSuffixMatches = index.notes.filter((note) =>
    stripMarkdownExtension(note.sourcePath).toLowerCase().endsWith(`/${key}`)
  );
  const matches = uniqueNotes([
    ...directTitleMatches,
    ...pathSuffixMatches,
    ...sourceSuffixMatches,
  ]);

  if (matches.length > 1) {
    const paths = matches.map((note) => note.sourcePath).join(", ");
    throw new Error(`Ambiguous wikilink target "${rawTarget}": ${paths}`);
  }

  return matches[0];
}

function splitWikilink(rawLink) {
  const aliasSeparator = rawLink.indexOf("|");
  const targetPart =
    aliasSeparator === -1 ? rawLink : rawLink.slice(0, aliasSeparator);
  const labelPart =
    aliasSeparator === -1 ? undefined : rawLink.slice(aliasSeparator + 1);
  const headingSeparator = targetPart.indexOf("#");
  const target =
    headingSeparator === -1
      ? targetPart.trim()
      : targetPart.slice(0, headingSeparator).trim();
  const heading =
    headingSeparator === -1 ? "" : targetPart.slice(headingSeparator + 1).trim();

  return {
    target,
    heading,
    targetWithHeading: targetPart.trim(),
    label: compactReferenceLabel(targetPart.trim(), labelPart),
  };
}

function escapeMarkdownLinkLabel(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}

function escapeMdxText(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/{/g, "&#123;")
    .replace(/}/g, "&#125;");
}

function externalReferenceSpan(label) {
  return `<span className="compendium-external-reference" title="Vault-only reference">${escapeMdxText(
    label
  )}</span>`;
}

function rewriteWikilinks(content, currentNote, index, report) {
  return content.replace(/\[\[([^\]]+)\]\]/g, (fullMatch, rawLink) => {
    const parsed = splitWikilink(rawLink);

    if (!parsed.target && !parsed.heading) {
      report.unresolvedReferences.push({
        from: currentNote.sourcePath,
        target: rawLink.trim(),
        reason: "empty-target",
      });
      return externalReferenceSpan(parsed.label || rawLink.trim());
    }

    if (!parsed.target && parsed.heading) {
      const href = `#${headingSlug(parsed.heading)}`;
      report.convertedLinks.push({
        from: currentNote.sourcePath,
        to: currentNote.sourcePath,
        href,
        label: parsed.label,
      });
      return `[${escapeMarkdownLinkLabel(parsed.label)}](${href})`;
    }

    const importedTarget = findImportedNote(parsed.target, index);

    if (importedTarget) {
      const hash = parsed.heading ? `#${headingSlug(parsed.heading)}` : "";
      const href = `/compendium/${importedTarget.collection}/${importedTarget.slug}${hash}`;
      report.convertedLinks.push({
        from: currentNote.sourcePath,
        to: importedTarget.sourcePath,
        href,
        label: parsed.label,
      });
      return `[${escapeMarkdownLinkLabel(parsed.label)}](${href})`;
    }

    report.externalReferences.push({
      from: currentNote.sourcePath,
      target: parsed.targetWithHeading,
      label: parsed.label,
    });

    return externalReferenceSpan(parsed.label);
  });
}

function transformOutsideFences(content, transform) {
  const lines = content.split(/(\r?\n)/);
  let inFence = false;
  let fenceMarker = "";

  return lines
    .map((segment) => {
      if (segment === "\n" || segment === "\r\n") return segment;

      const fenceMatch = segment.match(/^(\s*)(`{3,}|~{3,})/);
      if (fenceMatch) {
        const marker = fenceMatch[2][0];
        if (!inFence) {
          inFence = true;
          fenceMarker = marker;
        } else if (marker === fenceMarker) {
          inFence = false;
          fenceMarker = "";
        }
        return segment;
      }

      return inFence ? segment : transform(segment);
    })
    .join("");
}

function findRemainingWikilinksOutsideFences(content) {
  const matches = [];

  transformOutsideFences(content, (segment) => {
    for (const match of segment.matchAll(/\[\[([^\]]+)\]\]/g)) {
      matches.push(match[1].trim());
    }

    return segment;
  });

  return matches;
}

function escapeMdxComparisons(segment) {
  const spans = [];
  const protectedSegment = segment.replace(
    /<span className="compendium-external-reference" title="Vault-only reference">.*?<\/span>/g,
    (span) => {
      const placeholder = `@@COMPENDIUM_EXTERNAL_REFERENCE_${spans.length}@@`;
      spans.push(span);
      return placeholder;
    }
  );

  return protectedSegment
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/@@COMPENDIUM_EXTERNAL_REFERENCE_(\d+)@@/g, (_match, index) =>
      spans[Number(index)]
    );
}

function countMatches(content, pattern) {
  return (content.match(pattern) || []).length;
}

function importCompendium() {
  const index = buildImportedNoteIndex();
  const report = {
    source: "selected Obsidian knowledge-base folders",
    outputRoot: path.relative(root, outputRoot),
    collections: [],
    copiedNotes: [],
    convertedLinks: [],
    externalReferences: [],
    unresolvedReferences: [],
    mermaidBlocks: 0,
  };

  ensureCleanDir(outputRoot);

  for (const collection of collections) {
    fs.mkdirSync(path.join(outputRoot, collection.id), { recursive: true });
    const notes = index.notes
      .filter((note) => note.collection === collection.id)
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

    report.collections.push({
      id: collection.id,
      title: collection.title,
      noteCount: notes.length,
    });

    for (const note of notes) {
      const original = fs.readFileSync(note.sourceFile, "utf8");
      const linked = transformOutsideFences(original, (segment) =>
        rewriteWikilinks(segment, note, index, report)
      );
      const body = transformOutsideFences(linked, escapeMdxComparisons);
      const remainingWikilinks = findRemainingWikilinksOutsideFences(body);
      if (remainingWikilinks.length > 0) {
        remainingWikilinks.forEach((target) => {
          report.unresolvedReferences.push({
            from: note.sourcePath,
            target,
            reason: "unrewritten-wikilink",
          });
        });
        throw new Error(
          `Unresolved wikilinks remain outside fenced code in ${note.sourcePath}: ${remainingWikilinks.join(
            ", "
          )}`
        );
      }

      const mermaidBlocks = countMatches(body, /```mermaid/g);
      report.mermaidBlocks += mermaidBlocks;
      const content = `${frontmatterFor(note)}${body}${
        body.endsWith("\n") ? "" : "\n"
      }`;

      fs.writeFileSync(note.outputFile, content);

      report.copiedNotes.push({
        title: note.title,
        collection: note.collection,
        slug: note.slug,
        sourcePath: note.sourcePath,
        outputPath: path.relative(root, note.outputFile),
        order: note.order,
        mermaidBlocks,
      });
    }
  }

  fs.writeFileSync(
    path.join(outputRoot, "import-report.json"),
    `${JSON.stringify(report, null, 2)}\n`
  );

  console.log(
    `Imported ${report.copiedNotes.length} Compendium notes with ${report.mermaidBlocks} Mermaid blocks.`
  );
  console.log(`Converted links: ${report.convertedLinks.length}`);
  console.log(`External references: ${report.externalReferences.length}`);
  console.log(
    `Unresolved references: ${report.unresolvedReferences.length}`
  );
  console.log(
    `Report: ${path.relative(root, path.join(outputRoot, "import-report.json"))}`
  );
}

importCompendium();
