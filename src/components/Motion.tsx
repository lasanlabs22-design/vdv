"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

const REVEAL = ".reveal, .reveal-img";

/**
 * Global motion layer: Lenis smooth scrolling, reveal-on-scroll and parallax.
 * Elements opt in by class name or data attribute so pages can stay server components.
 * Reveals use the Web Animations API instead of toggling classes, so nothing React owns is mutated before hydration.
 */
export default function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Anchors land exactly on the section: every section's own top padding already clears the fixed nav.
    lenis = new Lenis({ lerp: 0.09, anchors: true, autoRaf: true });
    return () => {
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!location.hash) lenis?.scrollTo(0, { immediate: true, force: true });

    const timing: KeyframeAnimationOptions = { duration: reduced ? 0 : 1000, fill: "both", easing: "cubic-bezier(.22,.68,.18,1)" };
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const delay = reduced ? 0 : Number(el.dataset.delay || 0);
          // Quiet fades only: the site should feel composed, not animated.
          if (el.matches(".reveal")) el.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { ...timing, delay });
          if (el.matches(".reveal-img")) el.animate([{ opacity: 0 }, { opacity: 1 }], { ...timing, delay, duration: reduced ? 0 : 1400 });
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll(REVEAL).forEach((el) => io.observe(el));

    if (reduced) return () => io.disconnect();

    const layers = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = innerHeight;
      for (const el of layers) {
        const host = el.parentElement;
        if (!host) continue;
        const r = host.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) continue;
        const speed = parseFloat(el.dataset.parallax || "0.1");
        el.style.transform = `translate3d(0, ${((r.top + r.height / 2 - vh / 2) * -speed).toFixed(1)}px, 0)`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return null;
}
