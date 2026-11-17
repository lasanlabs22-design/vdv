"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { extent, plans, sqft } from "@/lib/plans";

function MiniPlan({ id }: { id: string }) {
  const plan = plans.find((p) => p.id === id)!;
  const floor = plan.floors[0];
  const { w, d } = extent(floor);
  const pad = 0.4;
  return (
    <svg className="mini-plan" viewBox={`${-pad} ${-pad} ${w + pad * 2} ${d + pad * 2}`} aria-hidden="true">
      {floor.rooms.map((r) => (
        <rect key={r.id} x={r.x} y={r.z} width={r.w} height={r.d} />
      ))}
    </svg>
  );
}

export default function SpacePicker() {
  const [group, setGroup] = useState("All spaces");
  const groups = ["All spaces", ...new Set(plans.map(p => p.group))];
  return (
    <><div className="space-filters" role="group" aria-label="Building category">{groups.map(g => <button key={g} aria-pressed={group === g} onClick={() => setGroup(g)}>{g}</button>)}<span>{plans.filter(p => group === "All spaces" || p.group === group).length} design starting points</span></div><div className="spaces-grid">
      {plans.filter(p => group === "All spaces" || p.group === group).map((p, i) => (
        <Link key={p.id} href={`/studio?type=${p.id}`} className="space-card" data-delay={(i % 4) * 80}>
          <span className="space-group">{p.group}</span>
          {p.board ? <div className="space-image"><Image src={p.board.replace(".jpg", "-hero.jpg")} alt={`${p.label} architectural reference`} fill sizes="(max-width: 560px) 90vw, (max-width: 1100px) 45vw, 23vw" /><span>Design reference</span></div> : <MiniPlan id={p.id} />}
          <h3>{p.label}</h3>
          <p>{p.blurb}</p>
          <div className="space-meta">
            <span>{p.floors.length > 1 ? `${p.floors.length} floors, ` : ""}≈ {sqft(p).toLocaleString("en-IN")} sq ft</span>
            <strong>{p.from ? `from ${p.from}` : "Tailored quote"}</strong>
          </div>
          <span className="space-go">Open in 3D studio →</span>
        </Link>
      ))}
      <Link href="/builder" className="space-card space-card--own" data-delay={240}>
        <span className="space-group">Your own design</span>
        <svg className="mini-plan" viewBox="-1 -1 12 9" aria-hidden="true">
          <rect x="0" y="0" width="10" height="7" strokeDasharray="0.3 0.2" />
          <rect x="0.6" y="0.6" width="4" height="3.2" />
          <rect x="5.2" y="0.6" width="4.2" height="2.2" />
          <path d="M7.3 4.2V6.4M6.2 5.3H8.4" />
        </svg>
        <h3>Design your own</h3>
        <p>Set out your plot, place every room, choose colours and an elevation, then watch it being built.</p>
        <div className="space-meta">
          <span>Any typology · up to G+20</span>
          <strong>Tailored quote</strong>
        </div>
        <span className="space-go">Open the builder →</span>
      </Link>
    </div></>
  );
}
