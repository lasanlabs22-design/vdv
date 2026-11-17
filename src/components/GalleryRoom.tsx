"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, MeshReflectorMaterial, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { boardSrc, projects } from "@/lib/projects";
import { getLenis } from "./Motion";

// A nine-sided stone hall, one wall per design board, with the visitor standing at its centre.
const N = projects.length;
const R = 7; // centre to the middle of each wall, metres
const EYE = 1.6;
const FRAME_W = 3.6;
const FRAME_Y = 2.1;
const WALL_H = 5.2;
const angle = (i: number) => (i / N) * Math.PI * 2;

/** Warm sandstone, drawn once. */
function stoneTexture() {
  const s = 512;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  g.fillStyle = "#6d5a45";
  g.fillRect(0, 0, s, s);
  const img = g.getImageData(0, 0, s, s);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 26;
    img.data[i] += n;
    img.data[i + 1] += n * 0.9;
    img.data[i + 2] += n * 0.8;
  }
  g.putImageData(img, 0, 0);
  // Ashlar courses: horizontal joints and staggered vertical ones.
  g.strokeStyle = "rgba(30,20,12,0.55)";
  g.lineWidth = 3;
  for (let row = 0; row < 4; row++) {
    const y = row * (s / 4);
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(s, y);
    g.stroke();
    for (let k = 0; k < 2; k++) {
      const x = ((k + (row % 2) * 0.5) * s) / 2;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x, y + s / 4);
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2.5);
  return t;
}

/** Gold lettering on a dark plaque, as a texture. */
function plaqueTexture(title: string, group: string) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 160;
  const g = c.getContext("2d")!;
  g.fillStyle = "#120d08";
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = "#c9a24c";
  g.lineWidth = 4;
  g.strokeRect(6, 6, c.width - 12, c.height - 12);
  const serif = getComputedStyle(document.documentElement).getPropertyValue("--font-playfair") || "serif";
  g.textAlign = "center";
  g.fillStyle = "#c9a24c";
  g.font = `600 26px sans-serif`;
  g.fillText(group.toUpperCase().split("").join(" "), c.width / 2, 52);
  g.fillStyle = "#f3dfa8";
  g.font = `700 52px ${serif}`;
  g.fillText(title, c.width / 2, 120);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Hall({ reflect }: { reflect: boolean }) {
  const stone = useMemo(() => stoneTexture(), []);
  const wallW = 2 * R * Math.tan(Math.PI / N) + 0.02;
  return (
    <>
      {Array.from({ length: N }, (_, i) => {
        const a = angle(i);
        return (
          <group key={i} position={[R * Math.sin(a), 0, -R * Math.cos(a)]} rotation={[0, -a, 0]}>
            <mesh position={[0, WALL_H / 2, 0]}>
              <planeGeometry args={[wallW, WALL_H]} />
              <meshStandardMaterial map={stone} roughness={0.9} />
            </mesh>
            {/* Gold dado and cornice bands. */}
            <mesh position={[0, 0.5, 0.02]}>
              <boxGeometry args={[wallW, 0.06, 0.04]} />
              <meshStandardMaterial color="#c9a24c" metalness={0.9} roughness={0.3} />
            </mesh>
            <mesh position={[0, WALL_H - 0.4, 0.04]}>
              <boxGeometry args={[wallW, 0.18, 0.08]} />
              <meshStandardMaterial color="#8a6824" metalness={0.8} roughness={0.35} />
            </mesh>
          </group>
        );
      })}

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[R / Math.cos(Math.PI / N) + 0.1, N, Math.PI / N]} />
        {reflect ? (
          <MeshReflectorMaterial resolution={512} blur={[300, 80]} mixBlur={1} mixStrength={1.4} roughness={0.75} depthScale={1} minDepthThreshold={0.4} maxDepthThreshold={1.2} color="#2a2018" metalness={0.5} mirror={0.5} />
        ) : (
          <meshStandardMaterial color="#2a2018" roughness={0.35} metalness={0.3} />
        )}
      </mesh>

      <mesh position={[0, WALL_H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[R / Math.cos(Math.PI / N) + 0.1, N, Math.PI / N]} />
        <meshStandardMaterial color="#1a130d" roughness={1} />
      </mesh>
      {/* Cove light ring in the ceiling. */}
      <mesh position={[0, WALL_H - 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3, 0.05, 8, 72]} />
        <meshBasicMaterial color={[2.4, 1.7, 0.8]} toneMapped={false} />
      </mesh>

      {/* Brass deepam on a stone pedestal at the centre of the hall. */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.38, 0.5, 0.9, 32]} />
          <meshStandardMaterial color="#5c4a38" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.98, 0]}>
          <cylinderGeometry args={[0.32, 0.12, 0.16, 32]} />
          <meshStandardMaterial color="#d4a94e" metalness={0.95} roughness={0.25} />
        </mesh>
        <mesh position={[0, 1.13, 0]}>
          <coneGeometry args={[0.035, 0.14, 16]} />
          <meshBasicMaterial color={[3, 1.8, 0.6]} toneMapped={false} />
        </mesh>
        <pointLight position={[0, 1.25, 0]} color="#ffb860" intensity={3} distance={6} decay={1.6} />
      </group>
    </>
  );
}

function Frame({ i, focused, onPick }: { i: number; focused: boolean; onPick: (i: number) => void }) {
  const pr = projects[i];
  const map = useTexture(boardSrc(pr), (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
  });
  const plaque = useMemo(() => plaqueTexture(pr.title, pr.group), [pr.title, pr.group]);
  const a = angle(i);
  const h = FRAME_W * (pr.board[1] / pr.board[0]);
  const target = useMemo(() => new THREE.Object3D(), []);
  return (
    <group position={[(R - 0.08) * Math.sin(a), 0, -(R - 0.08) * Math.cos(a)]} rotation={[0, -a, 0]}>
      <group position={[0, FRAME_Y, 0]}>
        <mesh position={[0, 0, -0.03]}>
          <boxGeometry args={[FRAME_W + 0.34, h + 0.34, 0.08]} />
          <meshStandardMaterial color="#c9a24c" metalness={0.9} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[FRAME_W + 0.14, h + 0.14]} />
          <meshStandardMaterial color="#0d0905" roughness={0.9} />
        </mesh>
        <mesh
          position={[0, 0, 0.02]}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (e.delta > 6) return;
            e.stopPropagation();
            onPick(i);
          }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "")}
        >
          <planeGeometry args={[FRAME_W, h]} />
          <meshBasicMaterial map={map} toneMapped={false} />
        </mesh>
        <mesh position={[0, -h / 2 - 0.42, 0.02]}>
          <planeGeometry args={[1.9, 0.3]} />
          <meshBasicMaterial map={plaque} toneMapped={false} />
        </mesh>
        {/* Brass picture light above the frame. */}
        <mesh position={[0, h / 2 + 0.36, 0.22]}>
          <boxGeometry args={[1.4, 0.06, 0.12]} />
          <meshStandardMaterial color="#d4a94e" metalness={0.9} roughness={0.3} emissive="#ffb860" emissiveIntensity={focused ? 0.6 : 0.25} />
        </mesh>
      </group>
      <primitive object={target} position={[0, FRAME_Y, 0]} />
      <spotLight position={[0, FRAME_Y + h / 2 + 1.2, 1.6]} target={target} angle={0.75} penumbra={0.8} intensity={focused ? 26 : 16} distance={7} decay={1.5} color="#ffe2b0" />
    </group>
  );
}

/** First-person look-around: drag to turn; picking a frame walks up to it. */
function Rig({ focus, yaw, pitch }: { focus: number | null; yaw: React.RefObject<number>; pitch: React.RefObject<number> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const pos = useMemo(() => new THREE.Vector3(0, EYE, 0), []);
  const goal = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    const k = 1 - Math.exp(-delta * 3);
    if (focus === null) goal.set(0, EYE, 0);
    else {
      const pr = projects[focus];
      const a = angle(focus);
      // Frame, plaque and room for the caption bar below.
      const h = FRAME_W * (pr.board[1] / pr.board[0]) + 2.6;
      const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      // Stand back far enough for the frame and plaque to fit both ways.
      const d = Math.max(h / 2 / t, (FRAME_W + 0.8) / 2 / (t * camera.aspect));
      const r = Math.max(0, R - d);
      goal.set(r * Math.sin(a), FRAME_Y - 0.25, -r * Math.cos(a));
    }
    pos.lerp(goal, k);
    camera.position.copy(pos);
    camera.rotation.set(pitch.current, -yaw.current, 0, "YXZ");
  });
  return null;
}

export default function GalleryRoom({ start, onClose, onOpen }: { start: number; onClose: () => void; onOpen: (i: number) => void }) {
  const [focus, setFocus] = useState<number | null>(null);
  const [current, setCurrent] = useState(start);
  const yaw = useRef(angle(start));
  const pitch = useRef(0.05);
  const goalYaw = useRef<number | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [reflect] = useState(() => matchMedia("(pointer: fine)").matches);

  const pick = (i: number) => {
    setFocus(i);
    setCurrent(i);
    // Turn the short way round to face the frame.
    const target = angle(i);
    const diff = Math.atan2(Math.sin(target - yaw.current), Math.cos(target - yaw.current));
    goalYaw.current = yaw.current + diff;
  };
  const step = (dir: number) => pick((current + dir + N) % N);

  useEffect(() => {
    getLenis()?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      getLenis()?.start();
      document.body.style.cursor = "";
    };
  }, [onClose]);

  // Ease the turn toward a picked frame; any drag takes over.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (goalYaw.current !== null && !drag.current) {
        yaw.current += (goalYaw.current - yaw.current) * 0.08;
        pitch.current += (0 - pitch.current) * 0.08;
        if (Math.abs(goalYaw.current - yaw.current) < 0.001) goalYaw.current = null;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const pr = projects[current];

  return (
    <div className="groom" role="dialog" aria-modal="true" aria-label="3D gallery of projects" data-lenis-prevent>
      <div
        className="groom-canvas"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY };
          goalYaw.current = null;
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          yaw.current -= (e.clientX - drag.current.x) * 0.0042;
          pitch.current = Math.max(-0.5, Math.min(0.5, pitch.current - (e.clientY - drag.current.y) * 0.003));
          drag.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerLeave={() => (drag.current = null)}
      >
        <Canvas dpr={[1, 1.75]} camera={{ fov: 60, near: 0.05, far: 60, position: [0, EYE, 0] }}>
          <color attach="background" args={["#0b0805"]} />
          <fog attach="fog" args={["#0b0805", 9, 22]} />
          <ambientLight intensity={0.35} color="#ffe2b8" />
          <hemisphereLight args={["#ffe9c6", "#2a1d12", 0.45]} />
          <Environment resolution={64} frames={1}>
            <Lightformer intensity={1.5} color="#ffd9a0" position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
          </Environment>
          <Suspense fallback={null}>
            <Hall reflect={reflect} />
            {projects.map((p, i) => <Frame key={p.slug} i={i} focused={focus === i} onPick={pick} />)}
          </Suspense>
          <Rig focus={focus} yaw={yaw} pitch={pitch} />
        </Canvas>
      </div>

      <div className="groom-top">
        <p className="eyebrow">The DV gallery</p>
        <button className="groom-close" onClick={onClose} aria-label="Close the 3D gallery">✕</button>
      </div>

      <div className="groom-bar">
        <button className="groom-arrow" onClick={() => step(-1)} aria-label="Previous project">←</button>
        <div className="groom-caption">
          <small>{pr.group} · {current + 1} / {N}</small>
          <b>{pr.title}</b>
        </div>
        <button className="groom-arrow" onClick={() => step(1)} aria-label="Next project">→</button>
        <div className="groom-actions">
          {focus !== null && <button className="btn btn--ghost" onClick={() => setFocus(null)}>Back to centre</button>}
          {focus === null ? (
            <button className="btn btn--gold" onClick={() => pick(current)}>Walk up to it</button>
          ) : (
            <button className="btn btn--gold" onClick={() => onOpen(current)}>Explore the rooms</button>
          )}
        </div>
      </div>
      <p className="groom-hint">Drag to look around · Tap a frame to walk up to it</p>
    </div>
  );
}
