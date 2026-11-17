"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { hdSrc, heroSrc, projects, type Project } from "@/lib/projects";

const GalleryRoom = dynamic(() => import("./GalleryRoom"), { ssr: false });

type View = { x: number; y: number; s: number };
type Size = { w: number; h: number };

/** Most screen pixels one board pixel may cover when a room is framed. Past this the render turns soft. */
const MAX_MAG = 2;

/** Scale and offset that frame a board rectangle inside the stage, with a small margin. */
function frame(pr: Project, rect: [number, number, number, number], size: Size): View {
  const [W, H] = pr.board;
  const f = Math.min(size.w / W, size.h / H);
  const [rx, ry, rw, rh] = rect;
  const fit = Math.min(size.w / (rw * f), size.h / (rh * f)) * (rw === W ? 1 : 0.94);
  const s = Math.max(1, Math.min(fit, MAX_MAG / f));
  // Centre the room, but never pull a board edge into view while the board is larger than the stage.
  const clamp = (v: number, stage: number, img: number) => (img <= stage ? (stage - img) / 2 : Math.min(0, Math.max(stage - img, v)));
  return {
    s,
    x: clamp(size.w / 2 - (rx + rw / 2) * f * s, size.w, W * f * s),
    y: clamp(size.h / 2 - (ry + rh / 2) * f * s, size.h, H * f * s),
  };
}

export default function Projects() {
  const [idx, setIdx] = useState(0);
  const [panel, setPanel] = useState(-1); // -1 is the whole board
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });
  const [manual, setManual] = useState<View | null>(null);
  const [dragging, setDragging] = useState(false);
  const [full, setFull] = useState(false);
  const [gallery, setGallery] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pr = projects[idx];
  const [W, H] = pr.board;
  const f = size.w ? Math.min(size.w / W, size.h / H) : 0;
  const view = manual ?? (size.w ? frame(pr, panel < 0 ? [0, 0, W, H] : pr.panels[panel].rect, size) : { x: 0, y: 0, s: 1 });
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  });

  const choose = (i: number) => {
    setIdx(i);
    setPanel(-1);
    setManual(null);
  };
  const go = useCallback((i: number) => {
    setPanel(i);
    setManual(null);
  }, []);
  const step = (dir: number) => go(((panel + 1 + dir + pr.panels.length + 1) % (pr.panels.length + 1)) - 1);

  // The stage's pixel size drives the fit; a resize returns to the framed view.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setSize({ w: e.contentRect.width, h: e.contentRect.height });
      setManual(null);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Zoom by `k` around a point in stage pixels. */
  const zoomAt = useCallback((k: number, cx: number, cy: number) => {
    const v = viewRef.current;
    const s = Math.min(8, Math.max(0.8, v.s * k));
    const r = s / v.s;
    setManual({ s, x: cx - (cx - v.x) * r, y: cy - (cy - v.y) * r });
  }, []);

  // Wheel zoom needs a non-passive listener to keep the page from scrolling under it.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const b = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - b.left, e.clientY - b.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const onDown = (e: React.PointerEvent) => {
    stage.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setDragging(true);
  };
  const onMove = (e: React.PointerEvent) => {
    const map = pointers.current;
    const prev = map.get(e.pointerId);
    if (!prev) return;
    const v = viewRef.current;
    if (map.size === 2) {
      // Pinch: scale by the change in finger distance, around their midpoint.
      const other = [...map.entries()].find(([id]) => id !== e.pointerId)![1];
      const d0 = Math.hypot(prev.x - other.x, prev.y - other.y);
      const d1 = Math.hypot(e.clientX - other.x, e.clientY - other.y);
      const b = stage.current!.getBoundingClientRect();
      map.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (d0 > 0) zoomAt(d1 / d0, (e.clientX + other.x) / 2 - b.left, (e.clientY + other.y) / 2 - b.top);
      return;
    }
    map.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setManual({ ...v, x: v.x + e.clientX - prev.x, y: v.y + e.clientY - prev.y });
  };
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) setDragging(false);
  };

  const toggleFull = () => (document.fullscreenElement ? document.exitFullscreen() : root.current?.requestFullscreen());
  const label = panel < 0 ? "Full design board" : pr.panels[panel].label;

  return (
    <div className={`pstudio${full ? " is-full" : ""}`} ref={root}>
      <div className="pstudio-rail" role="tablist" aria-label="Projects">
        {projects.map((p, i) => (
          <button key={p.slug} role="tab" aria-selected={i === idx} className={`pstudio-pick${i === idx ? " is-on" : ""}`} onClick={() => choose(i)}>
            <span className="pstudio-thumb">
              <Image src={heroSrc(p)} alt="" fill sizes="96px" />
            </span>
            <span>
              <small>{p.group}</small>
              {p.title}
            </span>
          </button>
        ))}
      </div>

      <div className="pstudio-main">
        <div
          ref={stage}
          className={`pstudio-stage${dragging ? " is-drag" : manual ? " is-free" : ""}`}
          tabIndex={0}
          aria-label={`${pr.title}: ${label}. Drag to pan, scroll or pinch to zoom, arrow keys to move between rooms.`}
          data-lenis-prevent
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onDoubleClick={(e) => {
            const b = stage.current!.getBoundingClientRect();
            zoomAt(2, e.clientX - b.left, e.clientY - b.top);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") step(1);
            if (e.key === "ArrowLeft") step(-1);
          }}
        >
          {f > 0 && (
            <div className="pstudio-canvas" style={{ width: W * f, height: H * f, transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})` }}>
              <Image key={pr.slug} src={hdSrc(pr)} alt={`${pr.title} design board by Dr. Anil Verma`} width={W} height={H} unoptimized draggable={false} />
              {/* Gold outline on the chosen room, with the rest of the board dimmed. */}
              {panel >= 0 && (
                <span
                  key={`${pr.slug}-${panel}`}
                  className="pstudio-spot"
                  style={{
                    left: pr.panels[panel].rect[0] * f,
                    top: pr.panels[panel].rect[1] * f,
                    width: pr.panels[panel].rect[2] * f,
                    height: pr.panels[panel].rect[3] * f,
                    borderWidth: 2 / view.s,
                  }}
                />
              )}
            </div>
          )}
          <span className="pstudio-label" aria-live="polite">{label}</span>
          <div className="pstudio-tools" onPointerDown={(e) => e.stopPropagation()}>
            <button onClick={() => zoomAt(1.4, size.w / 2, size.h / 2)} aria-label="Zoom in">+</button>
            <button onClick={() => zoomAt(1 / 1.4, size.w / 2, size.h / 2)} aria-label="Zoom out">−</button>
            <button onClick={toggleFull} aria-label={full ? "Exit full screen" : "Full screen"}>{full ? "⤡" : "⤢"}</button>
          </div>
          <button className="pstudio-arrow pstudio-arrow--prev" onPointerDown={(e) => e.stopPropagation()} onClick={() => step(-1)} aria-label="Previous room">←</button>
          <button className="pstudio-arrow pstudio-arrow--next" onPointerDown={(e) => e.stopPropagation()} onClick={() => step(1)} aria-label="Next room">→</button>
        </div>

        <div className="pstudio-panels" role="tablist" aria-label="Rooms on this board">
          <button role="tab" aria-selected={panel < 0} className={panel < 0 ? "is-on" : ""} onClick={() => go(-1)}>Full board</button>
          {pr.panels.map((pn, i) => (
            <button key={pn.label + i} role="tab" aria-selected={panel === i} className={panel === i ? "is-on" : ""} onClick={() => go(i)}>{pn.label}</button>
          ))}
        </div>

        <div className="pstudio-info">
          <div>
            <small>{pr.group}</small>
            <h3>{pr.title}</h3>
            <p>{pr.line}</p>
          </div>
          <div className="pstudio-actions">
            {pr.plan && <Link href={`/studio?type=${pr.plan}`} className="btn btn--ghost">Shape this plan in 3D</Link>}
            <button className="btn btn--gold" onClick={() => setGallery(true)}>Walk the gallery in 3D</button>
          </div>
        </div>
      </div>

      {gallery && (
        <GalleryRoom
          start={idx}
          onClose={() => setGallery(false)}
          onOpen={(i) => {
            setGallery(false);
            choose(i);
            root.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      )}
    </div>
  );
}
