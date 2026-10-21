// Pure parsing plus fetchers: imported directly by node in tests, so no next/* or path aliases.
export const githubUser = "vicotrbb";
const owners = [`users/${githubUser}`, "orgs/guaracloud"];

export type RawEvent = {
  type: string;
  created_at: string;
  repo: { name: string };
  payload: {
    ref?: string | null;
    ref_type?: string;
    action?: string;
    number?: number;
    pull_request?: { title?: string };
    issue?: { title?: string; number?: number };
    release?: { tag_name?: string; name?: string };
  };
};
export type RawRepo = { full_name: string; stargazers_count: number; pushed_at: string; fork: boolean; private?: boolean };

export type Activity = { repo: string; verb: string; detail: string; at: string; count: number; href: string };
export type RepoStats = { stars: number; pushedAt: string };
export type GitHubSnapshot = { activity: Activity[]; stars: number; repos: number; byRepo: Record<string, RepoStats> };

const repoUrl = (repo: string) => `https://github.com/${repo}`;
const branch = (ref?: string | null) => (ref ?? "").replace(/^refs\/(heads|tags)\//, "");

function describe(e: RawEvent): Omit<Activity, "count" | "at"> | null {
  const repo = e.repo.name;
  const p = e.payload;
  switch (e.type) {
    case "PushEvent":
      return { repo, verb: "push", detail: branch(p.ref), href: `${repoUrl(repo)}/commits/${branch(p.ref)}` };
    case "PullRequestEvent":
      if (!p.number || !["opened", "merged", "closed"].includes(p.action ?? "")) return null;
      return { repo, verb: p.action === "opened" ? "pr open" : `pr ${p.action}`, detail: p.pull_request?.title ? `#${p.number} ${p.pull_request.title}` : `#${p.number}`, href: `${repoUrl(repo)}/pull/${p.number}` };
    case "IssuesEvent": {
      const n = p.issue?.number;
      if (!n || !["opened", "closed"].includes(p.action ?? "")) return null;
      return { repo, verb: `issue ${p.action}`, detail: p.issue?.title ? `#${n} ${p.issue.title}` : `#${n}`, href: `${repoUrl(repo)}/issues/${n}` };
    }
    case "ReleaseEvent":
      return p.release?.tag_name ? { repo, verb: "release", detail: p.release.tag_name, href: `${repoUrl(repo)}/releases/tag/${p.release.tag_name}` } : null;
    case "CreateEvent":
      return p.ref_type === "tag" ? { repo, verb: "tag", detail: branch(p.ref), href: `${repoUrl(repo)}/releases/tag/${branch(p.ref)}` } : null;
    case "PublicEvent":
      return { repo, verb: "open-sourced", detail: "", href: repoUrl(repo) };
    default:
      return null;
  }
}

// Events arrive newest first; consecutive same-kind events on one repo and ref fold into one row.
export function toActivity(events: RawEvent[], limit = 8): Activity[] {
  const out: Activity[] = [];
  // The API orders by event id, which can disagree with created_at across repos.
  const sorted = [...events].sort((a, b) => b.created_at.localeCompare(a.created_at));
  for (const e of sorted) {
    const d = describe(e);
    if (!d) continue;
    const last = out[out.length - 1];
    if (last && d.verb === "push" && last.verb === "push" && last.repo === d.repo && last.detail === d.detail) {
      last.count += 1;
      continue;
    }
    if (out.length === limit) break;
    out.push({ ...d, at: e.created_at, count: 1 });
  }
  return out;
}

export function toRepoStats(repos: RawRepo[]): Pick<GitHubSnapshot, "stars" | "repos" | "byRepo"> {
  const own = repos.filter((r) => !r.fork && !r.private);
  return {
    stars: own.reduce((sum, r) => sum + r.stargazers_count, 0),
    repos: own.length,
    byRepo: Object.fromEntries(own.map((r) => [r.full_name.toLowerCase(), { stars: r.stargazers_count, pushedAt: r.pushed_at }])),
  };
}

// "https://github.com/Owner/Repo" -> "owner/repo"; anything else -> undefined.
export function repoKey(url?: string): string | undefined {
  const m = url?.match(/^https:\/\/github\.com\/([^/]+\/[^/#?]+)/);
  return m?.[1].toLowerCase().replace(/\.git$/, "");
}

async function getJson<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(`https://api.github.com/${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
      },
      // Unauthenticated limit is 60 req/h per IP: events every 2 min plus repos every 15 min stays under it.
      next: { revalidate },
      signal: AbortSignal.timeout(4000),
    } as RequestInit);
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

// null when GitHub is unreachable, so callers render nothing rather than stale zeros.
export async function getGitHubSnapshot(): Promise<GitHubSnapshot | null> {
  const [events, ...repoLists] = await Promise.all([
    getJson<RawEvent[]>(`users/${githubUser}/events/public?per_page=100`, 120),
    ...owners.map((o) => getJson<RawRepo[]>(`${o}/repos?per_page=100&type=public`, 900)),
  ]);
  if (!events && repoLists.every((r) => !r)) return null;
  return { activity: toActivity(events ?? []), ...toRepoStats(repoLists.flatMap((r) => r ?? [])) };
}
