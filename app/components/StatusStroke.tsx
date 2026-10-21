export type Status = "live" | "maintained" | "archived";

const strokes: Record<Status, string> = {
  live: "border-solid border-[var(--lit)]",
  maintained: "border-dashed border-[var(--line-strong)]",
  archived: "border-dotted border-[var(--line-strong)]",
};

export function StatusStroke({ status }: { status: Status }) {
  return <span aria-hidden="true" data-status={status} className={`block w-full border-t ${strokes[status]}`} />;
}
