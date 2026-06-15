export type CompendiumCollectionId =
  | "software-engineering"
  | "data-structures"
  | "design-patterns"
  | "kubernetes";

export type CompendiumFrontmatter = {
  title: string;
  collection: CompendiumCollectionId;
  sourcePath: string;
  order: number;
};

export type CompendiumTocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type CompendiumNote = {
  title: string;
  slug: string;
  collection: CompendiumCollectionId;
  sourcePath: string;
  order: number;
  content: string;
  excerpt: string;
  readingTime: number;
  wordCount: number;
  diagramCount: number;
  outgoingLinks: string[];
  toc: CompendiumTocItem[];
};

export type CompendiumCollection = {
  id: CompendiumCollectionId;
  title: string;
  description: string;
  route: string;
};
