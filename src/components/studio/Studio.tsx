"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { featuresByKind, planById, plans, sqft, tierIds, tiers, type Plan, type PlanId, type TierId } from "@/lib/plans";
import { whatsappLink } from "@/lib/site";
import { ColorField } from "./ColorField";
import Blueprint from "./Blueprint";
import type { RoomState, WallMode } from "./Scene";

const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading">
      <span />
      Raising the walls…
    </div>
  ),
});

type Design = Record<string, RoomState>;

const fresh = (plan: Plan): Design =>
  Object.fromEntries(
    plan.floors.flatMap((f) => f.rooms).map((r) => [r.id, { tier: "signature" as TierId, off: r.kind === "kitchen" && (r.w < 2.8 || r.d < 2.8) ? ["island"] : [] }]),
  );

function Swatches({ tier }: { tier: TierId }) {
  const t = tiers[tier];
  return (
    <span className="swatches" aria-hidden="true">
      {[t.floor, t.wood, t.soft, t.accent].map((c) => <i key={c} style={{ background: c }} />)}
    </span>
  );
}

export default function Studio({ initial }: { initial: PlanId }) {
  const [planId, setPlanId] = useState<PlanId>(initial);
  const plan = planById(planId)!;
  const [design, setDesign] = useState<Design>(() => fresh(plan));
  const [floorIdx, setFloorIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [dusk, setDusk] = useState(false);
  const [walls, setWalls] = useState<WallMode>("cutaway");
  const [replay, setReplay] = useState(0);
  const [viewNonce, setViewNonce] = useState(0);
  const [mobileView, setMobileView] = useState<"3d" | "plan">("3d");

  const floor = plan.floors[floorIdx];
  const room = floor.rooms.find((r) => r.id === selected) ?? null;
  const animKey = `${planId}-${floorIdx}-${replay}`;
  const allRooms = plan.floors.flatMap((f) => f.rooms);

  const choosePlan = (id: PlanId) => {
    if (id === planId) return;
    setPlanId(id);
    setDesign(fresh(planById(id)!));
    setFloorIdx(0);
    setSelected(null);
    history.replaceState(null, "", `/studio?type=${id}`);
  };

  const setTier = (ids: string[], tier: TierId) => setDesign((d) => ({ ...d, ...Object.fromEntries(ids.map((id) => [id, { ...d[id], tier }])) }));
  const toggle = (id: string, f: string) =>
    setDesign((d) => ({ ...d, [id]: { ...d[id], off: d[id].off.includes(f) ? d[id].off.filter((x) => x !== f) : [...d[id].off, f] } }));

  const counts = tierIds.map((t) => [t, allRooms.filter((r) => design[r.id].tier === t).length] as const).filter(([, n]) => n > 0);

  const message = () => {
    const lines = [
      `Namaskaram! I designed my ${plan.label} in the DV Spaces 3D Studio.`,
      plan.from ? `Starting price shown: ${plan.from}` : "",
      "",
      ...plan.floors.flatMap((f) => [
        plan.floors.length > 1 ? `${f.name} floor` : "",
        ...f.rooms.map((r) => {
          const s = design[r.id];
          const feats = featuresByKind[r.kind].filter((x) => !s.off.includes(x.id)).map((x) => x.label);
          return `• ${r.name}: ${tiers[s.tier].label}${feats.length ? ` (${feats.join(", ")})` : ""}`;
        }),
      ]),
      "",
      "Please share a quote and a site visit date.",
    ];
    return lines.filter((l, i) => l !== "" || (i > 0 && lines[i - 1] !== "")).join("\n");
  };

  return (
    <div className={`studio${dusk ? " is-dusk" : ""}`}>
      <div className="studio-top">
        <div className="studio-title">
          <p className="eyebrow">DV 3D Studio</p>
          <h1>Shape your <em>{plan.label}</em></h1>
        </div>
        <div className="studio-tabs" role="tablist" aria-label="Property type">
          {plans.map((p) => (
            <button key={p.id} role="tab" aria-selected={p.id === planId} className={`studio-tab${p.id === planId ? " is-on" : ""}`} onClick={() => choosePlan(p.id)}>
              <small>{p.group}</small>
              {p.label}
            </button>
          ))}
          <Link href={`/builder?type=${planId}`} className="studio-tab studio-tab--own">
            <small>Custom</small>
            Design your own
          </Link>
        </div>
      </div>

      <div className="studio-switch" role="tablist" aria-label="View">
        <button role="tab" aria-selected={mobileView === "3d"} className={mobileView === "3d" ? "is-on" : ""} onClick={() => setMobileView("3d")}>3D view</button>
        <button role="tab" aria-selected={mobileView === "plan"} className={mobileView === "plan" ? "is-on" : ""} onClick={() => setMobileView("plan")}>Blueprint</button>
      </div>

      <div className={`studio-body show-${mobileView}`}>
        <aside className="studio-side">
          <div className="panel bp-panel">
            <div className="panel-head">
              <h2>Blueprint</h2>
              {plan.floors.length > 1 && (
                <div className="seg" role="tablist" aria-label="Floor">
                  {plan.floors.map((f, i) => (
                    <button key={f.name} role="tab" aria-selected={i === floorIdx} className={i === floorIdx ? "is-on" : ""} onClick={() => { setFloorIdx(i); setSelected(null); }}>{f.name}</button>
                  ))}
                </div>
              )}
            </div>
            <Blueprint floor={floor} design={design} selected={selected} onSelect={(id) => setSelected(id === selected ? null : id)} animKey={animKey} />
            <p className="panel-note">Tap a room on the plan or in 3D to customise it.</p>
            {plan.board && (
              <a className="board-link" href={plan.board} target="_blank" rel="noopener noreferrer">
                <Image src={plan.board} alt="" width={120} height={80} sizes="120px" />
                <span>
                  <small>Architectural design reference</small>
                  See the {plan.label} design board ↗
                </span>
              </a>
            )}
          </div>

          <div className="panel inspector" key={room?.id ?? "home"}>
            {room ? (
              <>
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">{floor.name !== plan.label && plan.floors.length > 1 ? `${floor.name} floor` : "Room"}</p>
                    <h2>{room.name}</h2>
                    <p className="muted">{room.w} × {room.d} m · {Math.round(room.w * room.d * 10.764)} sq ft</p>
                  </div>
                  <button className="link-btn" onClick={() => setSelected(null)}>Whole home ↩</button>
                </div>
                <div className="tier-pick" role="radiogroup" aria-label="Style">
                  {tierIds.map((t) => (
                    <button key={t} role="radio" aria-checked={design[room.id].tier === t} className={design[room.id].tier === t ? "is-on" : ""} onClick={() => setTier([room.id], t)}>
                      <Swatches tier={t} />
                      <b>{tiers[t].label}</b>
                      <small>{tiers[t].line}</small>
                    </button>
                  ))}
                </div>
                {(["wall", "floor"] as const).map(surface => <ColorField key={surface} label={surface === "wall" ? "Wall paint" : "Floor tone"} value={design[room.id][surface]} fallback="Style default" onChange={value => setDesign(d => ({ ...d, [room.id]: { ...d[room.id], [surface]: value } }))} />)}
                <h3 className="panel-sub">Include</h3>
                <div className="feature-list">
                  {featuresByKind[room.kind].map((f) => {
                    const on = !design[room.id].off.includes(f.id);
                    return (
                      <button key={f.id} className={`feature${on ? " is-on" : ""}`} role="switch" aria-checked={on} onClick={() => toggle(room.id, f.id)}>
                        <span className="feature-dot" aria-hidden="true" />
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">Whole home</p>
                    <h2>One style for every room</h2>
                  </div>
                </div>
                <div className="tier-pick tier-pick--row" role="group" aria-label="Apply a style to all rooms">
                  {tierIds.map((t) => (
                    <button key={t} className={allRooms.every((r) => design[r.id].tier === t) ? "is-on" : ""} onClick={() => setTier(allRooms.map((r) => r.id), t)}>
                      <Swatches tier={t} />
                      <b>{tiers[t].label}</b>
                    </button>
                  ))}
                </div>
                <h3 className="panel-sub">Rooms</h3>
                <ul className="room-list">
                  {floor.rooms.map((r) => (
                    <li key={r.id}>
                      <button onClick={() => setSelected(r.id)}>
                        <span>{r.name}</span>
                        <span className={`tier-chip tier-${design[r.id].tier}`}>{tiers[design[r.id].tier].label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </aside>

        <section className="studio-stage" aria-label="3D model">
          <Scene floor={floor} design={design} selected={selected} onSelect={(id) => setSelected(id)} dusk={dusk} walls={walls} animKey={animKey} viewNonce={viewNonce} />
          <div className="stage-tools">
            <div className="seg" role="group" aria-label="Lighting">
              <button className={!dusk ? "is-on" : ""} onClick={() => setDusk(false)} aria-pressed={!dusk}>☀ Day</button>
              <button className={dusk ? "is-on" : ""} onClick={() => setDusk(true)} aria-pressed={dusk}>☾ Dusk</button>
            </div>
            <div className="seg" role="group" aria-label="Walls">
              {(["cutaway", "full", "low"] as WallMode[]).map((m) => (
                <button key={m} className={walls === m ? "is-on" : ""} onClick={() => setWalls(m)} aria-pressed={walls === m}>
                  {m === "cutaway" ? "Cutaway" : m === "full" ? "Walls up" : "Walls down"}
                </button>
              ))}
            </div>
            <button className="tool-btn" onClick={() => setReplay((n) => n + 1)}>↻ Build again</button>
            <button className="tool-btn" onClick={() => { setSelected(null); setViewNonce((n) => n + 1); }}>⌂ Reset view</button>
          </div>
          <p className="stage-hint">Drag to orbit · Scroll or pinch to zoom · Right-drag to pan · Tap a room</p>
        </section>
      </div>

      <div className="studio-summary">
        <div className="summary-plan">
          <b>{plan.label}</b>
          <span>≈ {sqft(plan).toLocaleString("en-IN")} sq ft · {allRooms.length} spaces</span>
        </div>
        <div className="summary-mix" aria-label="Styles chosen">
          {counts.map(([t, n]) => <span key={t} className={`tier-chip tier-${t}`}>{n} {tiers[t].label}</span>)}
        </div>
        <div className="summary-price">
          {plan.from ? (
            <>
              <small>Starting from</small>
              <b>{plan.from}</b>
            </>
          ) : (
            <>
              <small>Pricing</small>
              <b>On consultation</b>
            </>
          )}
        </div>
        <a className="btn btn--gold" href={whatsappLink(message())} target="_blank" rel="noopener noreferrer">Send this design on WhatsApp</a>
      </div>
    </div>
  );
}

