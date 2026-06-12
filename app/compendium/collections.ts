import type { CompendiumCollection, CompendiumCollectionId } from "./types";

export const compendiumCollections: CompendiumCollection[] = [
  {
    id: "software-engineering",
    title: "Software Engineering",
    description:
      "Staff and Principal-level notes on architecture, distributed systems, reliability, security, delivery, leadership, and AI-native engineering.",
    route: "/compendium/software-engineering",
  },
  {
    id: "data-structures",
    title: "Data Structures",
    description:
      "Reference notes for common and advanced data structures, complexity tradeoffs, implementation patterns, and practical selection guidance.",
    route: "/compendium/data-structures",
  },
  {
    id: "design-patterns",
    title: "Design Patterns",
    description:
      "Object-oriented, architectural, distributed-systems, and functional pattern notes with pragmatic implementation context.",
    route: "/compendium/design-patterns",
  },
];

export function isCompendiumCollectionId(
  id: string
): id is CompendiumCollectionId {
  return compendiumCollections.some((collection) => collection.id === id);
}

export function getCompendiumCollection(id: string) {
  return compendiumCollections.find((collection) => collection.id === id);
}
