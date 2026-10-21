// Pure module: imported directly by node in tests, so no next/* or path aliases.
export type TimelineEntry = { org: string; role: string; start: string; end: string | null; summary: string };
export type Talk = { title: string; venue: string; date: string; url?: string };
export type ScaleFact = { label: string; value: string };

type Profile = {
  name: "Victor Bona";
  oneLiner: string;
  email: "victor.bona@hotmail.com";
  links: { linkedin: string; x: "https://x.com/BonaVictor"; github: string };
  headshot: string | null;
  yearsExperience: number | null;
  timeline: TimelineEntry[];
  talks: Talk[];
  scale: ScaleFact[];
  worksFor: string;
  alumniOf: string;
  location: string;
  languages: string[];
};

export const profile: Profile = {
  name: "Victor Bona",
  oneLiner: "Senior Software Engineer, Distributed systems specialist and AI enthusiast",
  email: "victor.bona@hotmail.com",
  links: {
    linkedin: "https://www.linkedin.com/in/victorbona/",
    x: "https://x.com/BonaVictor",
    github: "https://github.com/vicotrbb",
  },
  headshot: "/profile/headshot.webp",
  // Stated by Victor.
  yearsExperience: 8,
  timeline: [
    { org: "Hopper", role: "Senior Software Engineer", start: "2026-03", end: null, summary: "Senior software engineer at Hopper." },
    { org: "Deel", role: "Software Engineer", start: "2025-01", end: "2026-03", summary: "Built features and APIs across teams for Deel's global payroll and HR platform, and took part in product planning." },
    { org: "Valari (YC W22)", role: "Senior Software Engineer", start: "2024-05", end: "2025-01", summary: "Founding engineer at a LATAM banking-as-a-service company. Rebuilt the Valari ledger within one week after a third-party provider shut down, shipped an LLM-based Q&A assistant, and architected distributed systems on AWS." },
    { org: "Valari (YC W22)", role: "Software Engineer", start: "2022-10", end: "2024-04", summary: "First founding engineer. Designed distributed architectures, managed the software infrastructure, and owned on-call, on Node.js, PySpark, AWS, and Terraform." },
    { org: "Amazon", role: "Software Development Engineer", start: "2021-05", end: "2022-11", summary: "Brazilian Amazon fintech team, building systems for Amazon's financial and accountability obligations to internal and government stakeholders, on Java, TypeScript, Scala, AWS CDK, Redshift, and DynamoDB, with on-call." },
    { org: "Mout'S", role: "Experienced Software Developer", start: "2021-02", end: "2021-05", summary: "Software developer at an IT services company." },
    { org: "WorkDB Data Business", role: "Full Stack Developer", start: "2020-10", end: "2021-02", summary: "Full-stack developer." },
    { org: "Majoris", role: "Back-end Developer", start: "2020-05", end: "2020-08", summary: "Back-end developer." },
    { org: "Philips", role: "Entry Level Developer", start: "2020-03", end: "2020-09", summary: "Developer after a research and development internship (2019-10 to 2020-02)." },
  ],
  talks: [],
  scale: [
    { label: "base", value: "Blumenau, Brazil" },
    { label: "domains", value: "fintech, payroll, banking-as-a-service" },
    { label: "education", value: "Computer Science, FURB (2018–2022, not completed)" },
    { label: "languages", value: "pt native · en full professional · de elementary" },
  ],
  worksFor: "Hopper",
  alumniOf: "FURB - Universidade de Blumenau",
  location: "Blumenau, Santa Catarina, Brazil",
  languages: ["Portuguese", "English", "German"],
};

export function isPending(v: unknown): boolean {
  return v === null || v === undefined || (Array.isArray(v) && v.length === 0);
}

export function personJsonLd(p: Profile, baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${baseUrl}/#victor-bona`,
    name: p.name,
    url: baseUrl,
    email: `mailto:${p.email}`,
    jobTitle: "Senior Software Engineer",
    description: p.oneLiner,
    sameAs: [p.links.linkedin, p.links.x, p.links.github],
    knowsAbout: [
      "Distributed systems",
      "AI systems",
      "software architecture",
      "platform engineering",
      "Kubernetes",
      "cloud infrastructure",
      "security engineering",
      "developer tools",
      "observability",
    ],
    worksFor: { "@type": "Organization", name: p.worksFor },
    alumniOf: { "@type": "CollegeOrUniversity", name: p.alumniOf },
    homeLocation: { "@type": "Place", name: p.location },
    knowsLanguage: p.languages,
    ...(p.headshot ? { image: new URL(p.headshot, baseUrl).toString() } : {}),
  };
}
