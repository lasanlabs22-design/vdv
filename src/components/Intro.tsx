"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";

export default function Intro() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [phase, setPhase] = useState<"closed" | "opening" | "darshan">("closed");
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const open = () => {
      setPhase("closed");
      el.showModal();
      document.documentElement.classList.add("darshan-active");
    };
    if (!document.documentElement.classList.contains("intro-seen")) open();
    window.addEventListener("dv-replay", open);
    return () => {
      window.removeEventListener("dv-replay", open);
      document.documentElement.classList.remove("darshan-active");
    };
  }, []);

  useEffect(() => {
    if (!ready || phase === "darshan") return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => setPhase(phase === "closed" ? "opening" : "darshan"), reduced ? 100 : phase === "closed" ? 1800 : 2600);
    return () => clearTimeout(timer);
  }, [ready, phase]);

  const finish = () => {
    dialog.current?.close();
    document.documentElement.classList.remove("darshan-active");
    document.getElementById("divine-title")?.focus({ preventScroll: true });
  };

  return (
    <dialog ref={dialog} className={`temple-experience temple-experience--${phase}${paused ? " atmosphere-paused" : ""}`} aria-label="Welcome, a moment with Lord Venkateshwara" onCancel={finish} data-lenis-prevent>
      <div className="temple-atmosphere" aria-hidden="true">
        <div className="sanctum-aura" />
        {(["left", "right"] as const).map((side) => (
          <div className={`devotional-wing devotional-wing--${side}`} key={side}>
            <div className="wing-arch" />
            <div className="incense incense--one" /><div className="incense incense--two" />
            <div className="deepam-light" />
            <div className="deepam"><Image src="/devotional/brass-deepam.webp" alt="" fill sizes="(max-width: 700px) 24vw, 24vw" loading="eager" /></div>
            <div className="wing-inscription"><span>{side === "left" ? "A moment of stillness" : "A lifetime of grace"}</span><i /><small>{side === "left" ? "DEVOTION IN EVERY DETAIL" : "DIVINITY IN EVERY SPACE"}</small></div>
          </div>
        ))}
        <div className="temple-motes">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ "--x": `${(i * 37 + 3) % 100}%`, "--delay": `${-(i % 12)}s`, "--duration": `${12 + i % 7}s`, "--drift": `${i % 2 ? 35 : -35}px` } as CSSProperties} />)}</div>
      </div>
      <div className="sanctum">
        <Image src="/devotional/lord-balaji.webp" alt="Devotional depiction of Lord Venkateshwara adorned with a golden crown and flower garlands" fill sizes="(max-width: 700px) 100vw, 60vw" loading="eager" onLoad={() => setReady(true)} onError={() => setReady(true)} />
        <div className="sanctum-vignette" />
      </div>
      <div className="temple-doors" aria-hidden="true">
        <div className="temple-leaf temple-leaf--left" />
        <div className="temple-leaf temple-leaf--right" />
      </div>
      <div className="temple-heading"><span>Venkateshwara</span><small>D V &nbsp; S P A C E S</small></div>
      <button className="temple-skip" onClick={finish}>Skip intro <span aria-hidden="true">↗</span></button>
      {phase === "darshan" && <button className="atmosphere-toggle" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "Resume atmosphere" : "Pause atmosphere"}</button>}
      <div className="temple-invitation" aria-hidden={phase !== "closed"}>
        <span className="temple-kicker">Every beginning, a blessing</span>
        <button onClick={() => setPhase("opening")} tabIndex={phase === "closed" ? 0 : -1}>Open the sacred gates <span aria-hidden="true">→</span></button>
      </div>
      <div className="darshan-caption" aria-live="polite">
        {phase === "darshan" && <>
          <p lang="te">ఓం నమో వేంకటేశాయ</p>
          <span>Om Namo Venkatesaya</span>
          <button onClick={finish}>Enter Divine Vision <span aria-hidden="true">↗</span></button>
        </>}
      </div>
      <div className="temple-progress" aria-hidden="true"><span className={phase === "closed" ? "active" : ""}>01 / The threshold</span><i /><span className={phase !== "closed" ? "active" : ""}>02 / The blessing</span></div>
    </dialog>
  );
}
