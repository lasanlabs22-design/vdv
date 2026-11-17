"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { getLenis } from "./Motion";

export type Slide = { src: string; title: string; label: string; w: number; h: number; action?: React.ReactNode };

/** Full-screen viewer with arrow keys, swipe and Escape. `index` is null while closed. */
export default function Lightbox({ slides, index, onIndex }: { slides: Slide[]; index: number | null; onIndex: (i: number | null) => void }) {
  const swipe = useRef<number | null>(null);
  const n = slides.length;
  const step = (dir: number) => index !== null && onIndex((index + dir + n) % n);

  useEffect(() => {
    if (index === null) return;
    getLenis()?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onIndex(null);
      if (e.key === "ArrowRight") onIndex((index + 1) % n);
      if (e.key === "ArrowLeft") onIndex((index - 1 + n) % n);
    };
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      getLenis()?.start();
    };
  }, [index, n, onIndex]);

  if (index === null) return null;
  const s = slides[index];

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={s.title}
      onClick={(e) => e.target === e.currentTarget && onIndex(null)}
      onPointerDown={(e) => (swipe.current = e.clientX)}
      onPointerUp={(e) => {
        if (swipe.current === null) return;
        const dx = e.clientX - swipe.current;
        swipe.current = null;
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      }}
    >
      <figure key={s.src}>
        <Image src={s.src} alt={s.title} width={s.w} height={s.h} sizes="92vw" quality={85} />
        <figcaption>
          <small>{s.label}</small>
          {s.title}
          {s.action}
          <span>{index + 1} / {n}</span>
        </figcaption>
      </figure>
      <button className="lightbox-btn lightbox-prev" onClick={() => step(-1)} aria-label="Previous">←</button>
      <button className="lightbox-btn lightbox-next" onClick={() => step(1)} aria-label="Next">→</button>
      <button className="lightbox-close" onClick={() => onIndex(null)} aria-label="Close">✕</button>
    </div>
  );
}
