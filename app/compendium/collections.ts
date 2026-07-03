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
  {
    id: "kubernetes",
    title: "Kubernetes",
    description:
      "Kubernetes learning notes on API machinery, workloads, networking, storage, security, operations, GitOps, policy, and production platform patterns.",
    route: "/compendium/kubernetes",
  },
  {
    id: "linux-systems-engineering",
    title: "Linux Systems Engineering",
    description:
      "Linux systems notes on kernel boundaries, processes, memory, storage, networking, systemd, permissions, containers, observability, performance, security, and eBPF.",
    route: "/compendium/linux-systems-engineering",
  },
  {
    id: "nodejs-v8-runtime-engineering",
    title: "Node.js V8 Runtime Engineering",
    description:
      "Node.js and V8 runtime notes on the event loop, JavaScript execution, V8 internals, memory, modules, packages, streams, networking, diagnostics, performance, security, and production operations.",
    route: "/compendium/nodejs-v8-runtime-engineering",
  },
  {
    id: "cpu-llm-inference",
    title: "CPU LLM Inference Research",
    description:
      "Research notes on CPU-native LLM inference, memory budgets, quantization, SIMD kernels, runtime architecture, model compatibility, benchmarks, Rust implementation strategy, and testing ladders.",
    route: "/compendium/cpu-llm-inference",
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
