// Pure module: imported directly by node in tests, so no next/* or path aliases.
export type RingInput = {
  id: "systems" | "papers" | "writing" | "compendium";
  label: string;
  href: string;
  count: number;
  items: { id: string; title: string; href: string; status?: "live" | "maintained" | "archived" }[];
};
export type PlacedNode = { ringId: RingInput["id"]; id: string; title: string; href: string; x: number; y: number; status?: string };
export type PlacedRing = { id: RingInput["id"]; label: string; href: string; count: number; r: number; nodes: PlacedNode[] };

export function layoutRings(rings: RingInput[], size: number, maxNodes = 24): PlacedRing[] {
  const c = size / 2;
  const inner = 0.22 * c;
  const step = rings.length > 1 ? (0.92 * c - inner) / (rings.length - 1) : 0;
  return rings.map((ring, i) => {
    const r = inner + i * step;
    const shown = ring.items.slice(0, maxNodes);
    const nodes = shown.map((item, j): PlacedNode => {
      const a = i * 0.5 + (j * 2 * Math.PI) / shown.length;
      return { ringId: ring.id, ...item, x: c + r * Math.cos(a), y: c + r * Math.sin(a) };
    });
    return { id: ring.id, label: ring.label, href: ring.href, count: ring.count, r, nodes };
  });
}
