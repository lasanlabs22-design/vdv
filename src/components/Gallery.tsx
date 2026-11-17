"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { workCategories, works, type WorkCategory } from "@/lib/works";
import Lightbox from "./Lightbox";

/** One-screen gallery: categories on the left, one large render with its title, and a strip of the rest. */
export default function Gallery({ intro }: { intro: React.ReactNode }) {
  const [filter, setFilter] = useState<WorkCategory | "All">("All");
  const [cur, setCur] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const list = filter === "All" ? works : works.filter((w) => w.category === filter);
  const w = list[cur];

  const go = (i: number) => setCur((i + list.length) % list.length);

  // Keep the chosen thumbnail in view inside the strip, without moving the page.
  useEffect(() => {
    const el = strip.current?.children[cur] as HTMLElement | undefined;
    if (!el || !strip.current) return;
    const s = strip.current;
    s.scrollTo({ left: el.offsetLeft - s.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [cur, filter]);

  return (
    <div className="wk">
      <div className="wk-side">
        {intro}
        <div className="wk-cats" role="tablist" aria-label="Filter projects">
          {(["All", ...workCategories] as const).map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={filter === c}
              className={filter === c ? "is-on" : ""}
              onClick={() => {
                setFilter(c);
                setCur(0);
              }}
            >
              {c}
              <small>{c === "All" ? works.length : works.filter((x) => x.category === c).length}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="wk-main">
        <button className="wk-stage" onClick={() => setOpen(cur)} aria-label={`Open ${w.title} full screen`}>
          {/* The same render blurred behind it, so tall and wide images both fill the frame without cropping. */}
          <Image key={`bg-${w.src}`} src={w.src} alt="" fill sizes="40vw" className="wk-bg" />
          <Image key={w.src} src={w.src} alt={w.title} fill sizes="(max-width: 900px) 100vw, 70vw" quality={85} className="wk-img" />
          <span className="wk-cap">
            <small>{w.category} · {String(cur + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}</small>
            {w.title}
          </span>
          <span className="wk-zoom" aria-hidden="true">⤢</span>
        </button>
        <button className="wk-arrow wk-arrow--prev" onClick={() => go(cur - 1)} aria-label="Previous project">←</button>
        <button className="wk-arrow wk-arrow--next" onClick={() => go(cur + 1)} aria-label="Next project">→</button>

        <div className="wk-strip" ref={strip} role="tablist" aria-label="Projects">
          {list.map((x, i) => (
            <button key={x.src} role="tab" aria-selected={i === cur} className={i === cur ? "is-on" : ""} onClick={() => setCur(i)} aria-label={x.title}>
              <Image src={x.src} alt="" fill sizes="120px" />
            </button>
          ))}
        </div>
      </div>

      <Lightbox slides={list.map((x) => ({ ...x, label: x.category }))} index={open} onIndex={(i) => { setOpen(i); if (i !== null) setCur(i); }} />
    </div>
  );
}
