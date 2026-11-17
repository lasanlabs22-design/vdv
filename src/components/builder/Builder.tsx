"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { featuresByKind, plans, tierIds, tiers, type Kind, type Side, type TierId } from "@/lib/plans";
import { whatsappLink } from "@/lib/site";
import {
  MAX_FLOORS, builtUpSqft, clashes, elementLabel, elements, elevationOptions, facadeStyles, floorNames, freeSpot, fromPlan, makeRoom, newProject,
  plotPresets, summary, timelineStages, toRoom, uid, type BRoom, type Elevation, type FacadeStyle, type Project,
} from "@/lib/builder";
import { ColorField } from "../studio/ColorField";
import PlanEditor from "./PlanEditor";

const loading = () => <div className="scene-loading"><span />Preparing the site…</div>;
const Scene = dynamic(() => import("../studio/Scene"), { ssr: false, loading });
const Exterior = dynamic(() => import("./Exterior"), { ssr: false, loading });

const KEY = "dv-builder-1";
const STEPS = ["Plot", "Plan", "Elevation", "Build"] as const;
type Step = (typeof STEPS)[number];
const SIDES: { id: Side; label: string }[] = [{ id: "n", label: "North" }, { id: "e", label: "East" }, { id: "s", label: "South" }, { id: "w", label: "West" }];

const narrowQuery = "(max-width: 960px)";
const subscribeNarrow = (cb: () => void) => {
  const mq = matchMedia(narrowQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
/** True on phone and tablet layouts, where the plan and the 3D view take turns on screen. */
const useNarrow = () => useSyncExternalStore(subscribeNarrow, () => matchMedia(narrowQuery).matches, () => false);

function load(): Project {
  try {
    const preset = plans.find((p) => p.id === new URLSearchParams(window.location.search).get("type"));
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (preset && saved?.sourcePlan !== preset.id) return fromPlan(preset);
    if (saved?.plot && Array.isArray(saved.floors) && saved.elevation) return saved;
  } catch {}
  return newProject();
}


function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: readonly { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="opt" role="radiogroup" aria-label={label}>
      <span className="opt-label">{label}</span>
      <div className="opt-row">
        {options.map((o) => (
          <button key={o.id} role="radio" aria-checked={value === o.id} className={value === o.id ? "is-on" : ""} onClick={() => onChange(o.id)}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

export default function Builder() {
  const [project, setProject] = useState<Project>(load);
  const [step, setStep] = useState<Step>(() => (load().floors.some((f) => f.length) ? "Plan" : "Plot"));
  const [floor, setFloor] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"plan" | "3d">("plan");
  const narrow = useNarrow();
  // Never mount a hidden WebGL canvas: on narrow screens only the visible pane is rendered.
  const showPlan = !narrow || mobileView === "plan";
  const show3d = !narrow || mobileView === "3d";
  const stages = timelineStages(project.floors.length);
  const timeline = useRef({ t: stages.length });
  const [t, setT] = useState(stages.length);
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState("perspective");
  const [light, setLight] = useState("day");
  const [vehicle, setVehicle] = useState(true);
  const [carColor, setCarColor] = useState("#d5d1c7");

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(project));
    } catch {}
  }, [project]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const next = Math.min(stages.length, timeline.current.t + ((now - last) / 1000) * 0.7);
      last = now;
      timeline.current.t = next;
      setT(next);
      if (next >= stages.length) setPlaying(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, stages.length]);

  const scrub = (v: number) => {
    timeline.current.t = v;
    setT(v);
  };

  const go = (s: Step) => {
    setStep(s);
    setPlaying(false);
    // Elevation is judged in daylight: everything built, lights not yet on.
    if (s === "Elevation") { scrub(stages.length - 1); setLight("day"); }
    if (s === "Build") {
      setLight("auto");
      scrub(0);
      setPlaying(true);
    }
  };

  const rooms = project.floors[floor] ?? [];
  const room = rooms.find((r) => r.id === selected) ?? null;
  const bad = clashes(rooms);

  const update = (fn: (p: Project) => Project) => setProject((p) => fn(structuredClone(p)));
  const patchRoom = (id: string, patch: Partial<BRoom>) =>
    update((p) => ({ ...p, floors: p.floors.map((f) => f.map((r) => (r.id === id ? { ...r, ...patch } : r))) }));
  const removeRoom = (id: string) => {
    update((p) => ({ ...p, floors: p.floors.map((f) => f.filter((r) => r.id !== id)) }));
    setSelected(null);
  };
  const addRoom = (kind: Kind) => {
    const r = makeRoom(kind, rooms, project.plot);
    update((p) => ({ ...p, floors: p.floors.map((f, i) => (i === floor ? [...f, r] : f)) }));
    setSelected(r.id);
  };
  const setPlot = (w: number, d: number) =>
    update((p) => ({
      ...p,
      plot: { w, d },
      floors: p.floors.map((f) => f.map((r) => {
        const rw = Math.min(r.w, w), rd = Math.min(r.d, d);
        return { ...r, w: rw, d: rd, x: Math.min(r.x, w - rw), z: Math.min(r.z, d - rd) };
      })),
    }));
  const setFloors = (count: number) => {
    const extra = project.floors.slice(count).flat().length;
    if (extra && !confirm(`Removing floors will delete ${extra} room${extra > 1 ? "s" : ""}. Continue?`)) return;
    update((p) => ({ ...p, floors: Array.from({ length: count }, (_, i) => p.floors[i] ?? []) }));
    setFloor((f) => Math.min(f, count - 1));
    scrub(timelineStages(count).length);
  };
  const setElevation = (patch: Partial<Elevation>) => update((p) => ({ ...p, elevation: { ...p.elevation, ...patch } }));
  const startFrom = (next: Project) => {
    const hasRooms = project.floors.some((f) => f.length);
    if (hasRooms && !confirm("Replace your current plan?")) return;
    setProject(next);
    setFloor(0);
    setSelected(null);
    scrub(timelineStages(next.floors.length).length);
    setStep("Plan");
  };

  const interior = {
    name: floorNames[floor],
    rooms: rooms.map(toRoom),
  };
  const design = Object.fromEntries(rooms.map((r) => [r.id, { tier: r.tier, off: r.off, wall: r.wall, floor: r.floor }]));
  const stageIdx = Math.min(stages.length - 1, Math.floor(t));
  const groups = [...new Set(elements.map((e) => e.group))];
  const facing = SIDES.find((s) => s.id === project.facing)!.label;

  return (
    <div className="builder">
      <div className="studio-top">
        <div className="studio-title">
          <p className="eyebrow">Design your own</p>
          <h1>Your architectural <em>atelier.</em></h1>
        </div>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button className={`step${step === s ? " is-on" : ""}`} onClick={() => go(s)} aria-current={step === s ? "step" : undefined}>
                <span>{i + 1}</span>{s}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className={`builder-body step-${step.toLowerCase()} show-${mobileView}`}>
        <aside className="studio-side">
          {step === "Plot" && (
            <div className="panel">
              <div className="panel-head"><h2>Your plot</h2></div>
              <h3 className="panel-sub">Size in feet</h3>
              <div className="opt-row">
                {plotPresets.map((p) => (
                  <button key={`${p.w}x${p.d}`} className={project.plot.w === p.w && project.plot.d === p.d ? "is-on" : ""} onClick={() => setPlot(p.w, p.d)}>{p.w} × {p.d}</button>
                ))}
              </div>
              <div className="num-row">
                <label>Width <input type="number" min={15} max={350} value={project.plot.w} onChange={(e) => setPlot(Math.max(15, Math.min(350, +e.target.value || 15)), project.plot.d)} /> ft</label>
                <label>Depth <input type="number" min={15} max={350} value={project.plot.d} onChange={(e) => setPlot(project.plot.w, Math.max(15, Math.min(350, +e.target.value || 15)))} /> ft</label>
              </div>
              <Seg label="Road facing" value={project.facing} options={SIDES} onChange={(v) => update((p) => ({ ...p, facing: v }))} />
              <label className="range">Building levels <select aria-label="Building levels" value={project.floors.length} onChange={(e) => setFloors(+e.target.value)}>{floorNames.map((_, i) => <option key={i} value={i + 1}>{i ? 'G+' + i : 'Ground only'}</option>)}</select></label>
              <h3 className="panel-sub">Start from</h3>
              <div className="start-list">
                <button onClick={() => startFrom({ ...newProject(), plot: project.plot, facing: project.facing, floors: project.floors.map(() => []) })}>
                  <b>Blank plot</b><small>Place every room yourself</small>
                </button>
                {plans.map((p) => (
                  <button key={p.id} onClick={() => startFrom(fromPlan(p))}>
                    <b>{p.label}</b><small>{p.blurb}</small>
                  </button>
                ))}
              </div>
              <button className="btn btn--gold panel-next" onClick={() => go("Plan")}>Next: plan the rooms →</button>
            </div>
          )}

          {step === "Plan" && (
            <>
              <div className="panel">
                <div className="panel-head">
                  <h2>{floorNames[floor]} floor</h2>
                  {project.floors.length > 1 && (
                    <div className="seg" role="tablist" aria-label="Floor">
                      {project.floors.map((_, i) => (
                        <button key={i} role="tab" aria-selected={i === floor} className={i === floor ? "is-on" : ""} onClick={() => { setFloor(i); setSelected(null); }}>{floorNames[i]}</button>
                      ))}
                    </div>
                  )}
                </div>
                {bad.size > 0 && <p className="warn">{bad.size} rooms overlap. Drag them apart or resize them.</p>}
                <h3 className="panel-sub">Add an element</h3>
                {groups.map((g) => (
                  <div key={g} className="palette">
                    <span>{g}</span>
                    <div className="opt-row">
                      {elements.filter((e) => e.group === g).map((e) => (
                        <button key={e.kind} onClick={() => addRoom(e.kind)}>+ {e.label}</button>
                      ))}
                    </div>
                  </div>
                ))}
                {project.floors.length < MAX_FLOORS && floor === project.floors.length - 1 && (
                  <button className="link-btn" onClick={() => { setFloors(project.floors.length + 1); setFloor(project.floors.length); }}>+ Add {floorNames[project.floors.length].toLowerCase()} floor</button>
                )}
              </div>

              {room && (
                <div className="panel inspector" key={room.id}>
                  <div className="panel-head">
                    <div>
                      <p className="eyebrow">{elementLabel(room.kind)}</p>
                      <input className="name-input" value={room.name} onChange={(e) => patchRoom(room.id, { name: e.target.value })} aria-label="Room name" />
                    </div>
                    <button className="link-btn" onClick={() => setSelected(null)}>Done</button>
                  </div>
                  <div className="num-row">
                    <label>Width <input type="number" min={4} max={project.plot.w - room.x} value={room.w} onChange={(e) => patchRoom(room.id, { w: Math.max(4, Math.min(project.plot.w - room.x, +e.target.value || 4)) })} /> ft</label>
                    <label>Depth <input type="number" min={4} max={project.plot.d - room.z} value={room.d} onChange={(e) => patchRoom(room.id, { d: Math.max(4, Math.min(project.plot.d - room.z, +e.target.value || 4)) })} /> ft</label>
                  </div>
                  <Seg label="Door on" value={room.door} options={SIDES} onChange={(v) => patchRoom(room.id, { door: v })} />
                  <label className="range">
                    <span className="opt-label">Door position</span>
                    <input type="range" min={0.1} max={0.9} step={0.05} value={room.at} onChange={(e) => patchRoom(room.id, { at: +e.target.value })} />
                  </label>
                  <Seg label="Style" value={room.tier} options={tierIds.map((id) => ({ id, label: tiers[id].label }))} onChange={(v: TierId) => patchRoom(room.id, { tier: v })} />
                  <ColorField label="Walls" value={room.wall} fallback={`${tiers[room.tier].label} default`} onChange={(v) => patchRoom(room.id, { wall: v })} />
                  <ColorField label="Floor" value={room.floor} fallback={`${tiers[room.tier].label} default`} onChange={(v) => patchRoom(room.id, { floor: v })} />
                  <h3 className="panel-sub">Include</h3>
                  <div className="feature-list">
                    {featuresByKind[room.kind].map((f) => {
                      const on = !room.off.includes(f.id);
                      return (
                        <button key={f.id} className={`feature${on ? " is-on" : ""}`} role="switch" aria-checked={on} onClick={() => patchRoom(room.id, { off: on ? [...room.off, f.id] : room.off.filter((x) => x !== f.id) })}>
                          <span className="feature-dot" aria-hidden="true" />{f.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="actions">
                    <button className="tool-btn" onClick={() => {
                      const c = { ...room, ...freeSpot(rooms, room.w, room.d, project.plot), id: uid(), name: `${room.name} copy` };
                      update((p) => ({ ...p, floors: p.floors.map((f, i) => (i === floor ? [...f, c] : f)) }));
                      setSelected(c.id);
                    }}>Duplicate</button>
                    {floor < MAX_FLOORS - 1 && (
                      <button className="tool-btn" onClick={() => update((p) => {
                        const floors = p.floors.length > floor + 1 ? p.floors : [...p.floors, []];
                        return { ...p, floors: floors.map((f, i) => (i === floor + 1 ? [...f, { ...room, id: uid() }] : f)) };
                      })}>Copy to floor above</button>
                    )}
                    <button className="tool-btn tool-btn--danger" onClick={() => removeRoom(room.id)}>Delete</button>
                  </div>
                </div>
              )}
              <button className="btn btn--gold panel-next" onClick={() => go("Elevation")}>Next: design the elevation →</button>
            </>
          )}

          {step === "Elevation" && (
            <div className="panel">
              <div className="panel-head"><h2>Elevation</h2></div>
              <div className="style-pick">
                {(Object.keys(facadeStyles) as FacadeStyle[]).map((s) => (
                  <button key={s} className={project.elevation.style === s ? "is-on" : ""} onClick={() => setElevation({ style: s, ...facadeStyles[s].defaults })}>
                    <b>{facadeStyles[s].label}</b>
                    <small>{facadeStyles[s].line}</small>
                  </button>
                ))}
              </div>
              <ColorField label="Main walls" value={project.elevation.paint} onChange={(v) => v && setElevation({ paint: v })} />
              <ColorField label="Accent" value={project.elevation.accent} onChange={(v) => v && setElevation({ accent: v })} />
              <ColorField label="Trim & details" value={project.elevation.trim} onChange={(v) => v && setElevation({ trim: v })} />
              <Seg label="Cladding" value={project.elevation.cladding} options={elevationOptions.cladding} onChange={(v) => setElevation({ cladding: v })} />
              <Seg label="Windows" value={project.elevation.windows} options={elevationOptions.windows} onChange={(v) => setElevation({ windows: v })} />
              <Seg label="Balcony railing" value={project.elevation.railing} options={elevationOptions.railing} onChange={(v) => setElevation({ railing: v })} />
              <Seg label="Parapet" value={project.elevation.parapet} options={elevationOptions.parapet} onChange={(v) => setElevation({ parapet: v })} />
              <Seg label="Gate" value={project.elevation.gate} options={elevationOptions.gate} onChange={(v) => setElevation({ gate: v })} />
              <button className="btn btn--gold panel-next" onClick={() => go("Build")}>Next: watch it being built →</button>
            </div>
          )}

          {step === "Build" && (
            <div className="panel">
              <div className="panel-head"><h2>Construction timeline</h2></div>
              <ol className="stage-list">
                {stages.map((s, i) => (
                  <li key={s}>
                    <button className={i === stageIdx ? "is-on" : i < t ? "is-done" : ""} onClick={() => { setPlaying(false); scrub(i + 1); }}>
                      <span>{i + 1}</span>{s}
                    </button>
                  </li>
                ))}
              </ol>
              <dl className="facts">
                <div><dt>Plot</dt><dd>{project.plot.w} × {project.plot.d} ft, {facing} facing</dd></div>
                <div><dt>Floors</dt><dd>{project.floors.length === 1 ? "G" : `G+${project.floors.length - 1}`}</dd></div>
                <div><dt>Built up</dt><dd>≈ {builtUpSqft(project).toLocaleString("en-IN")} sq ft</dd></div>
                <div><dt>Elevation</dt><dd>{facadeStyles[project.elevation.style].label}</dd></div>
              </dl>
              <a className="btn btn--gold panel-next" href={whatsappLink(summary(project))} target="_blank" rel="noopener noreferrer">Send my project on WhatsApp</a>
              <p className="panel-note">Your design is saved on this device. Pricing for custom projects is shared after a site visit.</p>
            </div>
          )}
        </aside>

        <section className="builder-stage">
          {(step === "Plot" || (step === "Plan" && showPlan)) && (
            <div className="stage-pane stage-plan">
              <PlanEditor project={project} floor={floor} selected={selected} onSelect={setSelected} onChange={patchRoom} onRemove={removeRoom} />
              <p className="stage-hint">Drag rooms · Pull the gold handles to resize · Arrow keys nudge</p>
            </div>
          )}
          {step === "Plan" && show3d && (
            <div className="stage-pane stage-3d">
              {rooms.length ? (
                <Scene floor={interior} design={design} selected={selected} onSelect={setSelected} dusk={false} walls="cutaway" animKey={`b-${floor}`} viewNonce={0} labels={false} bounds={{ w: project.plot.w * 0.3048, d: project.plot.d * 0.3048 }} />
              ) : (
                <div className="scene-loading">Add rooms to see them in 3D</div>
              )}
            </div>
          )}
          {(step === "Elevation" || step === "Build") && (
            <div className="stage-pane stage-ext">
              <Exterior project={project} timeline={timeline} stages={stages.length} view={view} light={light} vehicle={vehicle} carColor={carColor} />
              <div className="atelier-toolbar"><div><span>COMPOSITION</span>{["perspective", "street", "aerial"].map(v => <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>{v}</button>)}</div><div><span>LIGHT STUDY</span>{["day", "golden", "dusk"].map(v => <button key={v} aria-pressed={light === v} onClick={() => setLight(v)}>{v === "golden" ? "Golden hour" : v}</button>)}</div><div><button aria-pressed={vehicle} onClick={() => setVehicle(!vehicle)}>Vehicle</button><input aria-label="Vehicle paint" type="color" value={carColor} onChange={e => setCarColor(e.target.value)} /></div></div>
              <div className="atelier-caption"><span>DV / ARCHITECTURAL ATELIER</span><b>{view === "street" ? "Street perspective" : view === "aerial" ? "Site composition" : "Exterior study"}</b><small>Drag to orbit · Scroll to explore</small></div>
              {step === "Build" && (
                <div className="timeline">
                  <button className="tool-btn" onClick={() => { if (t >= stages.length) scrub(0); setPlaying(!playing); }}>{playing ? "❚❚ Pause" : t >= stages.length ? "↻ Build again" : "▶ Play"}</button>
                  <input type="range" min={0} max={stages.length} step={0.01} value={t} onChange={(e) => { setPlaying(false); scrub(+e.target.value); }} aria-label="Construction timeline" />
                  <span className="timeline-label">{stages[stageIdx]}</span>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {step === "Plan" && (
        <div className="studio-switch builder-switch" role="tablist" aria-label="View">
          <button role="tab" aria-selected={mobileView === "plan"} className={mobileView === "plan" ? "is-on" : ""} onClick={() => setMobileView("plan")}>Blueprint</button>
          <button role="tab" aria-selected={mobileView === "3d"} className={mobileView === "3d" ? "is-on" : ""} onClick={() => setMobileView("3d")}>3D view</button>
        </div>
      )}

      <p className="builder-foot">
        Concept visualisation · Structural, services and code review required before construction. Vehicle model: <a href="https://threejs.org/examples/webgl_materials_car.html" target="_blank" rel="noopener noreferrer">vicent091036 / three.js</a>. Prefer a ready plan? <Link href="/studio">Open the 3D studio</Link>
      </p>
    </div>
  );
}
