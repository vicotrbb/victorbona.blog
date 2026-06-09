export interface Project {
  name: string;
  description: string;
  longDescription?: string;
  repository?: string;
  website?: string;
  tags: string[];
  status: "completed" | "in-progress" | "maintained" | "stopped";
  publiclyShared: boolean;
  license: string;
  images?: string[];
  gifs?: string[];
  startDate?: string;
  tech?: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    deployment?: string[];
  };
}

export const projects: Project[] = [
  {
    name: "Guara Cloud",
    description:
      "A cloud platform for launching and operating catalog-based user services with billing, observability, backups, and Kubernetes-native deployment.",
    longDescription:
      "Guara Cloud is a production cloud platform built around service catalog workflows, subscription billing, Kubernetes orchestration, observability, and service-native backup operations. It brings together application delivery, usage-aware billing, infrastructure automation, and operational tooling for running user services safely.",
    repository: undefined,
    website: "https://guaracloud.com",
    tags: [
      "Kubernetes",
      "Next.js",
      "TypeScript",
      "PostgreSQL",
      "Stripe",
      "GitOps",
    ],
    status: "maintained",
    publiclyShared: false,
    license: "Proprietary",
    gifs: ["/projects/guaracloud/gif_1.gif"],
    tech: {
      frontend: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
      backend: ["Node.js", "TypeScript", "NATS"],
      database: ["PostgreSQL"],
      deployment: ["Kubernetes", "Helm", "GitOps", "Longhorn", "OpenTelemetry"],
    },
  },
  {
    name: "Purple Wolf",
    description:
      "A fast, low-memory Web Application Firewall for Traefik, shipped as a WASM plugin with signed releases, SBOMs, and Kubernetes packaging.",
    longDescription:
      "Purple Wolf is a Rust-based Traefik WAF built around a pure detection engine, a WASM/http-wasm adapter, and a webhook relay for signed audit-event fan-out. It inspects headers, URLs, query parameters, and capped request bodies using libinjection, literal signatures, structural checks, and reputation controls. The project includes a public threat model, reproducible benchmarks, release verification, Helm and Kustomize deployment paths, and a local demo.",
    repository: "https://github.com/guaracloud/purple-wolf",
    website: "https://guaracloud.github.io/purple-wolf/",
    tags: ["Rust", "WASM", "Traefik", "Security", "Kubernetes", "Helm"],
    status: "maintained",
    publiclyShared: true,
    license: "MIT OR Apache-2.0",
    tech: {
      backend: ["Rust", "WASM", "Tokio", "libinjection"],
      deployment: ["Traefik", "Kubernetes", "Helm OCI", "Kustomize", "GHCR"],
    },
  },
  {
    name: "Victor Bona Blog",
    description:
      "My personal blog built with Next.js, MDX, and Tailwind CSS. Features dark mode, RSS feed, and more.",
    longDescription:
      "A modern, minimalist blog platform built with cutting-edge web technologies. Features include server-side rendering, static generation, dark/light mode support, RSS feed generation, and comprehensive SEO optimization.",
    repository: "https://github.com/vicotrbb/victorbona.blog",
    website: "https://blog.victorbona.dev",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "MDX", "Postgres"],
    status: "maintained",
    publiclyShared: true,
    license: "MIT",
    startDate: "2024-01-01",
    gifs: ["/projects/blog/Clip 1 - Blog.gif"],
    tech: {
      frontend: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
      backend: ["Node.js", "MDX"],
      database: ["PostgreSQL"],
      deployment: ["Vercel", "Neon"],
    },
  },
  {
    name: "HAAT",
    description:
      "The platform for all platforms. Easy, plugable and module infrastructure for my personal projects.",
    longDescription:
      "A complete, modular and plugable infrastructure for my own projects, support adding new projects from scratch within minutes without having to worry about deployment, api architecture, databases, migrations and etc. Supports queues, events, async tasks, and more. Built to make it fast to host my own automation tools and personal projects.",
    repository: undefined,
    website: undefined,
    tags: ["Python", "Celery", "Next.js", "AI", "Postgres", "Agno"],
    status: "stopped",
    publiclyShared: false,
    license: "Proprietary",
    startDate: "2025-04-01",
    gifs: [
      "/projects/HAAT/Clip 1 - HAAT.gif",
      "/projects/HAAT/Clip 2 - HAAT.gif",
      "/projects/HAAT/Clip 3 - HAAT.gif",
      "/projects/HAAT/Clip 4 - HAAT.gif",
    ],
    tech: {
      frontend: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
      backend: ["Python", "Celery", "Redis"],
      database: ["PostgreSQL"],
      deployment: ["Docker", "Local Homelab"],
    },
  },
  {
    name: "SQLTemple",
    description: "Open-source AI-powered SQL Bench/IDE.",
    longDescription:
      "SQLTemple is a modern, AI-powered SQL IDE built with Electron and React. It provides intelligent query assistance, execution plan visualization, and a VS Code-like development experience for database work.",
    repository: "https://github.com/vicotrbb/sqltemple",
    website: "https://sqltemple.dev",
    tags: ["React", "Electron", "Typescript", "AI", "SQLite"],
    status: "maintained",
    publiclyShared: true,
    license: "Apache 2.0",
    startDate: "2025-05-01",
    gifs: [],
    tech: {
      frontend: ["React", "TypeScript", "Tailwind CSS"],
      backend: ["Typescript"],
      database: ["SQLite"],
      deployment: ["Electron"],
    },
  },
  {
    name: "Agent-buddy",
    description: "A simple CLI-based AI agent.",
    longDescription:
      "A simple CLI-based AI agent for zsh that uses the ReAct methodology to help users with tasks in their current directory. Built with TypeScript and OpenAI's function calling capabilities.",
    repository: "https://github.com/vicotrbb/agent-buddy",
    website: undefined,
    tags: ["ChatGPT", "OpenAI", "terminal", "ReAct"],
    status: "stopped",
    publiclyShared: true,
    license: "MIT",
  },
  {
    name: "Threadrize",
    description:
      "Threadrize is a web-based platform designed specifically for X users who want to save time and improve their social media presence.",
    longDescription:
      "A comprehensive social media management platform that helps content creators optimize their X (Twitter) presence through automated thread creation, scheduling, and analytics. Built with modern web technologies and AI-powered content optimization.",
    repository: undefined,
    website: "https://threadrize.com",
    tags: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Shadcn",
      "Supabase",
      "OpenAI",
      "X",
    ],
    status: "stopped",
    publiclyShared: false,
    gifs: [],
    license: "Proprietary",
    startDate: "2025-03-01",
    tech: {
      frontend: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Shadcn/ui"],
      backend: ["Node.js", "Supabase", "OpenAI API"],
      database: ["Supabase", "PostgreSQL"],
      deployment: ["Vercel"],
    },
  },
  {
    name: "Saas Starter Template",
    description:
      "A feature-rich, opinionated Next.js 15 (App Router) + Supabase SaaS starter template designed to accelerate the development of modern web applications.",
    repository: "https://github.com/vicotrbb/saas-starter-template",
    website: undefined,
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Shadcn", "Supabase"],
    status: "maintained",
    publiclyShared: true,
    license: "MIT",
  },
  {
    name: "DataTide",
    description:
      "DataTide is a high-performance Node.js library for processing large datasets using worker threads.",
    repository: "https://github.com/vicotrbb/data-tide-js",
    website: "https://www.npmjs.com/package/data-tide-js",
    tags: ["typescript", "nodejs", "multi-threading"],
    status: "in-progress",
    publiclyShared: true,
    license: "MIT",
  },
  {
    name: "Pylexitext",
    description:
      "A Python library that aggregates a series of NLP methods, text analysis, content converters, and other useful utilities.",
    repository: "https://github.com/vicotrbb/Pylexitext",
    website: undefined,
    tags: ["Python", "NLP", "Text Analysis"],
    status: "stopped",
    publiclyShared: true,
    license: "MIT",
  },
  {
    name: "Oh-My-GPT",
    description:
      "A simple ZSH plugin to interact with chat-gpt from your terminal.",
    repository: "https://github.com/vicotrbb/oh-my-gpt",
    website: undefined,
    tags: ["zsh", "ChatGPT", "OpenAI", "terminal"],
    status: "maintained",
    publiclyShared: true,
    license: "MIT",
  },
];
