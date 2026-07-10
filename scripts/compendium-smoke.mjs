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

function assertNoWikilinksOutsideFences(file) {
  let inFence = false;
  let fenceMarker = "";

  for (const line of read(file).split(/\r?\n/)) {
    const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[2][0];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (marker === fenceMarker) {
        inFence = false;
        fenceMarker = "";
      }
      continue;
    }

    if (!inFence) {
      assert(
        !line.includes("[["),
        `${file} should not include a wikilink outside fenced code`
      );
    }
  }

  assert(!inFence, `${file} should close every fenced code block`);
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
assertIncludes("scripts/import-compendium.mjs", 'id: "cpu-llm-inference"');
assertIncludes("scripts/import-compendium.mjs", 'id: "rust"');
assertIncludes("scripts/import-compendium.mjs", "stripSourceFrontmatter: true");
assertIncludes("app/compendium/types.ts", '"kubernetes"');
assertIncludes("app/compendium/types.ts", '"linux-systems-engineering"');
assertIncludes("app/compendium/types.ts", '"nodejs-v8-runtime-engineering"');
assertIncludes("app/compendium/types.ts", '"cpu-llm-inference"');
assertIncludes("app/compendium/types.ts", '"rust"');
assertIncludes("app/compendium/collections.ts", 'id: "kubernetes"');
assertIncludes(
  "app/compendium/collections.ts",
  'id: "linux-systems-engineering"'
);
assertIncludes(
  "app/compendium/collections.ts",
  'id: "nodejs-v8-runtime-engineering"'
);
assertIncludes("app/compendium/collections.ts", 'id: "cpu-llm-inference"');
assertIncludes("app/compendium/collections.ts", 'id: "rust"');
assertIncludes("app/compendium/page.tsx", "Kubernetes");
assertIncludes("app/compendium/page.tsx", "Linux systems engineering");
assertIncludes("app/compendium/page.tsx", "Node.js V8 runtime");
assertIncludes("app/compendium/page.tsx", "CPU LLM inference");
assertIncludes("app/compendium/page.tsx", "Rust");
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
assertIncludes(
  "app/compendium/[collection]/page.tsx",
  'getCompendiumNote("rust", "rust")'
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
const cpuLlmCollection = report.collections.find(
  (collection) => collection.id === "cpu-llm-inference"
);
const rustCollection = report.collections.find(
  (collection) => collection.id === "rust"
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
assert(cpuLlmCollection, "import report should include CPU LLM Inference");
assert.equal(cpuLlmCollection.noteCount, 11);
assert(rustCollection, "import report should include Rust");
assert.equal(rustCollection.noteCount, 18);

const kubernetesNotes = report.copiedNotes.filter(
  (note) => note.collection === "kubernetes"
);
const linuxNotes = report.copiedNotes.filter(
  (note) => note.collection === "linux-systems-engineering"
);
const nodeRuntimeNotes = report.copiedNotes.filter(
  (note) => note.collection === "nodejs-v8-runtime-engineering"
);
const cpuLlmNotes = report.copiedNotes.filter(
  (note) => note.collection === "cpu-llm-inference"
);
const rustNotes = report.copiedNotes.filter(
  (note) => note.collection === "rust"
);
assert.equal(kubernetesNotes.length, 19);
assert.equal(linuxNotes.length, 20);
assert.equal(nodeRuntimeNotes.length, 20);
assert.equal(cpuLlmNotes.length, 11);
assert.equal(rustNotes.length, 18);
assert.equal(
  rustNotes.reduce((total, note) => total + note.mermaidBlocks, 0),
  32
);
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
assert.equal(
  report.invalidHeadingReferences.filter((reference) =>
    reference.from.startsWith("Knowledge base/Research on CPU LLM Inference/")
  ).length,
  0
);
assert.equal(
  report.invalidHeadingReferences.filter((reference) =>
    reference.from.startsWith("Knowledge base/Rust/")
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
assert(
  report.convertedLinks.some(
    (link) =>
      link.from === "Knowledge base/Rust/Rust.md" &&
      link.href === "/compendium/rust/rust-mastery-roadmap"
  ),
  "Rust root note should link to the public mastery roadmap route"
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
const cpuLlmFiles = listFiles("app/compendium/content/cpu-llm-inference").filter(
  (file) => file.endsWith(".md")
);
const rustFiles = listFiles("app/compendium/content/rust").filter((file) =>
  file.endsWith(".md")
);
assert.equal(kubernetesFiles.length, 19);
assert.equal(linuxFiles.length, 20);
assert.equal(nodeRuntimeFiles.length, 20);
assert.equal(cpuLlmFiles.length, 11);
assert.equal(rustFiles.length, 18);
assertIncludes(
  "app/compendium/content/cpu-llm-inference/state-of-the-art.md",
  'title: "State of the Art - Open-Source CPU Inference Engines"'
);
assertNotIncludes(
  "app/compendium/content/cpu-llm-inference/state-of-the-art.md",
  "# Document 1:"
);
assertIncludes(
  "app/compendium/content/cpu-llm-inference/benchmarks-and-baselines.md",
  "&#36;0.001/1K tokens"
);
assertIncludes(
  "app/compendium/content/rust/rust.md",
  'sourcePath: "Knowledge base/Rust/Rust.md"'
);
assertIncludes("app/compendium/content/rust/rust.md", "# Rust");
assertIncludes(
  "app/compendium/content/rust/ownership-borrowing-and-lifetimes.md",
  'title: "Ownership, Borrowing, and Lifetimes"'
);
assertIncludes(
  "app/compendium/content/rust/macros-metaprogramming-and-proc-macros.md",
  'title: "Macros, Metaprogramming, and Procedural Macros"'
);
assertNotIncludes("app/compendium/content/rust/rust.md", "aliases:");
assertNotIncludes(
  "app/compendium/content/rust/rust.md",
  'rust-toolchain-verified: "1.96.0"'
);
assertIncludes(
  "app/compendium/content/rust/testing-verification-benchmarking-and-tooling.md",
  "[[bench]]"
);

for (const file of rustFiles) {
  assertNotIncludes(file, "\naliases:\n");
  assertNotIncludes(file, "\nrust-toolchain-verified:");
}

for (const file of [
  ...kubernetesFiles,
  ...linuxFiles,
  ...nodeRuntimeFiles,
  ...cpuLlmFiles,
  ...rustFiles,
]) {
  assertNoWikilinksOutsideFences(file);
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
