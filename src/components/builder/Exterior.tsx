"use client";

import { createContext, useContext, useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import Vehicle from "../studio/Vehicle";
import { floorMap } from "../studio/surfaces";
import * as THREE from "three";
import type { Side } from "@/lib/plans";
import { FT, exteriorSides, openings, type BRoom, type Elevation, type Project } from "@/lib/builder";

// The whole project as a building, assembled stage by stage along a construction timeline.
// Timeline stages: 0 plot, 1 foundation, 2.. one per floor, then roof, elevation, landscape, lights.

export type TimelineRef = React.RefObject<{ t: number }>;
const TL = createContext<TimelineRef | null>(null);

const PLINTH = 0.45, H = 3.0, SLAB = 0.15, T = 0.2;
const ease = (p: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 3);

type V3 = [number, number, number];
type MatKey =
  | "paint" | "accent" | "trim" | "plinth" | "slab" | "glass" | "frame" | "teak" | "stone" | "granite" | "brass" | "ms"
  | "railGlass" | "coping" | "terracotta" | "dirt" | "grass" | "paving" | "leaf" | "bark" | "lamp" | "marker";
type Part = { pos: V3; size: V3; mat: MatKey; rot?: V3; shape?: "box" | "cyl" | "torus" | "ico" };

type M = { x: number; z: number; w: number; d: number };

/** A box against a wall: `a`..`b` metres along `side`, `y0`..`y1` high, `t` thick, pushed `out` metres outwards. */
function wallBox(r: M, side: Side, a: number, b: number, y0: number, y1: number, t = T, out = 0): { pos: V3; size: V3 } {
  const mid = (a + b) / 2, l = b - a, h = y1 - y0, y = y0 + h / 2, off = t / 2 - out;
  switch (side) {
    case "n": return { pos: [r.x + mid, y, r.z + off], size: [l, h, t] };
    case "s": return { pos: [r.x + mid, y, r.z + r.d - off], size: [l, h, t] };
    case "w": return { pos: [r.x + off, y, r.z + mid], size: [t, h, l] };
    case "e": return { pos: [r.x + r.w - off, y, r.z + mid], size: [t, h, l] };
  }
}

const lengthOf = (r: M, side: Side) => (side === "n" || side === "s" ? r.w : r.d);
/** Point `c` metres along a side, on the wall's outer face. */
const pointOn = (r: M, side: Side, c: number): [number, number] =>
  side === "n" ? [r.x + c, r.z] : side === "s" ? [r.x + c, r.z + r.d] : side === "w" ? [r.x, r.z + c] : [r.x + r.w, r.z + c];
const wallRot = (side: Side): V3 => [0, side === "e" || side === "w" ? Math.PI / 2 : 0, 0];

function makeMaterials(e: Elevation) {
  const std = (color: string, roughness = 0.85, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  const gold = (hex: string) => ["#d9a441", "#c9a24c"].includes(hex.toLowerCase());
  return {
    paint: std("#a9a59e", 0.92, 0, { bumpMap: floorMap("tile", 2, 2), bumpScale: 0.009 }),
    accent: std(e.accent, 0.7),
    trim: std(e.trim, gold(e.trim) ? 0.32 : 0.5, gold(e.trim) ? 0.8 : 0.1),
    plinth: std("#6f655a", 0.95),
    slab: std("#b3aea6", 0.9),
    glass: std("#496778", 0.08, 0.7, { emissive: new THREE.Color("#ffcf86"), emissiveIntensity: 0 }),
    frame: std("#2b2b2b", 0.4, 0.3),
    teak: std("#6b4426", 0.55, 0, { map: floorMap("wood", 2, 3) }),
    stone: std("#a1907a", 0.95, 0, { map: floorMap("tile", 3, 2), bumpMap: floorMap("tile", 3, 2), bumpScale: 0.04 }),
    granite: std("#2a2725", 0.25, 0.1, { map: floorMap("marble", 2, 2) }),
    brass: std("#c9a24c", 0.3, 0.85),
    ms: std("#1d1d1f", 0.5, 0.4),
    railGlass: std("#bfe0ea", 0.05, 0.1, { transparent: true, opacity: 0.3 }),
    coping: std("#efe9df", 0.6),
    terracotta: std("#a8553a", 0.8),
    dirt: std("#8a6e4f", 1),
    grass: std("#6f8f4a", 0.95),
    paving: std("#c9bca8", 0.8),
    leaf: std("#55753a", 0.9, 0, { flatShading: true }),
    bark: std("#5a3f2a", 0.9),
    lamp: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.3, 0.2), toneMapped: false }),
    marker: new THREE.MeshBasicMaterial({ color: "#e0b85a" }),
  } satisfies Record<MatKey, THREE.Material>;
}

/** Everything the building is made of, grouped by timeline stage. All lengths in metres, plot centred on the origin. */
function assemble(p: Project) {
  const e = p.elevation;
  const PW = p.plot.w * FT, PD = p.plot.d * FT;
  const toM = (r: BRoom): M & { src: BRoom } => ({ x: r.x * FT - PW / 2, z: r.z * FT - PD / 2, w: r.w * FT, d: r.d * FT, src: r });
  const n = p.floors.length;
  const floors: Part[][] = [];
  const elevation: Part[][] = Array.from({ length: n }, () => []);
  const roof: Part[][] = Array.from({ length: n }, () => []);
  const foundation: Part[] = [];
  const landscape: Part[] = [];
  const box = (list: Part[], b: { pos: V3; size: V3 }, mat: MatKey, rot?: V3) => list.push({ ...b, mat, rot });

  for (const r of p.floors[0] ?? []) {
    const m = toM(r);
    box(foundation, { pos: [m.x + m.w / 2, PLINTH / 2, m.z + m.d / 2], size: [m.w + 0.1, PLINTH, m.d + 0.1] }, "plinth");
  }

  // Set inside the loop below; typed explicitly so TypeScript does not narrow it to null.
  let mainDoor = null as [number, number] | null;

  p.floors.forEach((rooms, k) => {
    const parts: Part[] = [];
    const up = p.floors[k + 1] ?? [];
    const frontRooms = rooms.filter((r) => exteriorSides(r, rooms)[p.facing]);

    for (const r of rooms) {
      const m = toM(r);
      const ext = exteriorSides(r, rooms);
      const ops = openings(r, rooms).map(o => k > 0 && o.type === "door" ? { ...o, type: "window" as const } : o);
      const top = H - SLAB;

      // Slab over the room, and a floor slab under rooms on upper floors.
      box(parts, { pos: [m.x + m.w / 2, H - SLAB / 2, m.z + m.d / 2], size: [m.w, SLAB, m.d] }, "slab");
      if (k > 0) box(parts, { pos: [m.x + m.w / 2, -SLAB / 2, m.z + m.d / 2], size: [m.w, SLAB, m.d] }, "slab");

      // Roof parapet where nothing is built above.
      const covered = up.reduce((s, o) => s + Math.max(0, Math.min(r.x + r.w, o.x + o.w) - Math.max(r.x, o.x)) * Math.max(0, Math.min(r.z + r.d, o.z + o.d) - Math.max(r.z, o.z)), 0);
      const open = covered < (r.w * r.d) / 2;

      for (const side of ["n", "s", "e", "w"] as Side[]) {
        if (!ext[side]) continue;
        const len = lengthOf(m, side);

        if (open) {
          box(roof[k], wallBox(m, side, 0, len, H, H + 0.9, 0.15), "paint");
          if (e.parapet === "plain") box(elevation[k], wallBox(m, side, 0, len, H + 0.9, H + 0.96, 0.24, 0.045), "coping");
          if (e.parapet === "band") box(elevation[k], wallBox(m, side, 0, len, H + 0.82, H + 0.98, 0.2, 0.03), "accent");
          if (e.parapet === "frieze") {
            box(elevation[k], wallBox(m, side, 0, len, H + 0.9, H + 0.98, 0.24, 0.045), "trim");
            for (let c = 0.2; c < len - 0.1; c += 0.36) box(elevation[k], wallBox(m, side, c - 0.07, c + 0.07, H + 0.7, H + 0.82, 0.1, 0.06), "accent");
          }
        }

        if (r.kind === "balcony") {
          box(parts, wallBox(m, side, 0, len, 0, 0.15, 0.2), "paint");
          const rail = e.railing === "glass" ? "railGlass" : e.railing;
          if (e.railing === "glass") box(elevation[k], wallBox(m, side, 0, len, 0.15, 1.05, 0.03, -0.05), "railGlass");
          else for (let c = 0.06; c < len; c += 0.13) box(elevation[k], wallBox(m, side, c - 0.012, c + 0.012, 0.15, 1.05, 0.025, -0.06), rail as MatKey);
          box(elevation[k], wallBox(m, side, 0, len, 1.05, 1.1, 0.06, -0.04), e.railing === "glass" ? "trim" : (rail as MatKey));
          continue;
        }

        if (r.kind === "porch") {
          const count = Math.max(2, Math.round(len / 3) + 1);
          for (let i = 0; i < count; i++) {
            const c = 0.15 + ((len - 0.3) * i) / (count - 1);
            const [px, pz] = pointOn(m, side, c);
            const inX = side === "e" ? -0.18 : side === "w" ? 0.18 : 0, inZ = side === "s" ? -0.18 : side === "n" ? 0.18 : 0;
            if (e.style === "traditional") {
              parts.push({ pos: [px + inX, top / 2, pz + inZ], size: [0.16, top, 0.16], mat: "paint", shape: "cyl" });
              box(elevation[k], { pos: [px + inX, top - 0.12, pz + inZ], size: [0.42, 0.18, 0.42] }, "trim");
              box(elevation[k], { pos: [px + inX, 0.1, pz + inZ], size: [0.42, 0.2, 0.42] }, "trim");
            } else box(parts, { pos: [px + inX, top / 2, pz + inZ], size: [0.25, top, 0.25] }, "paint");
          }
          continue;
        }

        // A solid wall, cut for its door and windows.
        const cuts = ops.filter((o) => o.side === side).map((o) => {
          const c = o.c * FT, w = o.w * FT;
          const [sill, head] = o.type === "door" ? [0, 2.2] : o.type === "vent" ? [1.6, 2.1] : [0.6, 2.4];
          return { a: c - w / 2, b: c + w / 2, sill, head, type: o.type };
        }).sort((x, y) => x.a - y.a);
        const clad = e.cladding !== "none" && side === p.facing && frontRooms.indexOf(r) % 2 === 0;
        let at = 0;
        const solid = (a: number, b: number) => {
          if (b - a < 0.02) return;
          box(parts, wallBox(m, side, a, b, 0, top), "paint");
          if (clad) {
            box(elevation[k], wallBox(m, side, a, b, 0, top, 0.03, 0.03), e.cladding === "wood" ? "teak" : (e.cladding as MatKey));
            if (e.cladding === "wood") for (let c = a + 0.1; c < b - 0.05; c += 0.22) box(elevation[k], wallBox(m, side, c - 0.025, c + 0.025, 0, top, 0.12, 0.15), "teak");
          }
        };
        for (const o of cuts) {
          solid(at, o.a);
          if (o.sill > 0) box(parts, wallBox(m, side, o.a, o.b, 0, o.sill), "paint");
          box(parts, wallBox(m, side, o.a, o.b, o.head, top), "paint");
          const el = elevation[k];
          if (o.type === "door") {
            box(el, wallBox(m, side, o.a + 0.05, o.b - 0.05, 0, o.head - 0.03, 0.06, -T / 2 + 0.03), "teak");
            box(el, wallBox(m, side, o.b - 0.25, o.b - 0.2, 1.0, 1.25, 0.04, 0.0), "brass");
            if (k === 0 && side === p.facing) mainDoor = pointOn(m, side, (o.a + o.b) / 2);
          } else {
            box(el, wallBox(m, side, o.a, o.b, o.sill, o.head, 0.04, -T / 2 + 0.02), "glass");
            const fm: MatKey = e.windows === "wood" ? "teak" : e.windows === "arched" ? "trim" : "frame";
            box(el, wallBox(m, side, o.a - 0.05, o.b + 0.05, o.sill - 0.05, o.sill, T + 0.04, 0.02), fm);
            box(el, wallBox(m, side, o.a - 0.05, o.b + 0.05, o.head, o.head + 0.05, T + 0.04, 0.02), fm);
            box(el, wallBox(m, side, o.a - 0.05, o.a, o.sill, o.head, T + 0.04, 0.02), fm);
            box(el, wallBox(m, side, o.b, o.b + 0.05, o.sill, o.head, T + 0.04, 0.02), fm);
          }
          // Sunshades: a slim concrete chajja, or a sloped terracotta canopy in the traditional style.
          if (o.type !== "vent") {
            if (e.style === "traditional") {
              const c = wallBox(m, side, o.a - 0.3, o.b + 0.3, o.head + 0.2, o.head + 0.28, 0.6, 0.6);
              const tilt = 0.32;
              const rot: V3 = side === "n" ? [-tilt, 0, 0] : side === "s" ? [tilt, 0, 0] : side === "e" ? [0, 0, -tilt] : [0, 0, tilt];
              el.push({ ...c, mat: "terracotta", rot });
            } else box(el, wallBox(m, side, o.a - 0.2, o.b + 0.2, o.head + 0.12, o.head + 0.2, 0.5, 0.5), "slab");
          }
          if (e.windows === "arched" && o.type !== "vent") {
            const [cx, cz] = pointOn(m, side, (o.a + o.b) / 2);
            const outX = side === "e" ? 0.03 : side === "w" ? -0.03 : 0, outZ = side === "s" ? 0.03 : side === "n" ? -0.03 : 0;
            el.push({ pos: [cx + outX, o.head + 0.06, cz + outZ], size: [(o.b - o.a) / 2, 0.05, 0], mat: "trim", shape: "torus", rot: wallRot(side) });
          }
          at = o.b;
        }
        solid(at, len);

        // Traditional verandah pillars along the ground floor front.
        if (e.style === "traditional" && k === 0 && side === p.facing) {
          for (const c of [0.3, len - 0.3]) {
            const [px, pz] = pointOn(m, side, c);
            const outX = side === "e" ? 0.45 : side === "w" ? -0.45 : 0, outZ = side === "s" ? 0.45 : side === "n" ? -0.45 : 0;
            elevation[k].push({ pos: [px + outX, top / 2, pz + outZ], size: [0.14, top, 0.14], mat: "coping", shape: "cyl" });
            box(elevation[k], { pos: [px + outX, top - 0.1, pz + outZ], size: [0.36, 0.16, 0.36] }, "trim");
          }
        }
      }
    }
    floors.push(parts);
  });

  // Indo-modern teak pergola over the largest open roof.
  if (e.style === "indo") {
    const k = n - 1;
    const top = [...p.floors[k]].sort((a, b) => b.w * b.d - a.w * a.d)[0];
    if (top) {
      const m = toM(top);
      const y = H + 2.4;
      for (const [px, pz] of [[m.x + 0.3, m.z + 0.3], [m.x + m.w - 0.3, m.z + 0.3], [m.x + 0.3, m.z + m.d - 0.3], [m.x + m.w - 0.3, m.z + m.d - 0.3]])
        box(elevation[k], { pos: [px, H + 1.2, pz], size: [0.15, 2.4, 0.15] }, "teak");
      for (let x = m.x + 0.3; x <= m.x + m.w - 0.3; x += 0.45) box(elevation[k], { pos: [x, y, m.z + m.d / 2], size: [0.08, 0.16, m.d - 0.4] }, "teak");
      for (const z of [m.z + 0.3, m.z + m.d - 0.3]) box(elevation[k], { pos: [m.x + m.w / 2, y - 0.14, z], size: [m.w - 0.4, 0.14, 0.12] }, "teak");
    }
  }

  // Landscape: lawn, a paved path from the gate, compound wall with the gate on the road side, and trees.
  box(landscape, { pos: [0, 0.01, 0], size: [PW, 0.02, PD] }, "grass");
  const front = p.facing;
  const gateW = Math.min(3.6, (front === "n" || front === "s" ? PW : PD) - 1);
  const wallH = 1.3;
  const sides: Record<Side, { pos: V3; len: number; along: "x" | "z" }> = {
    n: { pos: [0, 0, -PD / 2 + 0.1], len: PW, along: "x" },
    s: { pos: [0, 0, PD / 2 - 0.1], len: PW, along: "x" },
    w: { pos: [-PW / 2 + 0.1, 0, 0], len: PD, along: "z" },
    e: { pos: [PW / 2 - 0.1, 0, 0], len: PD, along: "z" },
  };
  const gateC = mainDoor ? (sides[front].along === "x" ? mainDoor[0] : mainDoor[1]) : 0;
  const gc = Math.max(-sides[front].len / 2 + gateW / 2 + 0.3, Math.min(sides[front].len / 2 - gateW / 2 - 0.3, gateC));
  for (const s of ["n", "s", "e", "w"] as Side[]) {
    const { pos, len, along } = sides[s];
    const runs: [number, number][] = s === front ? [[-len / 2, gc - gateW / 2], [gc + gateW / 2, len / 2]] : [[-len / 2, len / 2]];
    for (const [a, b] of runs) {
      if (b - a < 0.1) continue;
      const mid = (a + b) / 2;
      const size: V3 = along === "x" ? [b - a, wallH, 0.2] : [0.2, wallH, b - a];
      const p3: V3 = along === "x" ? [mid, wallH / 2, pos[2]] : [pos[0], wallH / 2, mid];
      box(landscape, { pos: p3, size }, "paint");
      box(landscape, { pos: [p3[0], wallH + 0.03, p3[2]], size: along === "x" ? [b - a, 0.06, 0.28] : [0.28, 0.06, b - a] }, "coping");
    }
    if (s === front) {
      for (const c of [gc - gateW / 2 - 0.2, gc + gateW / 2 + 0.2]) {
        const pp: V3 = along === "x" ? [c, 0.9, pos[2]] : [pos[0], 0.9, c];
        box(landscape, { pos: pp, size: [0.4, 1.8, 0.4] }, e.style === "traditional" ? "stone" : "paint");
        box(landscape, { pos: [pp[0], 1.88, pp[2]], size: [0.22, 0.18, 0.22] }, "lamp");
      }
      const gm: MatKey = e.gate === "slats" ? "teak" : e.gate === "ms" ? "ms" : "brass";
      const step = e.gate === "slats" ? 0.16 : 0.12;
      for (let c = gc - gateW / 2 + 0.06; c < gc + gateW / 2 - 0.03; c += step) {
        const pp: V3 = along === "x" ? [c, 0.85, pos[2]] : [pos[0], 0.85, c];
        box(landscape, { pos: pp, size: along === "x" ? [e.gate === "slats" ? 0.11 : 0.03, 1.5, 0.05] : [0.05, 1.5, e.gate === "slats" ? 0.11 : 0.03] }, gm);
      }
      for (const y of [0.25, 1.55]) box(landscape, { pos: along === "x" ? [gc, y, pos[2]] : [pos[0], y, gc], size: along === "x" ? [gateW, 0.06, 0.07] : [0.07, 0.06, gateW] }, gm);
    }
  }
  // Paved path from the gate to the main door, or to the building edge.
  const gatePt: [number, number] = sides[front].along === "x" ? [gc, sides[front].pos[2]] : [sides[front].pos[0], gc];
  const end = mainDoor ?? [0, 0];
  const pathA: [number, number] = sides[front].along === "x" ? [gc, gatePt[1]] : [gatePt[0], gc];
  const pathB: [number, number] = sides[front].along === "x" ? [gc, end[1]] : [end[0], gc];
  const plen = Math.hypot(pathB[0] - pathA[0], pathB[1] - pathA[1]);
  if (plen > 0.3) box(landscape, { pos: [(pathA[0] + pathB[0]) / 2, 0.03, (pathA[1] + pathB[1]) / 2], size: sides[front].along === "x" ? [1.4, 0.03, plen] : [plen, 0.03, 1.4] }, "paving");

  const ground = (p.floors[0] ?? []).map(toM);
  for (const [tx, tz] of [[-PW / 2 + 1.3, -PD / 2 + 1.3], [PW / 2 - 1.3, -PD / 2 + 1.3], [-PW / 2 + 1.3, PD / 2 - 1.3], [PW / 2 - 1.3, PD / 2 - 1.3]]) {
    if (ground.some((g) => tx > g.x - 1.2 && tx < g.x + g.w + 1.2 && tz > g.z - 1.2 && tz < g.z + g.d + 1.2)) continue;
    landscape.push({ pos: [tx, 1, tz], size: [0.12, 2, 0], mat: "bark", shape: "cyl" });
    landscape.push({ pos: [tx, 2.6, tz], size: [1.1, 0, 0], mat: "leaf", shape: "ico" });
  }

  return { PW, PD, foundation, floors, roof, elevation, landscape };
}

function Mesh({ part, mats }: { part: Part; mats: ReturnType<typeof makeMaterials> }) {
  const { pos, size, mat, rot, shape = "box" } = part;
  return (
    <mesh position={pos} rotation={rot} material={mats[mat]} castShadow={mat !== "glass" && mat !== "railGlass"} receiveShadow>
      {shape === "box" && <boxGeometry args={size} />}
      {shape === "cyl" && <cylinderGeometry args={[size[0], size[0], size[1], 20]} />}
      {shape === "torus" && <torusGeometry args={[size[0], size[1], 8, 32, Math.PI]} />}
      {shape === "ico" && <icosahedronGeometry args={[size[0], 1]} />}
    </mesh>
  );
}

/** Shows its children from timeline position `at`: grown up from their base, or lowered into place. */
function Stage({ at, y = 0, mode = "rise", children }: { at: number; y?: number; mode?: "rise" | "drop"; children: React.ReactNode }) {
  const tl = useContext(TL)!;
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const p = ease(tl.current.t - at);
    g.visible = p > 0.002;
    if (mode === "rise") g.scale.y = Math.max(0.002, p);
    else g.position.y = y + (1 - p) * 1.5;
  });
  return <group ref={ref} position={[0, y, 0]}>{children}</group>;
}

function Atmosphere({ litAt, paintAt, mats, paint, light }: { litAt: number; paintAt: number; mats: ReturnType<typeof makeMaterials>; paint: string; light: string }) {
  const tl = useContext(TL)!;
  const amb = useRef<THREE.AmbientLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const day = useMemo(() => new THREE.Color("#dce5e8"), []);
  const dusk = useMemo(() => new THREE.Color("#141018"), []);
  const raw = useMemo(() => new THREE.Color("#a9a59e"), []);
  const target = useMemo(() => new THREE.Color(paint), [paint]);
  useFrame(({ scene }) => {
    const t = tl.current.t;
    const lit = light === "auto" ? ease(t - litAt) : light === "dusk" ? 1 : light === "golden" ? 0.25 : 0;
    const painted = ease(t - paintAt);
    mats.paint.color.lerpColors(raw, target, painted);
    mats.glass.setValues({ emissiveIntensity: light === "golden" ? 0 : lit * 0.65 });
    mats.lamp.color.setRGB(0.35 + lit * 2.2, 0.3 + lit * 1.6, 0.2 + lit * 0.6);
    if (amb.current) amb.current.intensity = 0.3 - lit * 0.18;
    if (sun.current) sun.current.intensity = 2.2 - lit * 2.05;
    if (hemi.current) hemi.current.intensity = 0.8 - lit * 0.65;
    if (scene.background instanceof THREE.Color) scene.background.lerpColors(day, dusk, lit);
    scene.environmentIntensity = 0.5 - lit * 0.38;
  });
  return (
    <>
      <color attach="background" args={["#e9e1d3"]} />
      <ambientLight ref={amb} color="#ffe6c4" intensity={0.3} />
      <hemisphereLight ref={hemi} args={["#fff4e2", "#4d5b3a", 0.8]} />
      <directionalLight ref={sun} castShadow position={light === "golden" ? [-18, 8, -12] : [14, 22, -10]} intensity={2.2} color="#fff1dc" shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}>
        <orthographicCamera attach="shadow-camera" args={[-22, 22, 22, -22, 1, 80]} />
      </directionalLight>
    </>
  );
}

function CameraFraming({ targetHeight }: { targetHeight: number }) {
  const { camera, size } = useThree();
  const origin = useRef(camera.position.clone());
  useEffect(() => {
    const target = new THREE.Vector3(0, targetHeight, 0);
    const factor = Math.max(1, .95 / (size.width / size.height));
    camera.position.copy(origin.current).sub(target).multiplyScalar(factor).add(target);
    camera.lookAt(target);
  }, [camera, size.width, size.height, targetHeight]);
  return null;
}

export default function Exterior({ project, timeline, stages, view = "perspective", light = "day", vehicle = true, carColor = "#d5d1c7" }: { project: Project; timeline: TimelineRef; stages: number; view?: string; light?: string; vehicle?: boolean; carColor?: string }) {
  const n = project.floors.length;
  const built = useMemo(() => assemble(project), [project]);
  const mats = useMemo(() => makeMaterials(project.elevation), [project.elevation]);
  const at = { foundation: 1, floor: (k: number) => 2 + k, roof: 2 + n, elevation: 3 + n, landscape: 4 + n, lights: 5 + n };
  const size = Math.max(built.PW, built.PD, n * H);
  useEffect(() => () => { Object.values(mats).forEach(m => { if (m instanceof THREE.MeshStandardMaterial) { m.map?.dispose(); m.bumpMap?.dispose(); } m.dispose(); }); }, [mats]);
  const dirs: Record<Side, [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
  const [fx, fz] = dirs[project.facing];
  const dist = size * 1.25 + 8;
  const cam: V3 = view === "street" ? [fx * dist - fz * dist * .25, Math.max(2, n * H * .25), fz * dist + fx * dist * .25] : view === "aerial" ? [dist * .3, dist * 1.15, -dist * .35] : [fx * dist * 0.85 - fz * dist * 0.55, dist * 0.6, fz * dist * 0.85 + fx * dist * 0.55];

  return (
    <TL.Provider value={timeline}>
      <Canvas shadows dpr={[1, 1.75]} camera={{ position: cam, fov: 38, near: 0.1, far: 400 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }} key={`${project.facing}-${stages}-${view}`}>
        <CameraFraming targetHeight={PLINTH + (n * H) / 2.6} />
        <Atmosphere litAt={at.lights} paintAt={at.elevation} mats={mats} paint={project.elevation.paint} light={light} />
        <Environment resolution={128} frames={1}>
          <Lightformer intensity={2} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
          <Lightformer intensity={1.2} color="#ffd9a0" position={[-10, 4, 8]} scale={[10, 5, 1]} />
        </Environment>

        <mesh position={[0, -0.06, 0]} receiveShadow material={mats.dirt}>
          <boxGeometry args={[built.PW + 100, 0.1, built.PD + 100]} />
        </mesh>
        {/* Plot marking: lime lines and pegs at the corners. */}
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
          <mesh key={`${sx}${sz}`} position={[(sx * built.PW) / 2, 0.25, (sz * built.PD) / 2]} material={mats.marker}>
            <boxGeometry args={[0.08, 0.5, 0.08]} />
          </mesh>
        ))}
        {[[0, -1, built.PW, 0.05], [0, 1, built.PW, 0.05], [-1, 0, 0.05, built.PD], [1, 0, 0.05, built.PD]].map(([sx, sz, w, d], i) => (
          <mesh key={i} position={[(sx * built.PW) / 2, 0.005, (sz * built.PD) / 2]} material={mats.marker}>
            <boxGeometry args={[w, 0.01, d]} />
          </mesh>
        ))}

        <Stage at={at.foundation}>{built.foundation.map((p, i) => <Mesh key={i} part={p} mats={mats} />)}</Stage>
        {built.floors.map((parts, k) => (
          <group key={k} position={[0, PLINTH + k * H, 0]}>
            <Stage at={at.floor(k)}>{parts.map((p, i) => <Mesh key={i} part={p} mats={mats} />)}</Stage>
            <Stage at={at.roof}>{built.roof[k].map((p, i) => <Mesh key={i} part={p} mats={mats} />)}</Stage>
            <Stage at={at.elevation} mode="drop">{built.elevation[k].map((p, i) => <Mesh key={i} part={p} mats={mats} />)}</Stage>
          </group>
        ))}
        <Stage at={at.landscape}>{built.landscape.map((p, i) => <Mesh key={i} part={p} mats={mats} />)}</Stage>

        <group position={[fx * (built.PW / 2 + 3.5), 0, fz * (built.PD / 2 + 3.5)]} rotation={[0, fx ? Math.PI / 2 : 0, 0]}>
          <mesh receiveShadow position={[0, 0.015, 0]}><boxGeometry args={[size * 3, .03, 5.8]} /><meshStandardMaterial color="#424745" roughness={.96} /></mesh>
          <mesh receiveShadow position={[0, .08, 3.1]}><boxGeometry args={[size * 3, .16, .5]} /><meshStandardMaterial color="#b7b6ac" /></mesh>
          {vehicle && <Stage at={at.landscape}><group position={[-3, .04, 0]} rotation={[0, Math.PI / 2, 0]}><Vehicle color={carColor} /></group></Stage>}
        </group>
        <EffectComposer multisampling={0}><N8AO aoRadius={1.1} intensity={1.5} distanceFalloff={1} halfRes /></EffectComposer>
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} target={[0, PLINTH + (n * H) / 2.6, 0]} maxPolarAngle={Math.PI * 0.48} minDistance={4} maxDistance={size * 4 + 20} />
      </Canvas>
    </TL.Provider>
  );
}
