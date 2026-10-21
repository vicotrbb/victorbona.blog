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
  headshot: null,
  yearsExperience: null,
  timeline: [],
  talks: [],
  scale: [],
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
    ...(p.headshot ? { image: new URL(p.headshot, baseUrl).toString() } : {}),
  };
}
