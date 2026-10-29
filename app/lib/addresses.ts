// Pure module: imported directly by node in tests, so no next/* or path aliases.
export type AddressCode = "P100" | "P200" | "P300" | "P400" | "P500" | "P600";
export type Address = { code: AddressCode; label: string; href: string; aliases: string[] };

export const addresses: Address[] = [
  { code: "P100", label: "Home", href: "/", aliases: ["home"] },
  { code: "P200", label: "Profile", href: "/about", aliases: ["profile", "about"] },
  { code: "P300", label: "Papers", href: "/articles", aliases: ["papers", "articles"] },
  { code: "P400", label: "Systems", href: "/projects", aliases: ["systems", "projects"] },
  { code: "P500", label: "Writing", href: "/blog", aliases: ["writing", "blog", "posts"] },
  { code: "P600", label: "Compendium", href: "/compendium", aliases: ["compendium", "notes"] },
];

// Pages reachable by `cd` and links, but kept out of the primary address row.
export const extraPages: Array<{ label: string; href: string; aliases: string[] }> = [
  { label: "Now", href: "/now", aliases: ["now"] },
  { label: "Research", href: "/research", aliases: ["research", "cite"] },
  { label: "Press", href: "/press", aliases: ["press", "media", "imprensa"] },
  { label: "Search", href: "/search", aliases: ["search"] },
];
