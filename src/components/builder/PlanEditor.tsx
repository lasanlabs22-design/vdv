"use client";

import { useRef } from "react";
import type { Side } from "@/lib/plans";
import { clashes, openings, type BRoom, type Project } from "@/lib/builder";

type Drag = { id: string; mode: "move" | Side | "se"; sx: number; sz: number; room: BRoom };

const MIN = 4;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Position along a wall, in plan feet, for a point `c` feet from the wall's west or north end. */
function along(r: BRoom, side: Side, c: number): [number, number] {
  if (side === "n") return [r.x + c, r.z];
  if (side === "s") return [r.x + c, r.z + r.d];
  if (side === "w") return [r.x, r.z + c];
  return [r.x + r.w, r.z + c];
}

export default function PlanEditor(props: {
  project: Project; floor: number; selected: string | null;
  onSelect: (id: string | null) => void; onChange: (id: string, patch: Partial<BRoom>) => void; onRemove: (id: string) => void;
}) {
  const { project, floor, selected } = props;
  const { w: W, d: D } = project.plot;
  const rooms = project.floors[floor];
  const below = floor > 0 ? project.floors[floor - 1] : [];
  const bad = clashes(rooms);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const pad = 5;
  const hs = Math.max(W, D) / 55;

  const toPlan = (e: React.PointerEvent) => {
    const m = svg.current!.getScreenCTM()!.inverse();
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
    return { x: p.x, z: p.y };
  };

  const start = (e: React.PointerEvent, r: BRoom, mode: Drag["mode"]) => {
    e.stopPropagation();
    props.onSelect(r.id);
    const p = toPlan(e);
    drag.current = { id: r.id, mode, sx: p.x, sz: p.z, room: r };
    svg.current!.setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent) => {
    const g = drag.current;
    if (!g) return;
    const p = toPlan(e);
    const dx = Math.round(p.x - g.sx), dz = Math.round(p.z - g.sz);
    const r = g.room;
    if (g.mode === "move") return props.onChange(g.id, { x: clamp(r.x + dx, 0, W - r.w), z: clamp(r.z + dz, 0, D - r.d) });
    const patch: Partial<BRoom> = {};
    if (g.mode === "e" || g.mode === "se") patch.w = clamp(r.w + dx, MIN, W - r.x);
    if (g.mode === "s" || g.mode === "se") patch.d = clamp(r.d + dz, MIN, D - r.z);
    if (g.mode === "w") {
      const x = clamp(r.x + dx, 0, r.x + r.w - MIN);
      Object.assign(patch, { x, w: r.w + (r.x - x) });
    }
    if (g.mode === "n") {
      const z = clamp(r.z + dz, 0, r.z + r.d - MIN);
      Object.assign(patch, { z, d: r.d + (r.z - z) });
    }
    props.onChange(g.id, patch);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const r = rooms.find((x) => x.id === selected);
    if (!r) return;
    const step: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (step[e.key]) {
      e.preventDefault();
      props.onChange(r.id, { x: clamp(r.x + step[e.key][0], 0, W - r.w), z: clamp(r.z + step[e.key][1], 0, D - r.d) });
    }
    if (e.key === "Delete" || e.key === "Backspace") props.onRemove(r.id);
    if (e.key === "Escape") props.onSelect(null);
  };

  const front: Record<Side, { x: number; y: number; rot: number }> = {
    n: { x: W / 2, y: -2.2, rot: 0 },
    s: { x: W / 2, y: D + 3.2, rot: 0 },
    e: { x: W + 2.6, y: D / 2, rot: 90 },
    w: { x: -2.6, y: D / 2, rot: -90 },
  };
  const f = front[project.facing];
  const sel = rooms.find((r) => r.id === selected);

  return (
    <svg
      ref={svg}
      className="pe"
      viewBox={`${-pad} ${-pad} ${W + pad * 2} ${D + pad * 2}`}
      onPointerMove={move}
      onPointerUp={() => (drag.current = null)}
      onPointerDown={() => props.onSelect(null)}
      onKeyDown={onKey}
      tabIndex={0}
      role="application"
      aria-label={`Plot ${W} by ${D} feet. Drag rooms to move them, drag the handles to resize, arrow keys nudge the selected room.`}
      style={{ fontSize: Math.max(W, D) / 34 }}
    >
      <defs>
        <pattern id="pe-grid" width="1" height="1" patternUnits="userSpaceOnUse">
          <path d="M1 0H0V1" className="pe-grid-minor" />
        </pattern>
        <pattern id="pe-grid5" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M5 0H0V5" className="pe-grid-major" />
        </pattern>
      </defs>
      <rect x={0} y={0} width={W} height={D} className="pe-plot" />
      <rect x={0} y={0} width={W} height={D} fill="url(#pe-grid)" />
      <rect x={0} y={0} width={W} height={D} fill="url(#pe-grid5)" />

      <text x={W / 2} y={-1} className="pe-dim">{W} ft</text>
      <text x={-1} y={D / 2} className="pe-dim" transform={`rotate(-90 ${-1} ${D / 2})`}>{D} ft</text>
      <text x={f.x} y={f.y} className="pe-road" transform={`rotate(${f.rot} ${f.x} ${f.y})`}>ROAD · FRONT</text>
      <g transform={`translate(${W + 2.2} ${-2.6})`} className="pe-north">
        <path d="M0 -1.4L0.7 0.8L0 0.3L-0.7 0.8Z" />
        <text y={2.2}>N</text>
      </g>

      {below.map((r) => <rect key={r.id} x={r.x} y={r.z} width={r.w} height={r.d} className="pe-below" />)}

      {rooms.map((r) => (
        <g key={r.id} className={`pe-room${r.id === selected ? " is-sel" : ""}${bad.has(r.id) ? " is-clash" : ""}`} onPointerDown={(e) => start(e, r, "move")}>
          <rect x={r.x} y={r.z} width={r.w} height={r.d} className="pe-fill" style={r.floor ? { fill: r.floor, fillOpacity: 0.35 } : undefined} />
          <rect x={r.x} y={r.z} width={r.w} height={r.d} className="pe-wall" />
          <text x={r.x + r.w / 2} y={r.z + r.d / 2} className="pe-name" style={{ fontSize: `${Math.min(1, (r.w * 1.4) / Math.max(6, r.name.length))}em` }}>{r.name}</text>
          {r.d >= 6 && <text x={r.x + r.w / 2} y={r.z + r.d / 2 + 1.3} className="pe-size">{r.w}′ × {r.d}′</text>}
        </g>
      ))}

      {rooms.map((r) =>
        openings(r, rooms).map((o, i) => {
          const a = along(r, o.side, o.c - o.w / 2), b = along(r, o.side, o.c + o.w / 2);
          return <line key={`${r.id}-${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className={`pe-open pe-open--${o.type}`} />;
        }),
      )}

      {rooms.map((r) => {
        const len = r.door === "n" || r.door === "s" ? r.w : r.d;
        const c = Math.max(1.6, Math.min(len - 1.6, len * r.at));
        const a = along(r, r.door, c - 1.5), b = along(r, r.door, c + 1.5);
        return <line key={`door-${r.id}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="pe-door" />;
      })}

      {sel && (
        <g className="pe-handles">
          {([
            ["n", sel.x + sel.w / 2, sel.z],
            ["s", sel.x + sel.w / 2, sel.z + sel.d],
            ["w", sel.x, sel.z + sel.d / 2],
            ["e", sel.x + sel.w, sel.z + sel.d / 2],
            ["se", sel.x + sel.w, sel.z + sel.d],
          ] as [Drag["mode"], number, number][]).map(([m, x, z]) => (
            <rect key={m} x={x - hs} y={z - hs} width={hs * 2} height={hs * 2} className={`pe-handle pe-handle--${m}`} onPointerDown={(e) => start(e, sel, m)} />
          ))}
        </g>
      )}
    </svg>
  );
}
