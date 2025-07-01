export interface Project {
  name: string;
  description: string;
  repository?: string;
  website?: string;
  tags: string[];
  status: "completed" | "in-progress" | "maintained" | "stopped";
}

export const projects: Project[] = [
  {
    name: "Victor Bona Blog",
    description:
      "My personal blog built with Next.js, MDX, and Tailwind CSS. Features dark mode, RSS feed, and more.",
    repository: "https://github.com/vicotrbb/victorbona.blog",
    website: "https://blog.victorbona.dev",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "MDX", "Postgres"],
    status: "maintained",
  },
  {
    name: "Agent-buddy",
    description:
      "A simple CLI-based AI agent for zsh that uses the ReAct methodology to help users with tasks in their current directory. Built with TypeScript and OpenAI's function calling capabilities.",
    repository: "https://github.com/vicotrbb/agent-buddy",
    website: undefined,
    tags: ["zsh", "ChatGPT", "OpenAI", "terminal", "ReAct"],
    status: "maintained",
  },
  {
    name: "Threadrize",
    description:
      "Threadrize is a web-based platform designed specifically for X users who want to save time and improve their social media presence.",
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
    status: "maintained",
  },
  {
    name: "Saas Starter Template",
    description:
      "A feature-rich, opinionated Next.js 15 (App Router) + Supabase SaaS starter template designed to accelerate the development of modern web applications.",
    repository: "https://github.com/vicotrbb/saas-starter-template",
    website: undefined,
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Shadcn", "Supabase"],
    status: "maintained",
  },
  {
    name: "Toolharbor",
    description:
      "Build More, Boilerplate Less. All-in-One Developer Tools Suite.",
    repository: undefined,
    website: "https://toolharbor.io",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Shadcn", "Supabase"],
    status: "in-progress",
  },
  {
    name: "Cardinal",
    description: "A technical learning endeavour of building my own OS.",
    repository: "https://github.com/vicotrbb/cardinal",
    website: undefined,
    tags: ["C", "ASM", "GRUB", "QEMU"],
    status: "in-progress",
  },
  {
    name: "DataTide",
    description:
      "DataTide is a high-performance Node.js library for processing large datasets using worker threads.",
    repository: "https://github.com/vicotrbb/data-tide-js",
    website: "https://www.npmjs.com/package/data-tide-js",
    tags: ["typescript", "nodejs", "multi-threading"],
    status: "in-progress",
  },
  {
    name: "Code Commons",
    description:
      "Code commons is a OSS database, created to allow creators and developers to find the right open source project/software that fit their needs.",
    repository: undefined,
    website: "https://codecommons.io",
    tags: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Shadcn",
      "Supabase",
      "Stripe",
    ],
    status: "stopped",
  },
  {
    name: "Newsatlas.io",
    description:
      "A news aggregator that allows you to explore the latest news from every country through an interactive world map.",
    repository: "https://github.com/vicotrbb/newsatlas.io",
    website: "https://newsatlas.daedalusorg.com/",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Serper", "Postgres"],
    status: "stopped",
  },
  {
    name: "Pylexitext",
    description:
      "A python library that aggregates a series of NLP methods, text analysis, content converters and other usefull stuff.",
    repository: "https://github.com/vicotrbb/Pylexitext",
    website: undefined,
    tags: ["Python", "NLP", "Text Analysis"],
    status: "stopped",
  },
  {
    name: "Oh-My-GPT",
    description:
      "A simple ZSH plugin to interact with chat-gpt from your terminal.",
    repository: "https://github.com/vicotrbb/oh-my-gpt",
    website: undefined,
    tags: ["zsh", "ChatGPT", "OpenAI", "terminal"],
    status: "maintained",
  },
];
