import { articles, toBibtex } from "app/articles/articles";
import { absoluteUrl } from "app/lib/seo";
import { siteBibtex } from "../cite";

export const dynamic = "force-static";

export function GET() {
  const body = [siteBibtex, ...articles.map((a) => toBibtex(a, a.pdfUrl && absoluteUrl(a.pdfUrl)))].join("\n\n");
  return new Response(`${body}\n`, {
    headers: {
      "Content-Type": "application/x-bibtex; charset=utf-8",
      "Content-Disposition": 'inline; filename="victor-bona.bib"',
    },
  });
}
