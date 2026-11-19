"use client";

import { useEffect, useRef } from "react";

/** A vertical build film, muted and looping, playing only while it is on screen. */
export default function BuildReel({ src, label }: { src: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.35 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return <video ref={ref} className="reel" src={`${src}#t=0.1`} muted loop playsInline preload="metadata" aria-label={label} />;
}
