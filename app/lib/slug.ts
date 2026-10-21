// Heading ids shared by blog MDX, compendium MDX and the compendium TOC so links agree.
export function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Repeated headings get -1, -2 suffixes; `counts` must be fresh per document.
export function getUniqueHeadingId(heading: string, counts: Map<string, number>) {
  const baseId = slugifyHeading(heading);
  const count = counts.get(baseId) ?? 0;
  counts.set(baseId, count + 1);

  return count === 0 ? baseId : `${baseId}-${count}`;
}
