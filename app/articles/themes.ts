// Pure module: imported directly by node in tests, so no next/* or path aliases.
export type ResearchTheme = {
  id: string;
  title: string;
  question: string;
  papers: string[];
  // Further reading on this site: case studies and compendium collections.
  reading: Array<{ label: string; href: string }>;
};

export const researchThemes: ResearchTheme[] = [
  {
    id: "reliability",
    title: "Reliability of distributed systems",
    question: "What do delivery, recovery and sampling actually cost, measured at explicit component boundaries?",
    papers: ["redis-jetstream-reliability", "trace-sampling-strategies"],
    reading: [
      { label: "Case study: E-Navigator", href: "/projects/e-navigator" },
      { label: "Case study: Positron", href: "/projects/positron" },
      { label: "Compendium: Kubernetes", href: "/compendium/kubernetes" },
      { label: "Compendium: Linux Systems Engineering", href: "/compendium/linux-systems-engineering" },
    ],
  },
  {
    id: "systems",
    title: "Systems design, written down",
    question: "How should a framework, a runtime or a security component be shaped, and what does it refuse to claim?",
    papers: ["nidus-whitepaper", "locus-whitepaper", "purple-wolf-whitepaper"],
    reading: [
      { label: "Case study: Nidus", href: "/projects/nidus" },
      { label: "Case study: Guara Cloud", href: "/projects/guara-cloud" },
      { label: "Compendium: Rust", href: "/compendium/rust" },
      { label: "Compendium: Design Patterns", href: "/compendium/design-patterns" },
    ],
  },
  {
    id: "formal",
    title: "Formal methods and combinatorics",
    question: "Which results can be stated exactly, enumerated by machine and checked in Lean 4?",
    papers: ["bfs-avoidance-frontier"],
    reading: [{ label: "Compendium: Data Structures", href: "/compendium/data-structures" }],
  },
  {
    id: "protocols",
    title: "Protocols and API design",
    question: "Where do web standards leave gaps that real APIs keep working around?",
    papers: ["the-missing-http-verb-strut"],
    reading: [{ label: "Compendium: Software Engineering", href: "/compendium/software-engineering" }],
  },
];
