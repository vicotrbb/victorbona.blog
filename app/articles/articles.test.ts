import { test } from "node:test";
import assert from "node:assert/strict";
import { articles, toBibtex } from "./articles.ts";

test("preprint BibTeX carries DOI, publisher and status", () => {
  const preprint = articles.find((a) => a.slug === "trace-sampling-strategies")!;
  assert.equal(
    toBibtex(preprint, "https://x.dev/papers/trace-sampling-strategies.pdf"),
    [
      "@misc{bona2026tracesampling,",
      "  author = {Victor Bona},",
      "  title = {Trace Sampling at the Collector Boundary: Costs and Diagnostic Evidence},",
      "  year = {2026},",
      "  month = {sep},",
      "  publisher = {Zenodo},",
      "  doi = {10.5281/zenodo.23032245},",
      "  url = {https://doi.org/10.5281/zenodo.23032245},",
      "  note = {Preprint}",
      "}",
    ].join("\n"),
  );
});

test("whitepaper BibTeX falls back to the PDF url and escapes specials", () => {
  const bib = toBibtex(
    { slug: "s", title: "A & B_c", authors: ["A One", "B Two"], publishedAt: "2026-06-07", status: "independently published" },
    "https://x.dev/p.pdf",
  );
  assert.match(bib, /^@misc\{s,/);
  assert.match(bib, /author = \{A One and B Two\}/);
  assert.match(bib, /title = \{A \\& B\\_c\}/);
  assert.match(bib, /url = \{https:\/\/x\.dev\/p\.pdf\}/);
  assert.match(bib, /note = \{Independently published\}/);
  assert.doesNotMatch(bib, /doi =/);
});
