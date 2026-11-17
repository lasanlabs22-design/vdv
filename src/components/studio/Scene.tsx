"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Grid, Html, Lightformer, OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, N8AO, SMAA, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { extent, tiers, type Floor, type Kind, type Room, type Side, type TierId } from "@/lib/plans";
import Furniture, { type Ctx } from "./Furniture";
import { WALL_H, WALL_T, canonical, doorGaps, normals, wallLength } from "./geometry";
import { floorMap, type Finish } from "./surfaces";

/** Rooms that always get tiles, whatever the tier. */
const wetKinds: Kind[] = ["bath", "utility", "balcony", "porch", "kitchen"];

/** A room's chosen style. `wall` and `floor` override the tier's colours (used by the custom builder). */
export type RoomState = { tier: TierId; off: string[]; wall?: string; floor?: string };
export type WallMode = "cutaway" | "full" | "low";

type OrbitCtl = THREE.EventDispatcher<{ start: object }> & { target: THREE.Vector3; update: () => void };

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const SIDES: Side[] = ["n", "s", "e", "w"];

/** Grows its children up out of the floor, `delay` seconds after mounting. */
function Rise({ delay, children }: { delay: number; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    start.current ??= clock.elapsedTime;
    ref.current.scale.y = Math.max(0.001, ease((clock.elapsedTime - start.current - delay) / 1.1));
  });
  return <group ref={ref} scale={[1, 0.001, 1]}>{children}</group>;
}

/** Drops its children into place from above, `delay` seconds after mounting. */
function Drop({ delay, children }: { delay: number; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    start.current ??= clock.elapsedTime;
    const t = (clock.elapsedTime - start.current - delay) / 0.9;
    ref.current.visible = t > 0;
    ref.current.position.y = (1 - ease(t)) * 3;
  });
  return <group ref={ref} visible={false}>{children}</group>;
}

const DOOR_H = 2.1;
const LEAF_OPEN = (70 * Math.PI) / 180;

type Piece = { pos: [number, number, number]; size: [number, number, number] };

/** A wall piece from `a` to `b` metres along a side, between heights y0 and y1. */
function piece(room: Room, side: Side, a: number, b: number, y0: number, y1: number): Piece {
  const mid = (a + b) / 2, l = b - a, h = y1 - y0, y = y0 + h / 2;
  switch (side) {
    case "n": return { pos: [room.x + mid, y, room.z + WALL_T / 2], size: [l, h, WALL_T] };
    case "s": return { pos: [room.x + mid, y, room.z + room.d - WALL_T / 2], size: [l, h, WALL_T] };
    case "w": return { pos: [room.x + WALL_T / 2, y, room.z + mid], size: [WALL_T, h, l] };
    case "e": return { pos: [room.x + room.w - WALL_T / 2, y, room.z + mid], size: [WALL_T, h, l] };
  }
}

/** Hinge point and opening angle for a door leaf standing open into the room. */
function leafFor(room: Room, side: Side, start: number, width: number) {
  const frames: Record<Side, { h: [number, number]; u: [number, number]; v: [number, number] }> = {
    n: { h: [room.x + start, room.z + WALL_T], u: [1, 0], v: [0, 1] },
    s: { h: [room.x + start, room.z + room.d - WALL_T], u: [1, 0], v: [0, -1] },
    w: { h: [room.x + WALL_T, room.z + start], u: [0, 1], v: [1, 0] },
    e: { h: [room.x + room.w - WALL_T, room.z + start], u: [0, 1], v: [-1, 0] },
  };
  const { h, u, v } = frames[side];
  const dx = u[0] * Math.cos(LEAF_OPEN) + v[0] * Math.sin(LEAF_OPEN);
  const dz = u[1] * Math.cos(LEAF_OPEN) + v[1] * Math.sin(LEAF_OPEN);
  return { pos: [h[0], 0, h[1]] as [number, number, number], rot: Math.atan2(-dz, dx), width };
}

function Walls({ room, rooms, color, origin, mode }: { room: Room; rooms: Room[]; color: string; origin: [number, number]; mode: WallMode }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const parapet = room.kind === "balcony" || room.kind === "porch";
  const h = parapet ? 1 : WALL_H;
  // Every doorway is cut through both walls it passes, with a lintel above it on full-height walls.
  const segments = useMemo(() => {
    const gaps = doorGaps(room, rooms);
    return SIDES.map((side) => {
      const len = wallLength(room, side);
      const open = [...gaps[side]].sort((a, b) => a.start - b.start);
      const pieces: Piece[] = [];
      let at = 0;
      for (const g of open) {
        if (g.start - at > 0.02) pieces.push(piece(room, side, at, g.start, 0, h));
        if (h > DOOR_H) pieces.push(piece(room, side, g.start, g.end, DOOR_H, h));
        at = Math.max(at, g.end);
      }
      if (len - at > 0.02) pieces.push(piece(room, side, at, len, 0, h));
      const own = open.find((g) => g.own);
      return { pieces, leaf: own ? leafFor(room, side, own.start, own.end - own.start) : null };
    });
  }, [room, rooms, h]);
  const cx = room.x + room.w / 2 + origin[0];
  const cz = room.z + room.d / 2 + origin[1];

  useFrame(({ camera }, delta) => {
    const k = 1 - Math.exp(-delta * 8);
    const vx = camera.position.x - cx, vz = camera.position.z - cz;
    const len = Math.hypot(vx, vz) || 1;
    SIDES.forEach((side, i) => {
      const g = refs.current[i];
      if (!g) return;
      let target = 1;
      if (!parapet && mode === "low") target = 0.12;
      if (!parapet && mode === "cutaway") {
        const [nx, nz] = normals[side];
        if ((nx * vx + nz * vz) / len > 0.3) target = 0.12;
      }
      g.scale.y += (target - g.scale.y) * k;
    });
  });

  return (
    <>
      {segments.map(({ pieces, leaf }, i) => (
        <group key={SIDES[i]} ref={(el) => { refs.current[i] = el; }}>
          {pieces.map((p, j) => (
            <mesh key={j} position={p.pos} castShadow receiveShadow>
              <boxGeometry args={p.size} />
              <meshStandardMaterial color={parapet ? "#e8dfd1" : color} roughness={0.92} />
            </mesh>
          ))}
          {leaf && (
            <group position={leaf.pos} rotation={[0, leaf.rot, 0]}>
              <mesh position={[leaf.width / 2, (DOOR_H - 0.04) / 2, 0]} castShadow>
                <boxGeometry args={[leaf.width - 0.04, DOOR_H - 0.04, 0.045]} />
                <meshStandardMaterial color="#6b4426" roughness={0.55} />
              </mesh>
              <mesh position={[leaf.width - 0.12, 1.05, 0.04]}>
                <boxGeometry args={[0.03, 0.18, 0.03]} />
                <meshStandardMaterial color="#c9a24c" metalness={0.85} roughness={0.3} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </>
  );
}

function Outline({ room, active, hover }: { room: Room; active: boolean; hover: boolean }) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  useFrame(({ clock }) => {
    mat.color.setRGB(2.2, 1.55, 0.55).multiplyScalar(active ? 0.75 + Math.sin(clock.elapsedTime * 3) * 0.25 : 0.55);
  });
  if (!active && !hover) return null;
  const i = WALL_T + 0.04, w = room.w - i * 2, d = room.d - i * 2, t = 0.05, y = 0.012;
  const bars: [number, number, number, number][] = [
    [room.x + room.w / 2, room.z + i, w, t],
    [room.x + room.w / 2, room.z + room.d - i, w, t],
    [room.x + i, room.z + room.d / 2, t, d],
    [room.x + room.w - i, room.z + room.d / 2, t, d],
  ];
  return (
    <>
      {bars.map(([x, z, bw, bd], k) => (
        <mesh key={k} position={[x, y, z]} material={mat}>
          <boxGeometry args={[bw, 0.01, bd]} />
        </mesh>
      ))}
    </>
  );
}

function RoomView(props: {
  room: Room; rooms: Room[]; index: number; state: RoomState; active: boolean; hover: boolean; label: boolean; dusk: boolean; mode: WallMode; origin: [number, number];
  onSelect: (id: string) => void; onHover: (id: string | null) => void;
}) {
  const { room, index, state, active, hover, dusk, mode, origin } = props;
  const tier = tiers[state.tier];
  const { cw, cd, rotY } = canonical(room);
  const cx = room.x + room.w / 2, cz = room.z + room.d / 2;
  const ctx: Ctx = { cw, cd, t: tier, tier: state.tier, on: (f) => !state.off.includes(f), glow: tier.glow * (dusk ? 2.2 : 1), dusk };
  const finish: Finish = wetKinds.includes(room.kind) ? "tile" : state.tier === "premium" ? "marble" : state.tier === "signature" ? "wood" : "tile";
  const map = useMemo(() => floorMap(finish, room.w, room.d), [finish, room.w, room.d]);
  useEffect(() => () => map.dispose(), [map]);

  return (
    <group
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta > 6) return;
        e.stopPropagation();
        props.onSelect(room.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        props.onHover(room.id);
      }}
      onPointerOut={() => props.onHover(null)}
    >
      <mesh position={[cx, -0.03, cz]} receiveShadow>
        <boxGeometry args={[room.w, 0.06, room.d]} />
        <meshStandardMaterial color={state.floor ?? tier.floor} map={map} roughness={finish === "wood" ? 0.45 : tier.rough} metalness={state.tier === "premium" ? 0.05 : 0} envMapIntensity={finish === "marble" ? 1.4 : 1} />
      </mesh>
      {state.tier === "premium" && room.w > 1.6 && room.d > 1.6 && (
        <mesh position={[cx, 0.002, cz]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.min(room.w, room.d) * 0.28, Math.min(room.w, room.d) * 0.28 + 0.04, 64]} />
          <meshStandardMaterial color={tier.accent} metalness={0.8} roughness={0.3} />
        </mesh>
      )}
      <Rise delay={0.15 + index * 0.06}>
        <Walls room={room} rooms={props.rooms} color={state.wall ?? tier.wall} origin={origin} mode={mode} />
      </Rise>
      <Drop delay={0.8 + index * 0.08}>
        <group position={[cx, 0, cz]} rotation={[0, rotY, 0]}>
          <Suspense fallback={null}>
            <Furniture kind={room.kind} c={ctx} />
          </Suspense>
        </group>
      </Drop>
      <Outline room={room} active={active} hover={hover} />
      <pointLight position={[cx, 2.2, cz]} intensity={dusk ? 1.5 + tier.glow * 2.2 : 0} distance={Math.max(room.w, room.d) * 1.7} decay={1.5} color="#ffc98a" />
      {props.label && (active || hover) && (
        <Html position={[cx, WALL_H + 0.45, cz]} center className="scene-tag" zIndexRange={[20, 0]}>
          {room.name}
        </Html>
      )}
    </group>
  );
}

function Lights({ dusk, size }: { dusk: boolean; size: number }) {
  const amb = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const bgDay = useMemo(() => new THREE.Color("#efe6d8"), []);
  const bgDusk = useMemo(() => new THREE.Color("#120d09"), []);

  // Time-based easing, so the change takes the same time on a slow phone as on a fast desktop.
  useFrame(({ scene }, delta) => {
    const k = 1 - Math.exp(-delta * 3.5);
    if (amb.current) amb.current.intensity += ((dusk ? 0.08 : 0.25) - amb.current.intensity) * k;
    if (hemi.current) hemi.current.intensity += ((dusk ? 0.1 : 0.85) - hemi.current.intensity) * k;
    if (sun.current) sun.current.intensity += ((dusk ? 0.12 : 2.1) - sun.current.intensity) * k;
    scene.environmentIntensity += ((dusk ? 0.12 : 0.55) - scene.environmentIntensity) * k;
    if (scene.background instanceof THREE.Color) scene.background.lerp(dusk ? bgDusk : bgDay, k);
  });

  return (
    <>
      <color attach="background" args={["#efe6d8"]} />
      <ambientLight ref={amb} color="#ffe2b8" intensity={0.25} />
      <hemisphereLight ref={hemi} args={["#fff4e2", "#5b4a39", 0.85]} />
      <directionalLight ref={sun} castShadow position={[size * 0.5, size * 1.2, size * 0.7]} intensity={2.1} color="#fff1dc" shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}>
        <orthographicCamera attach="shadow-camera" args={[-size, size, size, -size, 0.5, size * 4]} />
      </directionalLight>
    </>
  );
}

/** Eases the camera to the whole plan or to the selected room. Any drag by the visitor cancels the move. */
function Rig({ focus, size, nonce }: { focus: { x: number; z: number; s: number } | null; size: number; nonce: string }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitCtl | null;
  const goal = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const fx = focus?.x, fz = focus?.z, fs = focus?.s;

  useEffect(() => {
    const target = fx === undefined ? new THREE.Vector3(0, 0.3, 0) : new THREE.Vector3(fx, 0.5, fz);
    const span = fs === undefined ? size * 0.9 + 3 : fs * 1.3 + 3;
    const dir = new THREE.Vector3(0.5, 0, 0.86);
    if (fx !== undefined && controls) {
      const cur = camera.position.clone().sub(controls.target).setY(0);
      if (cur.lengthSq() > 0.01) dir.copy(cur.normalize());
    }
    goal.current = { target, pos: target.clone().addScaledVector(dir, span * 0.6).setY(target.y + span * 0.85) };
  }, [fx, fz, fs, size, nonce, camera, controls]);

  useEffect(() => {
    if (!controls) return;
    const cancel = () => (goal.current = null);
    controls.addEventListener("start", cancel);
    return () => controls.removeEventListener("start", cancel);
  }, [controls]);

  useFrame((_, delta) => {
    const g = goal.current;
    if (!g || !controls) return;
    const k = 1 - Math.exp(-delta * 3.5);
    camera.position.lerp(g.pos, k);
    controls.target.lerp(g.target, k);
    controls.update();
    if (camera.position.distanceTo(g.pos) < 0.02) goal.current = null;
  });
  return null;
}

export default function Scene(props: {
  floor: Floor; design: Record<string, RoomState>; selected: string | null; onSelect: (id: string) => void;
  dusk: boolean; walls: WallMode; animKey: string; viewNonce: number;
  /** Fixed footprint to centre on, e.g. the plot in the builder, so the view stays put while rooms move. */
  bounds?: { w: number; d: number };
  /**
   * Floating room-name tags. They are DOM nodes placed beside the canvas, so they are turned off where the
   * canvas mounts and unmounts often (the builder): removing it mid-label broke React's cleanup.
   */
  labels?: boolean;
}) {
  const { floor, design, selected, dusk, walls, animKey } = props;
  const [hover, setHover] = useState<string | null>(null);
  // Ambient occlusion and anti-aliasing passes; dropped if the device cannot hold a smooth frame rate.
  const [hq, setHq] = useState(true);
  const { w, d } = props.bounds ?? extent(floor);
  const origin: [number, number] = [-w / 2, -d / 2];
  const size = Math.max(w, d);
  const sel = floor.rooms.find((r) => r.id === selected);
  const focus = sel ? { x: sel.x + sel.w / 2 + origin[0], z: sel.z + sel.d / 2 + origin[1], s: Math.max(sel.w, sel.d) } : null;

  useEffect(() => {
    document.body.style.cursor = hover ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hover]);

  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [size * 1.6, size * 1.8, size * 2.2], fov: 38, near: 0.1, far: 300 }}>
      <PerformanceMonitor onDecline={() => setHq(false)} />
      {hq && (
        <EffectComposer multisampling={0}>
          <N8AO halfRes aoRadius={0.9} distanceFalloff={0.8} intensity={2.4} color="#2a1d12" />
          <SMAA />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
      <Lights dusk={dusk} size={size} />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={2} position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={[14, 14, 1]} />
        <Lightformer intensity={1.4} color="#ffd9a0" position={[-8, 3, 6]} scale={[8, 4, 1]} />
        <Lightformer intensity={1} position={[8, 3, -6]} scale={[8, 4, 1]} />
      </Environment>

      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[w + 1.4, 0.08, d + 1.4]} />
        <meshStandardMaterial color={dusk ? "#2a2018" : "#e2d6c3"} roughness={0.95} />
      </mesh>
      <Grid
        position={[0, -0.14, 0]}
        args={[80, 80]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor={dusk ? "#3a2c1c" : "#d8c7a8"}
        sectionSize={2.5}
        sectionThickness={1.1}
        sectionColor={dusk ? "#8a6a2c" : "#c49a45"}
        fadeDistance={size * 4 + 20}
        fadeStrength={1.6}
        infiniteGrid
      />

      <group position={[origin[0], 0, origin[1]]} key={animKey}>
        {floor.rooms.map((room, i) => (
          <RoomView
            key={room.id}
            room={room}
            rooms={floor.rooms}
            index={i}
            state={design[room.id]}
            active={room.id === selected}
            hover={room.id === hover}
            label={props.labels ?? true}
            dusk={dusk}
            mode={walls}
            origin={origin}
            onSelect={props.onSelect}
            onHover={setHover}
          />
        ))}
      </group>

      <OrbitControls makeDefault enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI * 0.46} minDistance={2.5} maxDistance={size * 4 + 10} />
      <Rig focus={focus} size={size} nonce={`${animKey}-${props.viewNonce}`} />
    </Canvas>
  );
}
