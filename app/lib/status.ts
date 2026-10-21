// Pure module: imported directly by node in tests, so no next/* or path aliases.
const strokes: Record<string, "live" | "maintained" | "archived"> = {
  completed: "live",
  "in-progress": "live",
  maintained: "maintained",
  stopped: "archived",
  published: "live",
  preprint: "live",
  "independently published": "live",
};

export function toStroke(status: string): "live" | "maintained" | "archived" {
  return strokes[status] ?? "maintained";
}
