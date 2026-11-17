"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { Kind, Tier, TierId } from "@/lib/plans";
import Vehicle from "./Vehicle";
import { WALL_T } from "./geometry";

// Every piece is built from primitives in the room's canonical frame:
// origin at the room centre on the floor, back wall at -z, door side at +z.

export type Ctx = { cw: number; cd: number; t: Tier; tier: TierId; on: (f: string) => boolean; glow: number; dusk: boolean };
type V3 = [number, number, number];

const LED: V3 = [1, 0.78, 0.5];
const ledColor = (g: number): V3 => [LED[0] * g, LED[1] * g, LED[2] * g];

/** A box whose `at` is its bottom centre. */
function Box({ at, size, color, rough = 0.75, metal = 0, opacity, wire }: { at: V3; size: V3; color: string; rough?: number; metal?: number; opacity?: number; wire?: boolean }) {
  return (
    <mesh position={[at[0], at[1] + size[1] / 2, at[2]]} castShadow={opacity === undefined} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={rough} metalness={metal} transparent={opacity !== undefined} opacity={opacity ?? 1} wireframe={wire} />
    </mesh>
  );
}

function Cyl({ at, r, h, color, rough = 0.6, metal = 0, top }: { at: V3; r: number; h: number; color: string; rough?: number; metal?: number; top?: number }) {
  return (
    <mesh position={[at[0], at[1] + h / 2, at[2]]} castShadow receiveShadow>
      <cylinderGeometry args={[top ?? r, r, h, 28]} />
      <meshStandardMaterial color={color} roughness={rough} metalness={metal} />
    </mesh>
  );
}

/** Hidden LED strip. Invisible in the minimal tier, which has no cove lighting. */
function Strip({ at, size, c, boost = 1 }: { at: V3; size: V3; c: Ctx; boost?: number }) {
  if (c.glow <= 0) return null;
  return (
    <mesh position={[at[0], at[1] + size[1] / 2, at[2]]}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={ledColor(c.glow * boost)} toneMapped={false} />
    </mesh>
  );
}

/** Arc of a torus standing on the back wall, e.g. an arch around a headboard or mandir. */
function Arch({ at, r, tube = 0.03, arc = Math.PI, c, metal }: { at: V3; r: number; tube?: number; arc?: number; c: Ctx; metal?: boolean }) {
  const lit = c.glow > 0 && !metal;
  return (
    <mesh position={at}>
      <torusGeometry args={[r, tube, 10, 64, arc]} />
      {lit ? <meshBasicMaterial color={ledColor(c.glow)} toneMapped={false} /> : <meshStandardMaterial color={c.t.accent} metalness={0.85} roughness={0.28} />}
    </mesh>
  );
}

function Gold({ at, size, c }: { at: V3; size: V3; c: Ctx }) {
  return <Box at={at} size={size} color={c.t.accent} metal={0.85} rough={0.28} />;
}

function Slats({ width, height, z, color, gap = 0.11 }: { width: number; height: number; z: number; color: string; gap?: number }) {
  const n = Math.floor(width / gap);
  return (
    <group>
      {Array.from({ length: n }, (_, i) => (
        <Box key={i} at={[-width / 2 + gap / 2 + i * gap, 0, z]} size={[gap * 0.55, height, 0.05]} color={color} rough={0.6} />
      ))}
    </group>
  );
}

function Chair({ at, rot = 0, color }: { at: V3; rot?: number; color: string }) {
  return (
    <group position={at} rotation={[0, rot, 0]}>
      <Box at={[0, 0, 0]} size={[0.46, 0.46, 0.46]} color={color} />
      <Box at={[0, 0, 0.21]} size={[0.46, 0.92, 0.06]} color={color} />
    </group>
  );
}

function Plant({ at, s = 1 }: { at: V3; s?: number }) {
  return (
    <group position={at} scale={s}>
      <Cyl at={[0, 0, 0]} r={0.16} h={0.36} color="#e8e0d3" top={0.2} />
      <mesh position={[0, 0.62, 0]} castShadow>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial color="#56763a" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.12, 0.88, 0.05]} castShadow>
        <icosahedronGeometry args={[0.18, 1]} />
        <meshStandardMaterial color="#6a8a45" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

function Flame({ at }: { at: V3 }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 9 + at[0] * 13;
    ref.current.scale.set(1, 1 + Math.sin(t) * 0.12 + Math.sin(t * 2.3) * 0.06, 1);
  });
  return (
    <mesh ref={ref} position={at}>
      <coneGeometry args={[0.025, 0.09, 12]} />
      <meshBasicMaterial color={[2.4, 1.2, 0.3]} toneMapped={false} />
    </mesh>
  );
}

function Chandelier({ y = 2.05, r = 0.5, c }: { y?: number; r?: number; c: Ctx }) {
  return (
    <group position={[0, y, 0]}>
      <Box at={[0, 0.05, 0]} size={[0.01, 0.4, 0.01]} color={c.t.accent} />
      {[r, r * 0.72, r * 0.46].map((rr, i) => (
        <mesh key={i} position={[0, -i * 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[rr, 0.018, 8, 48]} />
          <meshBasicMaterial color={ledColor(Math.max(1.2, c.glow))} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Floating false ceiling with a cove of light around its inner edge. */
export function Ceiling({ c }: { c: Ctx }) {
  // A slim plaster band: seen from above it frames the room without hiding it. The LED cove shows the tier.
  const y = 2.44, inset = 0.25, w = c.cw - inset * 2, d = c.cd - inset * 2, band = 0.16;
  if (w < 0.8 || d < 0.8) return null;
  const col = "#f5f0e8";
  return (
    <group>
      <Box at={[0, y, -d / 2 + band / 2]} size={[w, 0.08, band]} color={col} />
      <Box at={[0, y, d / 2 - band / 2]} size={[w, 0.08, band]} color={col} />
      <Box at={[-w / 2 + band / 2, y, 0]} size={[band, 0.08, d - band * 2]} color={col} />
      <Box at={[w / 2 - band / 2, y, 0]} size={[band, 0.08, d - band * 2]} color={col} />
      <Strip at={[0, y - 0.02, -d / 2 + band]} size={[w - band * 2, 0.02, 0.025]} c={c} />
      <Strip at={[0, y - 0.02, d / 2 - band]} size={[w - band * 2, 0.02, 0.025]} c={c} />
      <Strip at={[-w / 2 + band, y - 0.02, 0]} size={[0.025, 0.02, d - band * 2]} c={c} />
      <Strip at={[w / 2 - band, y - 0.02, 0]} size={[0.025, 0.02, d - band * 2]} c={c} />
    </group>
  );
}

function Living({ c }: { c: Ctx }) {
  const { cw, cd, t } = c;
  const hz = cd / 2 - WALL_T;
  const tvW = Math.min(2.6, cw * 0.62);
  const sofaW = Math.min(2.8, cw * 0.66);
  const sofaZ = Math.min(hz - 0.5, 1.4);
  return (
    <>
      {c.on("tv") && (
        <>
          {c.tier === "minimal" ? <Box at={[0, 0, -hz + 0.02]} size={[tvW + 0.4, 2.3, 0.04]} color="#e8e0d4" /> : <Slats width={tvW + 0.6} height={2.35} z={-hz + 0.03} color={t.wood} />}
          {c.tier === "premium" && <Box at={[0, 0.6, -hz + 0.06]} size={[tvW - 0.2, 1.6, 0.03]} color="#efe7db" rough={0.15} />}
          <Box at={[0, 0, -hz + 0.25]} size={[tvW, 0.42, 0.42]} color={c.tier === "minimal" ? "#efe9df" : t.wood} />
          <Box at={[0, 0.95, -hz + 0.1]} size={[1.5, 0.86, 0.05]} color="#0f0f10" rough={0.2} />
          <Strip at={[0, 0, -hz + 0.47]} size={[tvW, 0.02, 0.02]} c={c} />
          {c.tier === "premium" && [-1, 1].map((s) => <Gold key={s} at={[s * (tvW / 2 + 0.32), 0, -hz + 0.08]} size={[0.04, 2.35, 0.04]} c={c} />)}
        </>
      )}
      {c.on("sofa") && (
        <>
          <Box at={[0, 0, sofaZ - 0.55]} size={[sofaW + 0.4, 0.012, 2]} color={c.tier === "minimal" ? "#ddd3c3" : "#c9b89c"} />
          <Box at={[0, 0, sofaZ]} size={[sofaW, 0.42, 0.9]} color={t.soft} />
          <Box at={[0, 0, sofaZ + 0.36]} size={[sofaW, 0.85, 0.2]} color={t.soft} />
          <Box at={[-sofaW / 2 + 0.45, 0, sofaZ - 0.9]} size={[0.9, 0.42, 0.95]} color={t.soft} />
          {[-0.5, 0.2, 0.9].map((x) => <Box key={x} at={[x * (sofaW / 2.8), 0.42, sofaZ + 0.2]} size={[0.42, 0.36, 0.12]} color={c.tier === "minimal" ? "#cfc3ae" : "#64744a"} />)}
          <Cyl at={[0.2, 0, sofaZ - 1.1]} r={0.45} h={0.38} color={c.tier === "premium" ? "#f3eee8" : t.wood} rough={c.tier === "premium" ? 0.2 : 0.6} />
          {c.tier === "premium" && <Cyl at={[0.2, 0, sofaZ - 1.1]} r={0.47} h={0.05} color={t.accent} metal={0.85} rough={0.3} />}
          <Plant at={[sofaW / 2 + 0.3, 0, sofaZ + 0.2]} s={1.2} />
        </>
      )}
      {c.on("ceiling") && c.tier === "premium" && <Chandelier c={c} />}
    </>
  );
}

function Dining({ c }: { c: Ctx }) {
  const { cw, cd, t } = c;
  const hz = cd / 2 - WALL_T;
  const tw = Math.min(1.9, cw * 0.55), td = Math.min(1, cd * 0.42);
  const n = Math.max(1, Math.floor(tw / 0.62));
  return (
    <>
      {c.on("table") && (
        <>
          <Box at={[0, 0.72, 0]} size={[tw, 0.05, td]} color={c.tier === "premium" ? "#f3eee8" : t.wood} rough={c.tier === "premium" ? 0.18 : 0.6} />
          <Box at={[0, 0, 0]} size={[tw * 0.5, 0.72, td * 0.3]} color={c.tier === "premium" ? t.accent : t.wood} metal={c.tier === "premium" ? 0.8 : 0} rough={0.35} />
          {Array.from({ length: n }, (_, i) => {
            const x = -tw / 2 + (i + 0.5) * (tw / n);
            return [1, -1].map((s) => <Chair key={`${i}${s}`} at={[x, 0, s * (td / 2 + 0.3)]} rot={s > 0 ? 0 : Math.PI} color={t.soft} />);
          })}
        </>
      )}
      {c.on("crockery") && (
        <>
          <Box at={[0, 0, -hz + 0.21]} size={[Math.min(1.8, cw * 0.6), 2.1, 0.42]} color={c.tier === "minimal" ? "#ece6dc" : t.wood} />
          {[0.9, 1.35, 1.8].map((y) => <Strip key={y} at={[0, y, -hz + 0.43]} size={[Math.min(1.6, cw * 0.55), 0.015, 0.015]} c={c} />)}
        </>
      )}
      {c.on("ceiling") && c.tier !== "minimal" && <Chandelier y={1.95} r={0.38} c={c} />}
    </>
  );
}

function Kitchen({ c }: { c: Ctx }) {
  const { cw, cd, t } = c;
  const hx = cw / 2 - WALL_T, hz = cd / 2 - WALL_T;
  const cab = c.tier === "minimal" ? "#eee8de" : c.tier === "signature" ? t.soft : "#a7b394";
  const top = c.tier === "premium" ? "#f2ece5" : "#e2d9cb";
  const gloss = c.tier === "premium" ? 0.18 : 0.7;
  const end = c.on("tall") ? hx - 0.66 : hx;
  const len = end + hx, mid = (end - hx) / 2;
  const side = Math.min(cd - 1.6, 2.4);
  return (
    <>
      {c.on("counters") && (
        <>
          <Box at={[mid, 0, -hz + 0.3]} size={[len, 0.86, 0.6]} color={cab} rough={gloss} />
          <Box at={[mid, 0.86, -hz + 0.31]} size={[len, 0.04, 0.62]} color={top} rough={0.2} />
          <Box at={[mid, 1.45, -hz + 0.18]} size={[len, 0.75, 0.35]} color={c.tier === "minimal" ? "#f4f0e9" : cab} rough={gloss} />
          <Strip at={[mid, 1.43, -hz + 0.33]} size={[len, 0.015, 0.02]} c={c} boost={1.3} />
          <Box at={[mid * 0.5, 0.9, -hz + 0.33]} size={[0.6, 0.02, 0.45]} color="#151515" rough={0.3} />
          {side > 0.6 && (
            <>
              <Box at={[-hx + 0.3, 0, -hz + 0.6 + side / 2]} size={[0.6, 0.86, side]} color={cab} rough={gloss} />
              <Box at={[-hx + 0.31, 0.86, -hz + 0.6 + side / 2]} size={[0.62, 0.04, side]} color={top} rough={0.2} />
            </>
          )}
          {c.tier === "premium" && <Gold at={[mid, 0.78, -hz + 0.605]} size={[len, 0.02, 0.01]} c={c} />}
        </>
      )}
      {c.on("tall") && (
        <>
          <Box at={[hx - 0.33, 0, -hz + 0.33]} size={[0.62, 1.95, 0.64]} color="#c7cacc" metal={0.6} rough={0.3} />
          <Box at={[hx - 0.33, 1.95, -hz + 0.33]} size={[0.62, 0.45, 0.64]} color={cab} rough={gloss} />
        </>
      )}
      {c.on("island") && cw >= 2.6 && cd >= 2.8 && (
        <>
          <Box at={[0.2, 0, 0.45]} size={[Math.min(1.6, cw * 0.45), 0.88, 0.75]} color={c.tier === "minimal" ? cab : t.wood} />
          <Box at={[0.2, 0.88, 0.45]} size={[Math.min(1.7, cw * 0.48), 0.05, 0.85]} color={top} rough={0.2} />
          {[-0.3, 0.3].map((x) => <Cyl key={x} at={[0.2 + x, 0, 1.05]} r={0.2} h={0.75} color={c.tier === "premium" ? t.accent : "#d7cbb8"} metal={c.tier === "premium" ? 0.8 : 0} rough={0.4} />)}
        </>
      )}
    </>
  );
}

function Bedroom({ c, kids }: { c: Ctx; kids?: boolean }) {
  const { cw, cd, t } = c;
  const hx = cw / 2 - WALL_T, hz = cd / 2 - WALL_T;
  const bw = kids ? 1.05 : Math.min(1.8, cw - 1.3);
  const bl = Math.min(2.05, cd - 0.9);
  const bx = kids ? -hx + bw / 2 + 0.15 : 0;
  const z0 = -hz + 0.02;
  const base = c.tier === "premium" ? "#d9c7a8" : kids ? "#9fb6c4" : t.soft;
  const runner = c.tier === "minimal" ? "#cdbfa8" : kids ? "#e3a99a" : "#5f6e45";
  const wl = Math.min(2.4, cd * 0.5);
  const archR = Math.min(1, (bw + 0.8) / 2);
  return (
    <>
      {c.on("headboard") && (
        <>
          <Box at={[bx, 0, -hz + 0.02]} size={[bw + 1.3, 2.3, 0.04]} color={c.tier === "minimal" ? "#e7ded1" : c.tier === "signature" ? "#c9cdb4" : "#efe4d2"} />
          <Arch at={[bx, 1.3, -hz + 0.07]} r={archR} c={c} metal={c.tier === "minimal"} />
          {c.tier !== "minimal" && [-1, 1].map((s) => <Box key={s} at={[bx + s * (bw / 2 + 0.75), 0, -hz + 0.05]} size={[0.14, 2.3, 0.05]} color={t.wood} />)}
        </>
      )}
      {c.on("bed") && (
        <>
          <Box at={[bx, 0, z0 + bl / 2]} size={[bw, 0.32, bl]} color={base} />
          <Strip at={[bx, 0.01, z0 + bl / 2]} size={[bw + 0.04, 0.03, bl + 0.04]} c={c} boost={0.8} />
          <Box at={[bx, 0, z0 + 0.06]} size={[bw + 0.1, 1.15, 0.12]} color={base} />
          <Box at={[bx, 0.32, z0 + 0.07 + bl / 2]} size={[bw - 0.06, 0.22, bl - 0.14]} color="#f6f2ea" />
          <Box at={[bx, 0.55, z0 + bl - 0.42]} size={[bw - 0.02, 0.025, 0.5]} color={runner} />
          {(kids ? [0] : [-1, 1]).map((s) => <Box key={s} at={[bx + s * (bw / 4), 0.54, z0 + 0.35]} size={[kids ? 0.6 : bw / 2 - 0.12, 0.16, 0.32]} color="#fbf8f2" />)}
          {!kids && [-1, 1].map((s) => (
            <group key={s}>
              <Box at={[s * (bw / 2 + 0.32), 0, z0 + 0.25]} size={[0.48, 0.5, 0.42]} color={c.tier === "minimal" ? "#cfb08a" : t.wood} />
              <mesh position={[s * (bw / 2 + 0.32), 0.68, z0 + 0.25]}>
                <sphereGeometry args={[0.09, 16, 12]} />
                <meshBasicMaterial color={ledColor(c.dusk ? 1.6 : 1)} toneMapped={false} />
              </mesh>
            </group>
          ))}
        </>
      )}
      {kids && c.on("desk") && (
        <>
          <Box at={[hx - 0.65, 0, -hz + 0.3]} size={[1.2, 0.75, 0.6]} color={c.tier === "minimal" ? "#e9e2d6" : t.wood} />
          <Box at={[hx - 0.65, 1.2, -hz + 0.15]} size={[1.2, 0.04, 0.28]} color={t.wood} />
          <Chair at={[hx - 0.65, 0, -hz + 0.85]} color="#e3a99a" />
        </>
      )}
      {c.on("wardrobe") && (
        <>
          <Box at={[kids ? hx - 0.31 : -hx + 0.31, 0, hz - wl / 2 - 0.1]} size={[0.6, 2.3, wl]} color={c.tier === "minimal" ? "#ece6dc" : c.tier === "signature" ? "#d8cbb6" : "#f1e8da"} rough={c.tier === "premium" ? 0.14 : 0.6} />
          {c.tier !== "minimal" && Array.from({ length: Math.max(2, Math.round(wl / 0.6)) - 1 }, (_, i) => (
            <Gold key={i} at={[kids ? hx - 0.615 : -hx + 0.615, 0.15, hz - 0.1 - wl + (i + 1) * (wl / Math.max(2, Math.round(wl / 0.6)))]} size={[0.012, 2, 0.02]} c={c} />
          ))}
        </>
      )}
      {c.on("ceiling") && c.tier === "premium" && <Chandelier y={2.1} r={0.42} c={c} />}
    </>
  );
}

function Bath({ c }: { c: Ctx }) {
  const { cw, cd, t } = c;
  const hx = cw / 2 - WALL_T, hz = cd / 2 - WALL_T;
  const vx = -hx + 0.55;
  return (
    <>
      <Box at={[hx - 0.3, 0, -hz + 0.35]} size={[0.4, 0.42, 0.6]} color="#f7f7f5" rough={0.2} />
      <Box at={[hx - 0.3, 0, -hz + 0.08]} size={[0.42, 0.85, 0.14]} color={c.tier === "premium" ? "#f2ece5" : "#ebe6de"} rough={0.3} />
      {c.on("vanity") && (
        <>
          <Box at={[vx, 0.3, -hz + 0.25]} size={[0.85, 0.55, 0.48]} color={c.tier === "minimal" ? "#d8c3a4" : t.wood} />
          <Box at={[vx, 0.85, -hz + 0.25]} size={[0.9, 0.04, 0.5]} color="#f2ede6" rough={0.15} />
          <Cyl at={[vx, 0.89, -hz + 0.25]} r={0.17} h={0.1} color="#ffffff" rough={0.15} />
          {c.tier === "minimal" ? (
            <Box at={[vx, 1.2, -hz + 0.02]} size={[0.7, 0.8, 0.02]} color="#c8d0d4" metal={0.9} rough={0.05} />
          ) : (
            <>
              <mesh position={[vx, 1.6, -hz + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.32, 0.32, 0.02, 40]} />
                <meshStandardMaterial color="#c8d0d4" metalness={0.9} roughness={0.05} />
              </mesh>
              <Arch at={[vx, 1.6, -hz + 0.04]} r={0.33} tube={0.015} arc={Math.PI * 2} c={c} />
            </>
          )}
        </>
      )}
      {c.on("shower") && cd > 1.5 && (
        <>
          <Box at={[hx - 0.45, 0, hz - 0.45]} size={[0.9, 0.03, 0.9]} color="#d6d0c7" rough={0.4} />
          <Box at={[hx - 0.92, 0, hz - 0.45]} size={[0.015, 2, 0.9]} color="#bfe0ea" rough={0.05} opacity={0.28} />
          <Box at={[hx - 0.04, 1.9, hz - 0.45]} size={[0.06, 0.05, 0.25]} color={t.accent} metal={0.85} rough={0.3} />
        </>
      )}
    </>
  );
}

function Pooja({ c }: { c: Ctx }) {
  const { cw, cd, t } = c;
  const hz = cd / 2 - WALL_T;
  const mw = Math.min(2.4, cw - 0.3);
  const marble = c.tier === "premium" ? "#f3ece1" : c.tier === "signature" ? "#ece2d2" : "#e9e1d4";
  return (
    <>
      {c.on("mandir") && (
        <>
          <Box at={[0, 0, -hz + 0.03]} size={[mw, 2.35, 0.05]} color={c.tier === "minimal" ? "#d9bf97" : t.wood} />
          <Box at={[0, 0, -hz + 0.32]} size={[mw, 0.72, 0.58]} color={marble} rough={c.tier === "premium" ? 0.15 : 0.5} />
          <Strip at={[0, 0.7, -hz + 0.62]} size={[mw, 0.015, 0.015]} c={c} boost={1.4} />
          <Box at={[0, 0.72, -hz + 0.12]} size={[0.56, 0.98, 0.14]} color="#241910" />
          {[-1, 1].map((s) => <Gold key={s} at={[s * 0.34, 0.72, -hz + 0.2]} size={[0.07, 0.95, 0.07]} c={c} />)}
          <Arch at={[0, 1.67, -hz + 0.2]} r={0.34} tube={0.035} c={c} metal />
          <Arch at={[0, 1.67, -hz + 0.1]} r={0.5} tube={0.02} c={c} />
          <Cyl at={[0, 0.72, -hz + 0.2]} r={0.1} h={0.55} color="#1a1511" rough={0.4} top={0.08} />
          <mesh position={[0, 1.4, -hz + 0.2]} castShadow>
            <coneGeometry args={[0.085, 0.24, 20]} />
            <meshStandardMaterial color={t.accent} metalness={0.85} roughness={0.28} />
          </mesh>
          {[-0.75, 0.75].map((x) => x * (mw / 2.4)).map((x) => (
            <group key={x}>
              <Gold at={[x, 0.72, -hz + 0.25]} size={[0.16, 0.36, 0.16]} c={c} />
              <mesh position={[x, 1.2, -hz + 0.25]}>
                <sphereGeometry args={[0.1, 16, 12]} />
                <meshStandardMaterial color={t.accent} metalness={0.85} roughness={0.28} />
              </mesh>
            </group>
          ))}
        </>
      )}
      {c.on("lamps") && (
        <>
          {[-1, 1].map((s) => {
            const x = s * Math.min(mw / 2 - 0.1, 0.95);
            return (
              <group key={s}>
                <Cyl at={[x, 0, -hz + 0.8]} r={0.13} h={0.03} color={t.accent} metal={0.85} rough={0.3} />
                <Cyl at={[x, 0.03, -hz + 0.8]} r={0.03} h={0.9} color={t.accent} metal={0.85} rough={0.3} />
                <Cyl at={[x, 0.93, -hz + 0.8]} r={0.11} h={0.04} color={t.accent} metal={0.85} rough={0.3} top={0.14} />
                <Flame at={[x, 1.02, -hz + 0.8]} />
                <Box at={[x * 0.55, 1.7, -hz + 0.35]} size={[0.01, 0.6, 0.01]} color={t.accent} />
                <mesh position={[x * 0.55, 1.62, -hz + 0.35]} castShadow>
                  <coneGeometry args={[0.09, 0.16, 20, 1, true]} />
                  <meshStandardMaterial color={t.accent} metalness={0.85} roughness={0.28} side={THREE.DoubleSide} />
                </mesh>
              </group>
            );
          })}
        </>
      )}
      {c.on("rangoli") && (
        <>
          <Cyl at={[0, 0, Math.min(0.3, hz - 0.9)]} r={Math.min(0.7, cw * 0.22)} h={0.006} color={t.accent} metal={0.7} rough={0.35} />
          <Cyl at={[0, 0.006, Math.min(0.3, hz - 0.9)]} r={Math.min(0.7, cw * 0.22) * 0.62} h={0.006} color="#b3202a" />
          <Cyl at={[0, 0.012, Math.min(0.3, hz - 0.9)]} r={Math.min(0.7, cw * 0.22) * 0.25} h={0.006} color="#f6ead2" />
        </>
      )}
    </>
  );
}

function Balcony({ c }: { c: Ctx }) {
  const { cw, cd, t } = c;
  const hx = cw / 2 - WALL_T, hz = cd / 2 - WALL_T;
  return (
    <>
      <Box at={[0, 0, 0]} size={[cw - 0.2, 0.015, cd - 0.2]} color={c.tier === "minimal" ? "#cdb497" : "#a77a50"} />
      {c.on("seat") && (
        <>
          <Box at={[0, 0, -hz + 0.3]} size={[Math.min(2.2, cw - 0.6), 0.42, 0.55]} color={t.wood} />
          <Box at={[0, 0.42, -hz + 0.3]} size={[Math.min(2.1, cw - 0.7), 0.1, 0.5]} color={t.soft} />
          <Strip at={[0, 0.02, -hz + 0.58]} size={[Math.min(2.2, cw - 0.6), 0.02, 0.02]} c={c} />
        </>
      )}
      {c.on("planters") && (
        <>
          <Box at={[hx - 0.22, 0, 0]} size={[0.36, 0.45, Math.max(0.5, cd - 0.8)]} color="#ddd4c6" />
          {Array.from({ length: Math.max(1, Math.floor((cd - 0.8) / 0.5)) }, (_, i) => (
            <mesh key={i} position={[hx - 0.22, 0.6, -((cd - 0.8) / 2) + 0.25 + i * 0.5]} castShadow>
              <icosahedronGeometry args={[0.2, 1]} />
              <meshStandardMaterial color={i % 2 ? "#5d7d3c" : "#6f9147"} roughness={0.9} flatShading />
            </mesh>
          ))}
        </>
      )}
      {c.on("swing") && (
        <group position={[-hx + 0.6, 0, Math.min(0.3, hz - 0.5)]}>
          <Box at={[0, 1.55, 0]} size={[0.015, 0.9, 0.015]} color="#3a2a1c" />
          <mesh position={[0, 0.95, 0]} scale={[1, 1.3, 1]} castShadow>
            <sphereGeometry args={[0.42, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.82]} />
            <meshStandardMaterial color="#b98a52" wireframe />
          </mesh>
          <Cyl at={[0, 0.5, 0]} r={0.33} h={0.12} color="#efe6d6" />
        </group>
      )}
    </>
  );
}

function Foyer({ c }: { c: Ctx }) {
  const { cw, cd, t } = c;
  const hx = cw / 2 - WALL_T, hz = cd / 2 - WALL_T;
  const w = Math.min(1.2, cw - 0.5);
  return (
    <>
      {c.on("console") && (
        <>
          <Box at={[0, 0.1, -hz + 0.18]} size={[w, 0.7, 0.34]} color={t.wood} />
          <Strip at={[0, 0.09, -hz + 0.18]} size={[w, 0.02, 0.3]} c={c} />
          <Arch at={[0, 1.5, -hz + 0.03]} r={0.32} tube={0.02} arc={Math.PI * 2} c={c} metal={c.tier === "minimal"} />
          <Plant at={[w / 2 - 0.1, 0.8, -hz + 0.18]} s={0.5} />
        </>
      )}
      {c.on("shoe") && cd > 1.4 && <Box at={[-hx + 0.2, 0, 0.15]} size={[0.36, 1, Math.min(1.2, cd - 0.6)]} color={c.tier === "minimal" ? "#e9e2d6" : t.wood} />}
    </>
  );
}

function Utility({ c }: { c: Ctx }) {
  const { cw, cd } = c;
  const hz = cd / 2 - WALL_T;
  if (!c.on("units")) return null;
  return (
    <>
      <Box at={[0, 0, -hz + 0.3]} size={[cw - 0.3, 0.86, 0.6]} color="#e7e1d7" />
      <Box at={[-cw / 2 + 0.55, 0, -hz + 0.34]} size={[0.58, 0.84, 0.58]} color="#f4f4f2" rough={0.3} />
      <Box at={[0, 1.5, -hz + 0.18]} size={[cw - 0.3, 0.7, 0.35]} color="#efe9df" />
    </>
  );
}

function Stair({ c }: { c: Ctx }) {
  const { cw, cd, t } = c;
  const hx = cw / 2 - WALL_T, hz = cd / 2 - WALL_T;
  const steps = Math.min(14, Math.floor((cw - 0.3) / 0.24));
  const sw = Math.min(1.05, cd - 0.3);
  const z = -hz + sw / 2 + 0.02;
  const tread = c.tier === "premium" ? "#efe6da" : c.tier === "signature" ? t.wood : "#e5dccd";
  return (
    <>
      {c.on("stairs") && (
        <>
          {Array.from({ length: steps }, (_, i) => (
            <group key={i}>
              <Box at={[-hx + 0.12 + i * 0.24 + 0.12, 0, z]} size={[0.24, (i + 1) * 0.18, sw]} color={tread} rough={c.tier === "premium" ? 0.2 : 0.6} />
              <Strip at={[-hx + 0.12 + i * 0.24 + 0.005, i * 0.18 + 0.02, z]} size={[0.01, 0.015, sw - 0.04]} c={c} />
            </group>
          ))}
          <Box at={[-hx + 0.12 + steps * 0.12, 0, z + sw / 2 + 0.01]} size={[steps * 0.24, steps * 0.18 + 0.2, 0.015]} color="#bfe0ea" opacity={0.25} />
        </>
      )}
      {c.on("wall") && (
        <group position={[0, 0, -hz + 0.02]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[-0.6 + i * 0.32, 0.9 + i * 0.28, 0]} rotation={[0, 0, 0.7 - i * 0.12]} scale={[0.09, 0.22, 0.02]}>
              <sphereGeometry args={[1, 16, 12]} />
              {c.glow > 0 ? <meshBasicMaterial color={ledColor(c.glow * 0.8)} toneMapped={false} /> : <meshStandardMaterial color={t.accent} metalness={0.85} roughness={0.3} />}
            </mesh>
          ))}
        </group>
      )}
    </>
  );
}

function Porch({ c }: { c: Ctx }) {
  const { cw, cd, t } = c;
  const hz = cd / 2 - WALL_T;
  return (
    <>
      <Box at={[0, 0, 0]} size={[cw - 0.2, 0.012, cd - 0.2]} color="#b9b1a6" rough={0.4} />
      {c.on("car") && <group scale={Math.min(1, (cw - .4) / 2.1, (cd - .4) / 4.5)}><Vehicle /></group>}
      {c.on("wall") && (
        <group position={[0, 0, -hz + 0.04]}>
          <Box at={[0, 0, -0.02]} size={[Math.min(3, cw - 0.4), 2.5, 0.04]} color="#3b2d22" />
          <mesh position={[0, 1.35, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.8, 0.8, 0.02, 48]} />
            <meshStandardMaterial color={t.accent} metalness={0.8} roughness={0.35} />
          </mesh>
          <Arch at={[0, 1.35, 0.04]} r={0.82} tube={0.02} arc={Math.PI * 2} c={c} />
        </group>
      )}
      {c.on("ceiling") && <Ceiling c={c} />}
    </>
  );
}

function Study({ c }: { c: Ctx }) {
  const { cw, cd, t } = c;
  const hz = cd / 2 - WALL_T;
  if (!c.on("desk")) return null;
  return (
    <>
      <Box at={[0, 0, -hz + 0.3]} size={[Math.min(1.4, cw - 0.4), 0.75, 0.6]} color={t.wood} />
      <Box at={[0, 1.15, -hz + 0.14]} size={[Math.min(1.4, cw - 0.4), 0.04, 0.26]} color={t.wood} />
      <Box at={[0, 1.6, -hz + 0.14]} size={[Math.min(1.4, cw - 0.4), 0.04, 0.26]} color={t.wood} />
      <Strip at={[0, 1.14, -hz + 0.27]} size={[Math.min(1.4, cw - 0.4), 0.015, 0.015]} c={c} />
      <Chair at={[0, 0, -hz + 0.85]} color={t.soft} />
    </>
  );
}

function Dress({ c }: { c: Ctx }) {
  const { cw, cd, t } = c;
  const hx = cw / 2 - WALL_T;
  const col = c.tier === "minimal" ? "#ece6dc" : c.tier === "signature" ? t.wood : "#f1e8da";
  return (
    <>
      {c.on("units") && [-1, 1].map((s) => (
        <group key={s}>
          <Box at={[s * (hx - 0.3), 0, 0]} size={[0.58, 2.3, cd - 0.8]} color={col} rough={c.tier === "premium" ? 0.14 : 0.6} />
          <Strip at={[s * (hx - 0.6), 2.0, 0]} size={[0.015, 0.015, cd - 0.9]} c={c} />
        </group>
      ))}
      {c.on("island") && cw > 1.9 && (
        <>
          <Box at={[0, 0, 0]} size={[0.6, 0.85, Math.min(1.2, cd - 1.6)]} color={t.wood} />
          <Box at={[0, 0.85, 0]} size={[0.64, 0.03, Math.min(1.24, cd - 1.56)]} color={c.tier === "premium" ? t.accent : "#f1ece4"} metal={c.tier === "premium" ? 0.8 : 0} rough={0.25} />
        </>
      )}
    </>
  );
}

function Workspace({ c }: { c: Ctx }) {
  const { cw, cd, t } = c;
  const rows = Math.max(1, Math.floor((cd - 1.2) / 1.7));
  const len = cw - 1.6;
  const seats = Math.max(1, Math.floor(len / 1.2));
  return (
    <>
      {c.on("desks") && Array.from({ length: rows }, (_, r) => {
        const z = -cd / 2 + 1.2 + r * 1.7;
        return (
          <group key={r}>
            <Box at={[0, 0, z]} size={[len, 0.74, 1.2]} color={c.tier === "minimal" ? "#efe9df" : t.wood} />
            <Box at={[0, 0.74, z]} size={[len, 0.35, 0.03]} color={t.soft} />
            {Array.from({ length: seats }, (_, i) => {
              const x = -len / 2 + (i + 0.5) * (len / seats);
              return [1, -1].map((s) => (
                <group key={`${i}${s}`}>
                  <Box at={[x, 0.75, z + s * 0.25]} size={[0.5, 0.32, 0.02]} color="#141416" rough={0.2} />
                  <Chair at={[x, 0, z + s * 0.85]} rot={s > 0 ? 0 : Math.PI} color="#3c3f44" />
                </group>
              ));
            })}
          </group>
        );
      })}
      {c.on("ceiling") && (
        <group>
          {Array.from({ length: Math.floor((cw - 0.8) / 0.4) }, (_, i) => (
            <Box key={i} at={[-cw / 2 + 0.6 + i * 0.4, 2.3, 0]} size={[0.06, 0.18, cd - 1]} color={t.wood} />
          ))}
          {[-1, 0, 1].map((s) => <Strip key={s} at={[s * cw * 0.25, 2.28, 0]} size={[0.04, 0.02, cd - 1.2]} c={c} boost={1.2} />)}
        </group>
      )}
    </>
  );
}

function Cabin({ c }: { c: Ctx }) {
  const { cw, cd, t } = c;
  const hz = cd / 2 - WALL_T;
  return (
    <>
      {c.on("desk") && (
        <>
          <Box at={[0, 0, -hz + 1.0]} size={[Math.min(1.8, cw - 1), 0.76, 0.85]} color={t.wood} />
          {c.tier === "premium" && <Gold at={[0, 0.76, -hz + 1.0]} size={[Math.min(1.8, cw - 1), 0.02, 0.87]} c={c} />}
          <Chair at={[0, 0, -hz + 0.45]} rot={Math.PI} color="#2b2522" />
          {[-0.45, 0.45].map((x) => <Chair key={x} at={[x, 0, -hz + 1.75]} color={t.soft} />)}
        </>
      )}
      {c.on("shelves") && (
        <>
          <Box at={[0, 0, -hz + 0.02]} size={[Math.min(2.6, cw - 0.4), 2.3, 0.04]} color={c.tier === "minimal" ? "#e9e2d6" : t.wood} />
          {[0.9, 1.4, 1.9].map((y) => (
            <group key={y}>
              <Box at={[0, y, -hz + 0.15]} size={[Math.min(2.2, cw - 0.8), 0.03, 0.26]} color={t.wood} />
              <Strip at={[0, y - 0.01, -hz + 0.27]} size={[Math.min(2.2, cw - 0.8), 0.012, 0.012]} c={c} />
            </group>
          ))}
        </>
      )}
    </>
  );
}

function Meeting({ c }: { c: Ctx }) {
  const { cw, cd, t } = c;
  const hz = cd / 2 - WALL_T;
  const tl = Math.min(3.2, cw - 1.4);
  const n = Math.max(1, Math.floor(tl / 0.7));
  return (
    <>
      {c.on("table") && (
        <>
          <Box at={[0, 0.72, 0.2]} size={[tl, 0.05, 1.1]} color={c.tier === "premium" ? "#f3eee8" : t.wood} rough={c.tier === "premium" ? 0.18 : 0.6} />
          <Box at={[0, 0, 0.2]} size={[tl * 0.6, 0.72, 0.4]} color={t.wood} />
          {Array.from({ length: n }, (_, i) => {
            const x = -tl / 2 + (i + 0.5) * (tl / n);
            return [1, -1].map((s) => <Chair key={`${i}${s}`} at={[x, 0, 0.2 + s * 0.85]} rot={s > 0 ? 0 : Math.PI} color="#3a342e" />);
          })}
        </>
      )}
      {c.on("screen") && (
        <>
          <Slats width={Math.min(3, cw - 0.4)} height={2.35} z={-hz + 0.03} color={c.tier === "minimal" ? "#d9cbb6" : t.wood} />
          <Box at={[0, 0.9, -hz + 0.1]} size={[1.9, 1.07, 0.05]} color="#0e1116" rough={0.2} />
        </>
      )}
    </>
  );
}

function Reception({ c }: { c: Ctx }) {
  const { cw, cd, t } = c;
  const hz = cd / 2 - WALL_T;
  // The full client logo, unaltered, on a black panel matching its own background.
  const logo = useTexture("/brand/logo.png");
  return (
    <>
      {c.on("wall") && (
        <>
          <Box at={[0, 0, -hz + 0.02]} size={[cw - 0.4, 2.4, 0.04]} color="#000000" rough={0.4} />
          <mesh position={[0, 1.3, -hz + 0.05]}>
            <planeGeometry args={[1.5, 1.5]} />
            <meshBasicMaterial map={logo} toneMapped={false} />
          </mesh>
        </>
      )}
      {c.on("counter") && (
        <>
          <Box at={[0, 0, -hz + 1.1]} size={[Math.min(2, cw - 0.8), 1.05, 0.6]} color={c.tier === "minimal" ? "#efe9df" : t.wood} />
          <Box at={[0, 1.05, -hz + 1.1]} size={[Math.min(2.1, cw - 0.7), 0.04, 0.68]} color={c.tier === "premium" ? "#f3eee8" : "#e6ddcf"} rough={0.2} />
          <Strip at={[0, 0.02, -hz + 1.42]} size={[Math.min(2, cw - 0.8), 0.02, 0.02]} c={c} />
          <Chair at={[0, 0, -hz + 0.55]} rot={Math.PI} color="#2b2522" />
        </>
      )}
      {c.on("seats") && (
        <>
          <Box at={[0, 0, cd / 2 - 0.6]} size={[Math.min(2.2, cw - 0.8), 0.42, 0.75]} color={t.soft} />
          <Box at={[0, 0, cd / 2 - 0.3]} size={[Math.min(2.2, cw - 0.8), 0.8, 0.16]} color={t.soft} />
          <Plant at={[cw / 2 - 0.45, 0, cd / 2 - 0.55]} />
        </>
      )}
    </>
  );
}

function Retail({ c }: { c: Ctx }) {
  const { cw, cd, t } = c;
  const hx = cw / 2 - WALL_T, hz = cd / 2 - WALL_T;
  const rack = c.tier === "minimal" ? "#ece6dc" : t.wood;
  return (
    <>
      {c.on("racks") && (
        <>
          <Box at={[0, 0, -hz + 0.25]} size={[cw - 0.6, 2.2, 0.5]} color={rack} />
          {[0.6, 1.1, 1.6].map((y) => <Strip key={y} at={[0, y, -hz + 0.51]} size={[cw - 0.8, 0.012, 0.012]} c={c} />)}
          {[-1, 1].map((s) => <Box key={s} at={[s * (hx - 0.25), 0, 0.3]} size={[0.5, 2.2, cd - 2]} color={rack} />)}
          {Array.from({ length: Math.floor((cw - 1) / 0.5) }, (_, i) => (
            <Box key={i} at={[-cw / 2 + 0.75 + i * 0.5, 0.9, -hz + 0.25]} size={[0.3, 0.4, 0.3]} color={["#b3202a", "#d9a93f", "#6b7a4c", "#e9e2d6"][i % 4]} />
          ))}
        </>
      )}
      {c.on("podium") && [-1, 0, 1].map((s) => (
        <group key={s}>
          <Cyl at={[s * 1.4, 0, 0.6]} r={0.45} h={0.25 + Math.abs(s) * 0.2} color={c.tier === "premium" ? "#f3eee8" : "#e6ddcf"} rough={0.2} />
          <mesh position={[s * 1.4, 0.75 + Math.abs(s) * 0.2, 0.6]} castShadow>
            <capsuleGeometry args={[0.16, 0.6, 6, 12]} />
            <meshStandardMaterial color={t.soft} roughness={0.6} />
          </mesh>
        </group>
      ))}
      {c.on("ceiling") && <Ceiling c={c} />}
    </>
  );
}

function Display({ c }: { c: Ctx }) {
  const { cw, t } = c;
  if (!c.on("podium")) return null;
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Cyl at={[s * cw * 0.2, 0, 0]} r={0.38} h={0.3} color={c.tier === "premium" ? "#f3eee8" : "#e6ddcf"} rough={0.2} />
          <mesh position={[s * cw * 0.2, 0.95, 0]} castShadow>
            <capsuleGeometry args={[0.17, 0.75, 6, 12]} />
            <meshStandardMaterial color={s > 0 ? "#b3202a" : t.soft} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Counter({ c }: { c: Ctx }) {
  const { cw, cd, t } = c;
  const hz = cd / 2 - WALL_T;
  return (
    <>
      {c.on("desk") && (
        <>
          <Box at={[0, 0, 0.2]} size={[Math.min(2.2, cw - 0.8), 1.0, 0.65]} color={c.tier === "minimal" ? "#efe9df" : t.wood} />
          <Box at={[0, 1, 0.2]} size={[Math.min(2.3, cw - 0.7), 0.04, 0.72]} color={c.tier === "premium" ? "#f3eee8" : "#e6ddcf"} rough={0.2} />
          <Strip at={[0, 0.02, 0.54]} size={[Math.min(2.2, cw - 0.8), 0.02, 0.02]} c={c} />
        </>
      )}
      {c.on("shelves") && (
        <>
          <Box at={[0, 0, -hz + 0.2]} size={[cw - 0.5, 2.2, 0.4]} color={c.tier === "minimal" ? "#ece6dc" : t.wood} />
          {[0.8, 1.3, 1.8].map((y) => <Strip key={y} at={[0, y, -hz + 0.41]} size={[cw - 0.7, 0.012, 0.012]} c={c} />)}
        </>
      )}
    </>
  );
}

function Trial({ c }: { c: Ctx }) {
  const { cw, cd, t } = c;
  const hz = cd / 2 - WALL_T;
  if (!c.on("booths")) return null;
  const n = Math.max(1, Math.floor((cw - 0.2) / 1.1));
  const bw = (cw - 0.2) / n;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const x = -cw / 2 + 0.1 + bw * (i + 0.5);
        return (
          <group key={i}>
            {i > 0 && <Box at={[x - bw / 2, 0, -hz + 0.6]} size={[0.04, 2.2, 1.2]} color={t.wood} />}
            <Box at={[x, 0, -hz + 1.22]} size={[bw - 0.1, 2.0, 0.03]} color={c.tier === "minimal" ? "#d9cbb6" : "#7a2430"} />
            <Box at={[x, 0.4, -hz + 0.02]} size={[0.5, 1.5, 0.02]} color="#c8d0d4" metal={0.9} rough={0.05} />
          </group>
        );
      })}
    </>
  );
}

function Store({ c }: { c: Ctx }) {
  const { cw, cd } = c;
  if (!c.on("shelves")) return null;
  const rows = Math.max(1, Math.floor((cw - 0.6) / 1.2));
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <group key={i} position={[-cw / 2 + 0.7 + i * 1.2, 0, 0]}>
          {[0, 0.6, 1.2, 1.8].map((y) => <Box key={y} at={[0, y, 0]} size={[0.5, 0.03, cd - 0.8]} color="#8e8a84" metal={0.5} rough={0.4} />)}
          {Array.from({ length: Math.floor((cd - 0.8) / 0.45) }, (_, j) => (
            <Box key={j} at={[0, 0.63, -(cd - 0.8) / 2 + 0.25 + j * 0.45]} size={[0.4, 0.35, 0.35]} color="#c8a878" />
          ))}
        </group>
      ))}
    </>
  );
}

const ceilingKinds = new Set<Kind>(["living", "dining", "bedroom", "kids"]);

export default function Furniture({ kind, c }: { kind: Kind; c: Ctx }) {
  const body = (() => {
    switch (kind) {
      case "living": return <Living c={c} />;
      case "dining": return <Dining c={c} />;
      case "kitchen": return <Kitchen c={c} />;
      case "bedroom": return <Bedroom c={c} />;
      case "kids": return <Bedroom c={c} kids />;
      case "bath": return <Bath c={c} />;
      case "pooja": return <Pooja c={c} />;
      case "balcony": return <Balcony c={c} />;
      case "foyer": return <Foyer c={c} />;
      case "utility": return <Utility c={c} />;
      case "stair": return <Stair c={c} />;
      case "porch": return <Porch c={c} />;
      case "study": return <Study c={c} />;
      case "dress": return <Dress c={c} />;
      case "workspace": return <Workspace c={c} />;
      case "cabin": return <Cabin c={c} />;
      case "meeting": return <Meeting c={c} />;
      case "reception": return <Reception c={c} />;
      case "retail": return <Retail c={c} />;
      case "display": return <Display c={c} />;
      case "counter": return <Counter c={c} />;
      case "trial": return <Trial c={c} />;
      case "store": return <Store c={c} />;
    }
  })();
  return (
    <>
      {body}
      {ceilingKinds.has(kind) && c.on("ceiling") && <Ceiling c={c} />}
    </>
  );
}
