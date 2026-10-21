import { StatusStroke, type Status } from "./StatusStroke";

export type StatusRow = { name: string; href: string; kind: "system" | "paper" | "post"; status: Status; updated: string };

const statusText: Record<Status, string> = {
  live: "text-[var(--lit)]",
  maintained: "text-[var(--text)]",
  archived: "text-[var(--dim)]",
};

export function StatusTable({ rows }: { rows: StatusRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="!table w-full !whitespace-normal border-collapse font-mono text-xs sm:text-sm">
        <thead>
          <tr className="text-left text-[var(--dim)]">
            <th scope="col" className="py-2 pr-4 font-normal">NAME</th>
            <th scope="col" className="hidden py-2 pr-4 font-normal sm:table-cell">KIND</th>
            <th scope="col" className="py-2 pr-4 font-normal">STATUS</th>
            <th scope="col" className="py-2 text-right font-normal">UPDATED</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.kind}:${row.href}:${row.name}`} className="border-t border-[var(--line)] align-baseline">
              <td className="py-3 pr-4">
                <a href={row.href} className="font-sans text-sm text-[var(--text)] decoration-[var(--lit)] decoration-1 underline-offset-4 hover:underline sm:text-base">
                  {row.name}
                </a>
              </td>
              <td className="hidden py-3 pr-4 text-[var(--dim)] sm:table-cell">{row.kind}</td>
              <td className="py-3 pr-4">
                <span className="flex items-center gap-2">
                  <span className="w-6 shrink-0"><StatusStroke status={row.status} /></span>
                  <span className={statusText[row.status]}>{row.status}</span>
                </span>
              </td>
              <td className="whitespace-nowrap py-3 text-right tabular-nums text-[var(--dim)]">{row.updated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
