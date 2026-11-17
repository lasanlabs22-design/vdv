"use client";

import { useState } from "react";

// The seven hills of Tirumala, one per stage of a turnkey project, ending at Venkatadri.
const steps = [
  { hill: "Seshadri", title: "We listen", text: "A site visit and an unhurried conversation: your family, your rituals, your budget and the vastu of the plot." },
  { hill: "Neeladri", title: "We measure", text: "An exact survey of every wall, beam and opening, so the design fits your space to the centimetre." },
  { hill: "Garudadri", title: "We imagine", text: "Layout options and mood boards. Never copied from another project, always drawn new for you." },
  { hill: "Anjanadri", title: "You see it in 3D", text: "Walk through every room before work begins. Change finishes, lighting and furniture until it feels like home." },
  { hill: "Vrushabhadri", title: "We detail", text: "Working drawings, material samples and a transparent estimate, from a minimal budget to a premium one." },
  { hill: "Narayanadri", title: "We build", text: "Turnkey execution by one accountable team: civil, carpentry, electrical, ceilings, paint and styling." },
  { hill: "Venkatadri", title: "Griha pravesh", text: "A finished, cleaned and styled space handed over in time for your housewarming, with the Lord's blessings." },
];

const peaks = steps.map((_, i) => ({ x: 110 + i * 203, y: [170, 140, 155, 116, 132, 98, 60][i] }));
// Drawn as a single fine ridge line, like an elevation sketch, rather than filled shapes.
const ridge = `M0 240 ${peaks.map((p, i) => `L${p.x - 70} ${p.y + 50 + (i % 2) * 10} L${p.x} ${p.y}`).join(" ")} L1440 170`;
// The pilgrim's trail, one curve between each pair of hills, so it can fill up to the chosen hill.
const legs = peaks.slice(1).map((p, i) => `M${peaks[i].x} ${peaks[i].y} Q${(peaks[i].x + p.x) / 2} ${Math.max(peaks[i].y, p.y) + 40} ${p.x} ${p.y}`);

/** One screen: the hills across the middle, the chosen step's card beneath. Changes only when a visitor picks a step. */
export default function SevenHills() {
  const [active, setActive] = useState(0);
  const step = steps[active];

  return (
    <div className="hills">
      <svg className="hills-svg" viewBox="0 0 1440 300" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Seven hills of Tirumala, one per project stage">
        <path d={ridge} className="hills-ridge" />
        {legs.map((d, i) => (
          <g key={i}>
            <path d={d} className="hills-trail" />
            <path d={d} className={`hills-path${i < active ? " is-on" : ""}`} pathLength={1} style={{ transitionDelay: `${Math.abs(i - active + 1) * 0.06}s` }} />
          </g>
        ))}
        {peaks.map((p, i) => (
          <g
            key={i}
            className={`hills-peak${i <= active ? " is-reached" : ""}${i === active ? " is-active" : ""}`}
            transform={`translate(${p.x} ${p.y})`}
            onClick={() => setActive(i)}
            role="button"
            tabIndex={0}
            aria-pressed={i === active}
            aria-label={`Step ${i + 1}, ${steps[i].hill}: ${steps[i].title}`}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setActive(i))}
          >
            <circle r="30" className="hills-hit" />
            <circle r="10" className="hills-dot" />
            <text y="-24" className="hills-num">{i + 1}</text>
            <text y="44" className="hills-label">{steps[i].title}</text>
          </g>
        ))}
      </svg>

      {/* On phones the drawing is too small to tap, so the steps are repeated as large buttons. */}
      <div className="hills-steps" role="group" aria-label="Project steps">
        {steps.map((s, i) => (
          <button key={s.hill} className={`${i <= active ? "is-reached" : ""}${i === active ? " is-active" : ""}`} aria-pressed={i === active} aria-label={`Step ${i + 1}: ${s.title}`} onClick={() => setActive(i)}>
            {i + 1}
          </button>
        ))}
      </div>

      <div className="hills-detail" aria-live="polite">
        <span className="hills-big" aria-hidden="true">{String(active + 1).padStart(2, "0")}</span>
        <div className="hills-copy" key={active}>
          <p className="eyebrow">Hill {active + 1} of 7 · {step.hill}</p>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </div>
        <div className="hills-nav">
          <button onClick={() => setActive(Math.max(0, active - 1))} disabled={active === 0} aria-label="Previous step">←</button>
          <button onClick={() => setActive(Math.min(steps.length - 1, active + 1))} disabled={active === steps.length - 1} aria-label="Next step">→</button>
        </div>
      </div>
    </div>
  );
}
