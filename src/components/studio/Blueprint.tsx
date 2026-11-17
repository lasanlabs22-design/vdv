"use client";

import { extent, tiers, type Floor, type Room, type TierId } from "@/lib/plans";
import { DOOR_W, doorSpan } from "./geometry";
import type { RoomState } from "./Scene";

const badge: Record<TierId, string> = { minimal: "M", signature: "S", premium: "P" };

/** Hinge point, along-wall and into-room unit vectors for a room's door. */
function doorFrame(r: Room) {
  const { start } = doorSpan(r);
  switch (r.door) {
    case "n": return { h: [r.x + start, r.z], u: [1, 0], v: [0, 1] };
    case "s": return { h: [r.x + start, r.z + r.d], u: [1, 0], v: [0, -1] };
    case "w": return { h: [r.x, r.z + start], u: [0, 1], v: [1, 0] };
    case "e": return { h: [r.x + r.w, r.z + start], u: [0, 1], v: [-1, 0] };
  }
}

function Door({ r }: { r: Room }) {
  const { h, u, v } = doorFrame(r);
  const g = [h[0] + u[0] * DOOR_W, h[1] + u[1] * DOOR_W];
  const l = [h[0] + v[0] * DOOR_W, h[1] + v[1] * DOOR_W];
  const sweep = u[0] * v[1] - u[1] * v[0] > 0 ? 0 : 1;
  return (
    <g className="bp-door">
      <line x1={h[0]} y1={h[1]} x2={g[0]} y2={g[1]} className="bp-gap" />
      <path d={`M${h[0]} ${h[1]}L${l[0]} ${l[1]}A${DOOR_W} ${DOOR_W} 0 0 ${sweep} ${g[0]} ${g[1]}`} />
    </g>
  );
}

export default function Blueprint({ floor, design, selected, onSelect, animKey }: { floor: Floor; design: Record<string, RoomState>; selected: string | null; onSelect: (id: string) => void; animKey: string }) {
  const { w, d } = extent(floor);
  const pad = 1;
  const fs = Math.max(w, d) / 32;

  return (
    <svg key={animKey} className="bp" viewBox={`${-pad} ${-pad} ${w + pad * 2} ${d + pad * 2}`} role="group" aria-label={`${floor.name} floor plan. Select a room to customise it.`}>
      <defs>
        <pattern id="bp-grid" width="0.5" height="0.5" patternUnits="userSpaceOnUse">
          <path d="M0.5 0H0V0.5" className="bp-grid-line" />
        </pattern>
      </defs>
      <rect x={-pad} y={-pad} width={w + pad * 2} height={d + pad * 2} fill="url(#bp-grid)" />

      <g className="bp-dim" style={{ fontSize: fs * 0.85 }}>
        <line x1={0} y1={-0.5} x2={w} y2={-0.5} />
        <line x1={0} y1={-0.62} x2={0} y2={-0.38} />
        <line x1={w} y1={-0.62} x2={w} y2={-0.38} />
        <text x={w / 2} y={-0.62}>{w.toFixed(1)} m</text>
        <line x1={-0.5} y1={0} x2={-0.5} y2={d} />
        <line x1={-0.62} y1={0} x2={-0.38} y2={0} />
        <line x1={-0.62} y1={d} x2={-0.38} y2={d} />
        <text x={-0.62} y={d / 2} transform={`rotate(-90 ${-0.62} ${d / 2})`}>{d.toFixed(1)} m</text>
      </g>

      {floor.rooms.map((r, i) => {
        const tier = design[r.id].tier;
        const sel = r.id === selected;
        // Serif capitals run about 0.8em wide: shrink the label until it fits inside the room.
        const nameSize = Math.min(fs, (r.w * 1.1) / Math.max(4, r.name.length));
        return (
          <g
            key={r.id}
            className={`bp-room tier-${tier}${sel ? " is-sel" : ""}`}
            style={{ "--i": i } as React.CSSProperties}
            onClick={() => onSelect(r.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(r.id))}
            role="button"
            tabIndex={0}
            aria-pressed={sel}
            aria-label={`${r.name}, ${r.w} by ${r.d} metres, ${tiers[tier].label}`}
          >
            <rect x={r.x} y={r.z} width={r.w} height={r.d} className="bp-fill" />
            <rect x={r.x} y={r.z} width={r.w} height={r.d} className="bp-wall" pathLength={100} />
            <text x={r.x + r.w / 2} y={r.z + r.d / 2} className="bp-name" style={{ fontSize: nameSize }}>{r.name}</text>
            {r.d > 1.3 && <text x={r.x + r.w / 2} y={r.z + r.d / 2 + nameSize * 1.25} className="bp-size" style={{ fontSize: nameSize * 0.72 }}>{r.w} × {r.d} m</text>}
            <circle cx={r.x + 0.32} cy={r.z + 0.32} r={0.2} className="bp-badge" />
            <text x={r.x + 0.32} y={r.z + 0.33} className="bp-badge-t" style={{ fontSize: 0.22 }}>{badge[tier]}</text>
          </g>
        );
      })}
      {floor.rooms.map((r) => <Door key={r.id} r={r} />)}
    </svg>
  );
}
