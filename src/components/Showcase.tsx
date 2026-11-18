"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import exterior from "../../public/showcase/showcase-1-exterior.jpg";
import entrance from "../../public/showcase/showcase-3-entrance.jpg";
import living from "../../public/showcase/showcase-2-living.jpg";

const slides = [
  { src: exterior, title: "Residence at dusk", kind: "Residential architecture" },
  { src: entrance, title: "Tree of life entrance", kind: "Residence, night entrance" },
  { src: living, title: "Living hall with Srivari niche", kind: "Interior design" },
];

/**
 * Full-width showcase of selected work, cross-fading slowly while on screen. Pauses on hover and for reduced motion.
 * Only slides already shown, plus the next one while the section is in view, are mounted, so the first load fetches one image.
 */
export default function Showcase() {
  const root = useRef<HTMLElement>(null);
  const [i, setI] = useState(0);
  const [seen, setSeen] = useState(0);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    if (root.current) io.observe(root.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || paused || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => {
      const next = (i + 1) % slides.length;
      setI(next);
      setSeen((s) => Math.max(s, next));
    }, 6500);
    return () => clearTimeout(t);
  }, [i, paused, inView]);

  const pick = (k: number) => {
    setI(k);
    setSeen((s) => Math.max(s, k));
  };

  const s = slides[i];
  return (
    <section ref={root} className="showcase" aria-label="Selected architecture" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="showcase-media">
        {slides.map((sl, k) =>
          k <= seen || (inView && k === seen + 1) ? (
            <Image key={sl.src.src} src={sl.src} alt={sl.title} fill sizes="100vw" placeholder="blur" className={k === i ? "is-on" : ""} />
          ) : null,
        )}
      </div>
      <div className="showcase-copy">
        <p className="eyebrow">The art of belonging</p>
        <h2>From sacred inspiration <em>to beautiful living.</em></h2>
        <p className="showcase-line">Homes that hold a family&apos;s rituals, celebrations and quiet mornings, each one designed from the ground up by Dr. Anil Verma.</p>
        <a href="#projects" className="btn btn--gold">Discover our architecture <span aria-hidden="true">↗</span></a>
      </div>
      <div className="showcase-meta">
        <p aria-live="polite">
          <small>
            {String(i + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            <span className="showcase-kind"> · {s.kind}</span>
          </small>
          {s.title}
        </p>
        <div className="showcase-dots" role="group" aria-label="Choose an image">
          {slides.map((sl, k) => (
            <button key={sl.src.src} className={k === i ? "is-on" : ""} aria-label={sl.title} aria-pressed={k === i} onClick={() => pick(k)} />
          ))}
        </div>
      </div>
    </section>
  );
}
