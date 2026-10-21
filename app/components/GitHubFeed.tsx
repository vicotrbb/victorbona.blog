import type { GitHubSnapshot } from "app/lib/github";
import { githubUser } from "app/lib/github";
import { Ago } from "./Ago";

// Server-rendered from an ISR snapshot; renders nothing when GitHub was unreachable.
export function GitHubFeed({ snapshot, limit = 8 }: { snapshot: GitHubSnapshot | null; limit?: number }) {
  if (!snapshot || !snapshot.activity.length) return null;
  const latest = snapshot.activity[0];

  return (
    <div>
      <p className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs text-[var(--dim)] sm:text-sm">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block size-1.5 animate-pulse rounded-full bg-[var(--lit)] motion-reduce:animate-none" />
          last push <span className="text-[var(--text)]"><Ago iso={latest.at} /></span>
        </span>
        <span>
          <span className="tabular-nums text-[var(--text)]">{snapshot.stars}</span> stars
        </span>
        <span>
          <span className="tabular-nums text-[var(--text)]">{snapshot.repos}</span> public repos
        </span>
        <a
          href={`https://github.com/${githubUser}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--text)] decoration-1 underline-offset-4 hover:underline"
        >
          github.com/{githubUser}
        </a>
      </p>
      <ol className="font-mono text-xs sm:text-sm">
        {snapshot.activity.slice(0, limit).map((a) => (
          <li
            key={`${a.repo}:${a.verb}:${a.at}`}
            className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-baseline gap-x-4 border-t border-[var(--line)] py-2.5 sm:grid-cols-[5.5rem_8.5rem_minmax(0,1fr)]"
          >
            <span className="text-[var(--dim)]"><Ago iso={a.at} /></span>
            <span className="hidden text-[var(--dim)] sm:inline">
              {a.verb}
              {a.count > 1 && <span className="tabular-nums"> ×{a.count}</span>}
            </span>
            <a href={a.href} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-[var(--text)] decoration-[var(--lit)] decoration-1 underline-offset-4 hover:underline">
              <span className="sm:hidden text-[var(--dim)]">{a.verb} </span>
              {a.repo.split("/")[1]}
              {a.detail && <span className="text-[var(--dim)]"> {a.detail}</span>}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
