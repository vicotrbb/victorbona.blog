"use client";

import { useState } from "react";
import type { PlacedRing } from "app/lib/rings";

// Event-display instrument. Strokes use --rule (3.9:1 on the ground); the minor
// graduations stay on --line-strong because they only texture the scale.
// Bloom (glow) is allowed here: this is the home hero.
// Lit = heavier: Martian Mono is variable, so the active track's weight animates.
const bloom = "drop-shadow(0 0 3px rgb(77 255 143 / 0.9)) drop-shadow(0 0 10px rgb(77 255 143 / 0.45))";
const css = `
.cp-ring { transition: opacity 240ms cubic-bezier(0.16, 1, 0.3, 1); }
.control-plane[data-active] .cp-ring:not([data-on]) { opacity: 0.28; }
.cp-orbit { fill: none; stroke: var(--rule); stroke-width: 1.25; transition: stroke 240ms, stroke-width 240ms; }
.cp-tick { fill: none; stroke: var(--line-strong); stroke-width: 5; }
.cp-tick-major { fill: none; stroke: var(--rule); stroke-width: 11; }
.cp-ring[data-on] .cp-orbit { stroke: var(--lit); stroke-width: 1.5; filter: ${bloom}; }
.cp-ring[data-on] .cp-tick-major { stroke: var(--lit); }
.cp-focus { display: none; fill: none; stroke: var(--lit); stroke-width: 1; stroke-dasharray: 3 3; }
.cp-ring[data-focus] .cp-orbit { stroke-width: 2; }
.cp-ring[data-focus] .cp-focus { display: inline; }
.cp-spoke { stroke: var(--line-strong); stroke-width: 1; }
.cp-pulse { display: none; }
.cp-node { fill: var(--bg); stroke: var(--rule); stroke-width: 1.5; transition: fill 160ms, stroke 160ms; }
.cp-ring[data-on] .cp-node { stroke: var(--lit); }
.control-plane a:hover .cp-node { fill: var(--lit); filter: ${bloom}; }
.cp-label { fill: var(--dim); font-size: 11px; font-weight: 400; letter-spacing: 0.02em; transition: fill 240ms, font-weight 240ms; }
.cp-count { fill: var(--text); }
.cp-ring[data-on] .cp-label, .cp-ring[data-on] .cp-count { fill: var(--lit); font-weight: 760; }
.cp-core { fill: var(--lit); filter: ${bloom}; }
.cp-reticle { fill: none; stroke: var(--rule); stroke-width: 1.25; }
.cp-compact .cp-orbit { stroke-width: 2.5; }
.cp-compact .cp-node { stroke-width: 3; }
.cp-compact .cp-reticle { stroke-width: 2.5; }
.cp-leader { fill: var(--text); font-size: 11px; font-weight: 600; }
.cp-role { fill: var(--lit); font-weight: 400; }
@media (prefers-reduced-motion: no-preference) {
  .cp-pulse {
    display: inline;
    stroke: var(--lit);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-dasharray: 10 110;
    stroke-dashoffset: 10;
    filter: ${bloom};
    animation: cp-beat 3.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
  }
  @keyframes cp-beat {
    0% { stroke-dashoffset: 10; }
    40%, 100% { stroke-dashoffset: -100; }
  }
}
`;

const nodeDash = { live: undefined, maintained: "2.4 1.8", archived: "0.8 2.2" } as const;

type Active = { ring: PlacedRing["id"]; node?: string; focus?: boolean } | null;

export function ControlPlane({ rings, size }: { rings: PlacedRing[]; size: number }) {
  const [active, setActive] = useState<Active>(null);
  const c = size / 2;
  const total = rings.reduce((sum, ring) => sum + ring.count, 0);
  const on = (ring: PlacedRing["id"], node?: string, focus?: boolean) => () => setActive({ ring, node, focus });
  const off = () => setActive(null);
  const current = rings.find((ring) => ring.id === active?.ring);
  const readout: [string, string | number][] = !current
    ? [["tracks", rings.length], ["objects", total]]
    : active?.node
      ? [["track", current.id], ["object", active.node]]
      : [["track", current.id], ["objects", current.count]];

  // compact: the mobile instrument, drawing only (the list below carries the links).
  const display = (compact: boolean) => (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      {...(compact
        ? { "aria-hidden": true, className: "cp-compact mx-auto block h-auto w-full max-w-[22rem] md:hidden" }
        : {
            role: "img",
            "aria-label": `Control plane: Victor Bona at the centre, with tracks for ${rings.map((r) => `${r.label} ${r.count}`).join(", ")}`,
            className: "hidden h-auto w-full font-mono md:block",
            onMouseLeave: off,
          })}
    >
      {rings.map((ring, i) => {
        const lead = ring.nodes[0];
        const isOn = !compact && active?.ring === ring.id;
        return (
          <g key={ring.id} className="cp-ring" data-on={isOn || undefined} data-focus={(isOn && active?.focus) || undefined}>
            {/* graduations: 72 minor and 12 major ticks per orbit, laid on a 360-unit path */}
            <circle className="cp-tick" cx={c} cy={c} r={ring.r} pathLength={360} strokeDasharray="0.35 4.65" />
            <circle className="cp-tick-major" cx={c} cy={c} r={ring.r} pathLength={360} strokeDasharray="0.6 29.4" />
            <circle className="cp-orbit" cx={c} cy={c} r={ring.r} />
            {!compact && (
              <>
                <circle className="cp-focus" cx={c} cy={c} r={ring.r - 8} />
                <circle className="cp-focus" cx={c} cy={c} r={ring.r + 8} />
              </>
            )}
            {lead && (
              <>
                <line className="cp-spoke" x1={c} y1={c} x2={lead.x} y2={lead.y} />
                <line className="cp-pulse" x1={c} y1={c} x2={lead.x} y2={lead.y} pathLength={100} style={{ animationDelay: `${i * 0.8}s` }} />
              </>
            )}
            {compact ? (
              ring.nodes.map((node) => (
                <circle key={node.id} className="cp-node" cx={node.x} cy={node.y} r={7} strokeDasharray={nodeDash[node.status as keyof typeof nodeDash]} />
              ))
            ) : (
              <>
                {/* wide transparent stroke: the orbit is too thin to hover */}
                <a href={ring.href} tabIndex={-1} onMouseEnter={on(ring.id)}>
                  <circle cx={c} cy={c} r={ring.r} fill="none" stroke="transparent" strokeWidth={16} />
                </a>
                {ring.nodes.map((node) => (
                  <a key={node.id} href={node.href} tabIndex={-1} onMouseEnter={on(ring.id, node.title)}>
                    <title>{node.title}</title>
                    <circle cx={node.x} cy={node.y} r={9} fill="transparent" />
                    <circle
                      className="cp-node"
                      cx={node.x}
                      cy={node.y}
                      r={4}
                      strokeDasharray={nodeDash[node.status as keyof typeof nodeDash]}
                      data-status={node.status}
                    />
                  </a>
                ))}
                <a href={ring.href} tabIndex={-1} onMouseEnter={on(ring.id)}>
                  <rect x={c - 70} y={c - ring.r - 9} width={140} height={18} fill="var(--bg)" />
                  <text className="cp-label" x={c} y={c - ring.r} textAnchor="middle" dominantBaseline="central">
                    {ring.label} <tspan className="cp-count">{ring.count}</tspan>
                  </text>
                </a>
              </>
            )}
          </g>
        );
      })}
      <circle className="cp-reticle" cx={c} cy={c} r={16} />
      <path className="cp-reticle" d={`M${c - 24} ${c}h6M${c + 18} ${c}h6M${c} ${c - 24}v6M${c} ${c + 18}v6`} />
      <rect className="cp-core" x={c - 6} y={c - 6} width={12} height={12} />
      {!compact && (
        // two lines so the label clears the innermost orbit's nodes
        <text className="cp-leader" x={c} y={c + 40} textAnchor="middle">
          victor-bona
          <tspan x={c} dy={14} className="cp-role">· leader</tspan>
        </text>
      )}
    </svg>
  );

  const cell = "flex items-baseline gap-2 px-3 py-2";
  return (
    <div className="control-plane" data-active={active?.ring}>
      <style>{css}</style>
      {display(false)}
      {display(true)}
      <div className="mx-auto mt-4 flex w-fit max-w-full flex-wrap justify-center divide-x divide-[var(--line)] border border-[var(--line)] bg-[var(--panel)] font-mono text-xs tabular-nums">
        <p className={cell}>
          <span className="text-[var(--dim)]">leader</span> <span className="text-[var(--text)]">victor-bona</span>
        </p>
        <p className={cell}>
          <span className="text-[var(--dim)]">status</span>{" "}
          <span className="font-semibold text-[var(--lit)] [text-shadow:0_0_10px_rgb(77_255_143/0.5)]">Ready</span>
        </p>
        {readout.map(([key, value]) => (
          <p key={key} aria-hidden="true" className={`${cell} hidden min-w-0 md:flex`}>
            <span className="text-[var(--dim)]">{key}</span>{" "}
            <span className="max-w-[16ch] truncate text-[var(--text)]">{value}</span>
          </p>
        ))}
      </div>
      <ol className="mt-6 border-t border-[var(--line)] font-mono text-sm md:sr-only">
        {rings.map((ring) => (
          <li key={ring.id} className="border-b border-[var(--line)]">
            <a
              href={ring.href}
              onFocus={on(ring.id, undefined, true)}
              onBlur={off}
              className="flex items-baseline justify-between gap-4 py-3 text-[var(--text)] transition-colors duration-150 hover:text-[var(--lit)]"
            >
              <span>{ring.label}</span>
              <span className="tabular-nums text-[var(--dim)]">{ring.count}</span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
