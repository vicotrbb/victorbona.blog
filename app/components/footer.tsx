import { ArrowIcon } from "./ArrowIcon";

export default function Footer() {
  return (
    <footer className="mb-16">
      <ul className="font-sm mt-8 flex flex-col space-x-0 space-y-2 text-neutral-600 md:flex-row md:space-x-4 md:space-y-0 dark:text-neutral-300">
        <li>
          <a
            className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
            rel="noopener noreferrer"
            target="_blank"
            href="/rss"
          >
            <ArrowIcon />
            <p className="ml-2 h-7">RSS</p>
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
            rel="noopener noreferrer"
            target="_blank"
            href="https://github.com/vicotrbb/victorbona.blog"
          >
            <ArrowIcon />
            <p className="ml-2 h-7">Github</p>
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
            rel="noopener noreferrer"
            target="_blank"
            href="https://www.linkedin.com/in/vicotrbb/"
          >
            <ArrowIcon />
            <p className="ml-2 h-7">LinkedIn</p>
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
            rel="noopener noreferrer"
            target="_blank"
            href="https://x.com/BonaVictor"
          >
            <ArrowIcon />
            <p className="ml-2 h-7">X (Twitter)</p>
          </a>
        </li>
      </ul>
      <div className="mt-8 space-y-2 text-neutral-600 dark:text-neutral-300">
        <p>© Victor Bona {new Date().getFullYear()} MIT Licensed</p>
        <a
          href="/llms.txt"
          className="text-xs text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
          aria-label="LLM-friendly site index"
        >
          llms.txt
        </a>
      </div>
    </footer>
  );
}
