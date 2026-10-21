"use client";

import { useState } from "react";
import type { PlacedRing } from "app/lib/rings";

// Lit = heavier: Martian Mono is variable, so the active track's weight animates.
const css = `
.cp-ring { transition: opacity 240ms cubic-bezier(0.16, 1, 0.3, 1); }
.control-plane[data-active] .cp-ring:not([data-on]) { opacity: 0.3; }
.cp-orbit { stroke: var(--line); stroke-width: 1; transition: stroke 240ms; }
.cp-ring[data-on] .cp-orbit { stroke: var(--lit); }
.cp-spoke { stroke: var(--line); stroke-width: 1; }
.cp-pulse { display: none; }
.cp-node { fill: var(--bg); stroke: var(--line-strong); stroke-width: 1.2; transition: fill 160ms, stroke 160ms; }
.cp-ring[data-on] .cp-node { stroke: var(--lit); }
.control-plane a:hover .cp-node { fill: var(--lit); }
.cp-label { fill: var(--dim); font-size: 11px; font-weight: 400; letter-spacing: 0.02em; transition: fill 240ms, font-weight 240ms; }
.cp-count { fill: var(--text); }
.cp-ring[data-on] .cp-label, .cp-ring[data-on] .cp-count { fill: var(--lit); font-weight: 760; }
.cp-core { fill: var(--lit); filter: drop-shadow(0 0 6px rgb(77 255 143 / 0.7)); }
.cp-leader { fill: var(--text); font-size: 11px; font-weight: 600; }
.cp-role { fill: var(--lit); font-weight: 400; }
@media (prefers-reduced-motion: no-preference) {
  .cp-pulse {
    display: inline;
    stroke: var(--lit);
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-dasharray: 10 110;
    stroke-dashoffset: 10;
    filter: drop-shadow(0 0 3px rgb(77 255 143 / 0.8));
    animation: cp-beat 3.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
  }
  @keyframes cp-beat {
    0% { stroke-dashoffset: 10; }
    40%, 100% { stroke-dashoffset: -100; }
  }
}
`;

const nodeDash = { live: undefined, maintained: "2 1.6", archived: "0.6 2" } as const;

type Active = { ring: PlacedRing["id"]; node?: string } | null;

export function ControlPlane({ rings, size }: { rings: PlacedRing[]; size: number }) {
  const [active, setActive] = useState<Active>(null);
  const c = size / 2;
  const total = rings.reduce((sum, ring) => sum + ring.count, 0);
  const on = (ring: PlacedRing["id"], node?: string) => () => setActive({ ring, node });
  const off = () => setActive(null);
  const current = rings.find((ring) => ring.id === active?.ring);
  const readout = !current
    ? `tracks: ${rings.length} · objects: ${total}`
    : active?.node
      ? `${current.id}/${active.node}`
      : `track: ${current.id} · ${current.count} objects`;

  return (
    <div className="control-plane" data-active={active?.ring}>
      <style>{css}</style>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Control plane: Victor Bona at the centre, with tracks for ${rings.map((r) => `${r.label} ${r.count}`).join(", ")}`}
        className="hidden h-auto w-full font-mono md:block"
        onMouseLeave={off}
      >
        {rings.map((ring, i) => {
          const lead = ring.nodes[0];
          return (
            <g key={ring.id} className="cp-ring" data-on={active?.ring === ring.id || undefined}>
              <circle className="cp-orbit" cx={c} cy={c} r={ring.r} fill="none" />
              {lead && (
                <>
                  <line className="cp-spoke" x1={c} y1={c} x2={lead.x} y2={lead.y} />
                  <line className="cp-pulse" x1={c} y1={c} x2={lead.x} y2={lead.y} pathLength={100} style={{ animationDelay: `${i * 0.8}s` }} />
                </>
              )}
              {/* wide transparent stroke: the 1px orbit is too thin to hover */}
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
                    r={3.5}
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
            </g>
          );
        })}
        <rect className="cp-core" x={c - 6} y={c - 6} width={12} height={12} />
        {/* two lines so the label clears the innermost orbit's nodes */}
        <text className="cp-leader" x={c} y={c + 24} textAnchor="middle">
          victor-bona
          <tspan x={c} dy={14} className="cp-role">· leader</tspan>
        </text>
      </svg>
      <p aria-hidden="true" className="mt-3 hidden truncate font-mono text-xs text-[var(--dim)] md:block">
        {readout}
      </p>
      <ol className="border-t border-[var(--line)] font-mono text-sm md:sr-only">
        {rings.map((ring) => (
          <li key={ring.id} className="border-b border-[var(--line)]">
            <a
              href={ring.href}
              onFocus={on(ring.id)}
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
