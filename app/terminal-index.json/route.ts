import { getTerminalIndex } from "app/lib/terminal-index";

// Built once at build time and served as a cached static file, so pages don't carry the index.
export const dynamic = "force-static";

export function GET() {
  return Response.json(getTerminalIndex());
}
