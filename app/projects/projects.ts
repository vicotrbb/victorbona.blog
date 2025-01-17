export interface Project {
  name: string;
  description: string;
  repository: string;
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
    name: "Newsatlas.io",
    description:
      "A news aggregator that allows you to explore the latest news from every country through an interactive world map.",
    repository: "https://github.com/vicotrbb/newsatlas.io",
    website: "https://newsatlas.daedalusorg.com/",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Serper", "Postgres"],
    status: "maintained",
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
