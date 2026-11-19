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
 * Full-width showcase of selected work. The active dash fills as a timer and the next slide fades in over the current one
 * when it completes; the timer pauses off screen and for reduced motion.
 * Only the first slide is mounted until the section is first in view, so the first load fetches one image.
 */
export default function Showcase() {
  const root = useRef<HTMLElement>(null);
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      setInView(e.isIntersecting);
      if (e.isIntersecting) setLoaded(true);
    });
    if (root.current) io.observe(root.current);
    return () => io.disconnect();
  }, []);

  const s = slides[i];
  return (
    <section ref={root} className={`showcase${inView ? "" : " is-paused"}`} aria-label="Selected architecture">
      <div className="showcase-media">
        {slides.map((sl, k) =>
          k === 0 || loaded ? (
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
            <button key={sl.src.src} className={k === i ? "is-on" : ""} aria-label={sl.title} aria-pressed={k === i} onClick={() => setI(k)}>
              {k === i && <i key={i} onAnimationEnd={() => setI((i + 1) % slides.length)} />}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
