"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  { src: "/showcase/showcase-1-exterior.jpg", title: "Residence at dusk", kind: "Residential architecture" },
  { src: "/showcase/showcase-3-entrance.jpg", title: "Tree of life entrance", kind: "Residence, night entrance" },
  { src: "/showcase/showcase-2-living.jpg", title: "Living hall with Srivari niche", kind: "Interior design" },
];

/** Full-width showcase of selected work, cross-fading slowly. Pauses on hover and for reduced motion. */
export default function Showcase() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setI((n) => (n + 1) % slides.length), 6500);
    return () => clearTimeout(t);
  }, [i, paused]);

  const s = slides[i];
  return (
    <section className="showcase" aria-label="Selected architecture" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="showcase-media">
        {slides.map((sl, k) => (
          <Image key={sl.src} src={sl.src} alt={sl.title} fill sizes="100vw"className={k === i ? "is-on" : ""} />
        ))}
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
            <button key={sl.src} className={k === i ? "is-on" : ""} aria-label={sl.title} aria-pressed={k === i} onClick={() => setI(k)} />
          ))}
        </div>
      </div>
    </section>
  );
}
