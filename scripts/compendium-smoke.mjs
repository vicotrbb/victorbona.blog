import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentRoot = path.join(root, "app", "compendium", "content");
const emDash = "\u2014";

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function listFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return listFiles(entryPath);
      }

      return entry.isFile() ? [entryPath] : [];
    });
}

function assertIncludes(file, expected) {
  assert(
    read(file).includes(expected),
    `${file} should include ${JSON.stringify(expected)}`
  );
}

function assertNotIncludes(file, unexpected) {
  assert(
    !read(file).includes(unexpected),
    `${file} should not include ${JSON.stringify(unexpected)}`
  );
}

function readReport() {
  return JSON.parse(
    fs.readFileSync(path.join(contentRoot, "import-report.json"), "utf8")
  );
}

assertIncludes("scripts/import-compendium.mjs", 'id: "kubernetes"');
assertIncludes(
  "scripts/import-compendium.mjs",
  'id: "linux-systems-engineering"'
);
assertIncludes(
  "scripts/import-compendium.mjs",
  'id: "nodejs-v8-runtime-engineering"'
);
assertIncludes("app/compendium/types.ts", '"kubernetes"');
assertIncludes("app/compendium/types.ts", '"linux-systems-engineering"');
assertIncludes("app/compendium/types.ts", '"nodejs-v8-runtime-engineering"');
assertIncludes("app/compendium/collections.ts", 'id: "kubernetes"');
assertIncludes(
  "app/compendium/collections.ts",
  'id: "linux-systems-engineering"'
);
assertIncludes(
  "app/compendium/collections.ts",
  'id: "nodejs-v8-runtime-engineering"'
);
assertIncludes("app/compendium/page.tsx", "Kubernetes");
assertIncludes("app/compendium/page.tsx", "Linux systems engineering");
assertIncludes("app/compendium/page.tsx", "Node.js V8 runtime");
assertIncludes("app/global.css", "color-scheme: light;");
assertIncludes("app/global.css", ".compendium-mermaid svg text");
assertIncludes("app/global.css", ".compendium-mermaid svg foreignObject");
assertIncludes("app/global.css", "fill: #111827 !important;");
assertIncludes("app/global.css", "color: #111827 !important;");
assertIncludes("app/compendium/components/MermaidDiagram.tsx", "darkMode: false");
assertIncludes("app/compendium/components/MermaidDiagram.tsx", "textColor: \"#111827\"");
assertIncludes(
  "app/compendium/components/MermaidDiagram.tsx",
  "edgeLabelBackground: \"#f8fafc\""
);
assertIncludes(
  "app/compendium/[collection]/page.tsx",
  'collectionId === "kubernetes"'
);
assertIncludes(
  "app/compendium/[collection]/page.tsx",
  'getCompendiumNote("kubernetes", "kubernetes")'
);
assertIncludes(
  "app/compendium/[collection]/page.tsx",
  'collectionId === "linux-systems-engineering"'
);
assertIncludes(
  "app/compendium/[collection]/page.tsx",
  'getCompendiumNote(\n      "linux-systems-engineering",\n      "linux-systems-engineering"\n    )'
);
assertIncludes(
  "app/compendium/[collection]/page.tsx",
  'collectionId === "nodejs-v8-runtime-engineering"'
);
assertIncludes(
  "app/compendium/[collection]/page.tsx",
  'getCompendiumNote(\n      "nodejs-v8-runtime-engineering",\n      "node-js-v8-runtime-engineering"\n    )'
);

const report = readReport();
const kubernetesCollection = report.collections.find(
  (collection) => collection.id === "kubernetes"
);
const linuxCollection = report.collections.find(
  (collection) => collection.id === "linux-systems-engineering"
);
const nodeRuntimeCollection = report.collections.find(
  (collection) => collection.id === "nodejs-v8-runtime-engineering"
);

assert(kubernetesCollection, "import report should include Kubernetes");
assert.equal(kubernetesCollection.noteCount, 19);
assert(
  linuxCollection,
  "import report should include Linux Systems Engineering"
);
assert.equal(linuxCollection.noteCount, 20);
assert(
  nodeRuntimeCollection,
  "import report should include Node.js V8 Runtime Engineering"
);
assert.equal(nodeRuntimeCollection.noteCount, 20);

const kubernetesNotes = report.copiedNotes.filter(
  (note) => note.collection === "kubernetes"
);
const linuxNotes = report.copiedNotes.filter(
  (note) => note.collection === "linux-systems-engineering"
);
const nodeRuntimeNotes = report.copiedNotes.filter(
  (note) => note.collection === "nodejs-v8-runtime-engineering"
);
assert.equal(kubernetesNotes.length, 19);
assert.equal(linuxNotes.length, 20);
assert.equal(nodeRuntimeNotes.length, 20);
assert.equal(report.unresolvedReferences.length, 0);
assert.equal(
  report.invalidHeadingReferences.filter((reference) =>
    reference.from.startsWith("Knowledge base/kubernetes/")
  ).length,
  0
);
assert.equal(
  report.invalidHeadingReferences.filter((reference) =>
    reference.from.startsWith("Knowledge base/linux-systems-engineering/")
  ).length,
  0
);
assert.equal(
  report.invalidHeadingReferences.filter((reference) =>
    reference.from.startsWith("Knowledge base/nodejs-v8-runtime-engineering/")
  ).length,
  0
);
assert(
  report.convertedLinks.some(
    (link) =>
      link.from === "Knowledge base/kubernetes/Kubernetes.md" &&
      link.href === "/compendium/kubernetes/kubernetes-mastery-roadmap"
  ),
  "Kubernetes root note should link to the public roadmap route"
);
assert(
  report.convertedLinks.some(
    (link) =>
      link.from ===
        "Knowledge base/Software Engineering/Software Engineering.md" &&
      link.href === "/compendium/kubernetes/kubernetes"
  ),
  "Software Engineering index should link to the public Kubernetes route"
);

const kubernetesFiles = listFiles("app/compendium/content/kubernetes").filter(
  (file) => file.endsWith(".md")
);
const linuxFiles = listFiles(
  "app/compendium/content/linux-systems-engineering"
).filter((file) => file.endsWith(".md"));
const nodeRuntimeFiles = listFiles(
  "app/compendium/content/nodejs-v8-runtime-engineering"
).filter((file) => file.endsWith(".md"));
assert.equal(kubernetesFiles.length, 19);
assert.equal(linuxFiles.length, 20);
assert.equal(nodeRuntimeFiles.length, 20);

for (const file of [...kubernetesFiles, ...linuxFiles, ...nodeRuntimeFiles]) {
  assertNotIncludes(file, "[[");
  assertNotIncludes(file, emDash);
}

for (const file of [
  "scripts/import-compendium.mjs",
  "app/compendium/types.ts",
  "app/compendium/collections.ts",
  "app/compendium/page.tsx",
  "app/compendium/[collection]/page.tsx",
]) {
  assertNotIncludes(file, emDash);
}

console.log("Compendium smoke checks passed");
