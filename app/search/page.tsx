import type { Metadata } from "next";
import { baseUrl } from "app/sitemap";
import { SearchBox } from "./SearchBox";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Victor Bona's posts, papers, systems and compendium notes.",
  alternates: { canonical: `${baseUrl}/search` },
  // Result pages are client-side and endless; keep them out of the index.
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    <section className="w-full">
      <header className="border-b border-[var(--line)] pb-8">
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-none tracking-[-0.03em] text-[var(--text)]">Search</h1>
        <p className="mt-4 max-w-[60ch] text-[var(--dim)]">
          Posts, papers, systems and compendium notes in one place. Every word must match. Also available in the
          terminal as <code className="font-mono text-[var(--text)]">grep</code>.
        </p>
      </header>
      <div className="mt-10">
        <SearchBox />
      </div>
    </section>
  );
}
