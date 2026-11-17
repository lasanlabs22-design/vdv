"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { tierIds, tiers } from "@/lib/plans";

type Side = { src: string; alt: string; note: string };
type Concept = { id: string; label: string; minimal: Side; premium: Side };
type Group = { id: string; label: string; concepts: Concept[] };

const pair = (id: string, label: string, minimal: [string, string], premium: [string, string]): Concept => ({
  id,
  label,
  minimal: { src: `/mood/mood-${id}-minimal.jpg`, alt: minimal[0], note: minimal[1] },
  premium: { src: `/mood/mood-${id}-premium.jpg`, alt: premium[0], note: premium[1] },
});

// The first six are the same room drawn twice from one camera, so the slider reveals the upgrade in place.
// The rest pair two different rooms by Dr. Anil Verma: a calm daylight design and a richer, layered one.
const rooms: Concept[] = [
  pair("living", "Living hall", ["Minimal living hall with a beige sofa, oak TV unit and tree relief wall", "Oak, linen and a flat ceiling"], ["Premium living hall with marble walls, gold-trimmed furniture and a ring chandelier", "Marble, gold trim and a ring chandelier"]),
  pair("pooja", "Pooja room", ["Pooja room with a white marble mandir of Lord Venkateshwara and simple brass lamps", "White marble mandir, soft light"], ["Pooja room with a backlit marble mandir of Lord Venkateshwara, tall brass lamps and gold inlay", "Backlit mandir, tall brass deepams"]),
  pair("dining", "Dining", ["Minimal dining room with linen chairs and an oak crockery unit", "Linen chairs and oak display"], ["Premium dining room with velvet chairs, crystal chandelier and arched brass display", "Crystal chandelier and arched display"]),
  pair("kids", "Kids room", ["Kids bedroom with a tree relief wall, study desk and sage wardrobe", "Soft pastels and a study nook"], ["Premium kids bedroom with a crystal chandelier, backlit shelves and marble floor", "Chandelier, cove glow and marble"]),
  pair("bath", "Bathroom", ["Minimal bathroom with an oak vanity, round mirror and chrome fittings", "Oak vanity and chrome fittings"], ["Premium bathroom with marble walls, gold fittings and a backlit mirror", "Marble walls and gold fittings"]),
  pair("foyer", "Foyer", ["Minimal entrance foyer with an oak console, round mirror and shoe unit", "Oak console and a round mirror"], ["Premium foyer with a marble feature wall, brass decor and gold floor inlay", "Marble wall and gold floor inlay"]),
  {
    id: "bedroom",
    label: "Bedroom",
    minimal: { src: "/works/03-bedroom-minimal-daylight.jpg", alt: "Minimal daylight bedroom with walnut slats and soft linen", note: "Linen, light wood and daylight" },
    premium: { src: "/works/17-master-bedroom-gold.jpg", alt: "Premium master bedroom with gold leaf headboard and layered lighting", note: "Gold leaf headboard and cove glow" },
  },
  {
    id: "kitchen",
    label: "Kitchen",
    minimal: { src: "/works/07-kitchen-olive-island.jpg", alt: "Olive kitchen with a simple breakfast island in daylight", note: "Matte olive units and a simple island" },
    premium: { src: "/works/15-kitchen-glossy-sage.jpg", alt: "Glossy sage kitchen with a curved island, glass display and warm lighting", note: "Gloss sage, glass display and pendants" },
  },
  {
    id: "staircase",
    label: "Staircase",
    minimal: { src: "/works/09-staircase-wave-wall.jpg", alt: "Light staircase beside a white wave-relief wall", note: "White wave relief and glass rail" },
    premium: { src: "/works/20-staircase-gold-leaf.jpg", alt: "Staircase with backlit marble steps, gold rail and display niches", note: "Backlit marble steps and gold rail" },
  },
  {
    id: "balcony",
    label: "Balcony",
    minimal: { src: "/works/04-balcony-curved-wood-ceiling.jpg", alt: "Balcony with a curved wooden ceiling and garden view", note: "Curved teak ceiling, open to the view" },
    premium: { src: "/works/14-balcony-swing-night.jpg", alt: "Balcony at dusk with a swing chair, tree of life wall and lanterns", note: "Swing seat, tree of life wall and lanterns" },
  },
  {
    id: "porch",
    label: "Car porch",
    minimal: { src: "/works/05-porch-carport-day.jpg", alt: "Car porch with a floating ceiling in daylight", note: "Floating ceiling and clean stone" },
    premium: { src: "/works/10-porch-tree-of-life-night.jpg", alt: "Car porch at night with a backlit tree of life wall and carved ceiling", note: "Carved jaali ceiling and tree of life wall" },
  },
];

// Whole homes as cutaways, roof off, each drawn twice from one camera.
const homes: Concept[] = [
  pair("1bhk", "1 BHK", ["1 BHK cutaway with light tiles, oak furniture and a simple pooja niche", "Light tiles, oak and a simple pooja niche"], ["1 BHK cutaway with marble floors, walnut panelling and a carved pooja unit", "Marble, walnut and a carved pooja unit"]),
  pair("2bhk", "2 BHK", ["2 BHK cutaway with light tiles, oak furniture and plain walls", "Light tiles, oak and plain walls"], ["2 BHK cutaway with marble floors, gold inlay and backlit feature walls", "Marble, gold inlay and backlit walls"]),
  pair("3bhk", "3 BHK", ["3 BHK cutaway with light tiles, oak furniture and a balcony chair", "Light tiles, oak and a balcony chair"], ["3 BHK cutaway with marble floors, a carved pooja unit and a balcony swing", "Marble, a carved pooja unit and a swing"]),
  pair("villa", "Villa", ["Villa ground floor cutaway with light tiles, a lawn and a car porch", "Light tiles, a lawn and a car porch"], ["Villa ground floor cutaway with marble floors, ring chandeliers and a marble mandir", "Marble, chandeliers and a marble mandir"]),
];

// Front elevations, each drawn twice from one camera.
const buildings: Concept[] = [
  pair("elev-g1", "G+1 house", ["G+1 house with plain painted walls, MS railings and a simple gate", "Painted plaster and MS railings"], ["G+1 house with stone cladding, teak louvers, a carved door and a brass diya", "Stone, teak louvers and a carved door"]),
  pair("elev-villa", "G+2 villa", ["G+2 villa with plain walls, MS railings and a simple terrace shade", "Plain walls and a simple terrace"], ["G+2 villa with marble cladding, teak fins, a terrace pergola and a tree of life panel", "Marble, teak fins and a terrace pergola"]),
  pair("elev-apartment", "Apartment block", ["G+5 apartment block with painted walls and MS balcony railings", "Painted walls and MS railings"], ["G+5 apartment block with stone cladding, glass balconies and a rooftop pergola", "Stone, glass balconies and a pergola"]),
  pair("elev-commercial", "Commercial complex", ["Commercial complex with painted walls and rolling-shutter shopfronts", "Rolling shutters and plain walls"], ["Commercial complex with a glass facade, wood-finish fins and a grand canopy", "Glass facade, fins and a grand canopy"]),
  pair("elev-office", "Office", ["G+4 office with painted walls and aluminium ribbon windows", "Plaster and ribbon windows"], ["G+4 office with a glass curtain wall, bronze fins, a stone base and a water feature", "Curtain wall, bronze fins and a fountain"]),
  pair("elev-showroom", "Showroom", ["Showroom with plain walls and a simple glass front", "Plain walls and a simple glass front"], ["Showroom with an arched stone portal, wood fins and a backlit signage band", "Arched stone portal and wood fins"]),
  pair("elev-shed", "Industrial shed", ["Industrial shed with galvalume cladding and a plain admin block", "Galvalume sheet and a plain admin block"], ["Industrial shed with charcoal panels, a glazed admin block with louvers and a canopy", "Glazed admin block, louvers and a canopy"]),
];

const groups: Group[] = [
  { id: "rooms", label: "Rooms", concepts: rooms },
  { id: "homes", label: "Homes", concepts: homes },
  { id: "buildings", label: "Buildings", concepts: buildings },
];

/** One-screen section: intro, room tabs and tier notes on the left, the comparison filling the right. */
export default function MoodSlider({ intro }: { intro: React.ReactNode }) {
  const [gi, setGi] = useState(0);
  const [idx, setIdx] = useState(0);
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const concepts = groups[gi].concepts;
  const c = concepts[idx];

  const fromEvent = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
  };

  return (
    <div className="mood-wrap">
      <div className="mood-side">
        {intro}
        <div className="mood-groups" role="group" aria-label="Compare by scale">
          {groups.map((g, i) => (
            <button
              key={g.id}
              aria-pressed={i === gi}
              className={i === gi ? "is-on" : ""}
              onClick={() => {
                setGi(i);
                setIdx(0);
                setPos(50);
              }}
            >
              {g.label}
              <small>{g.concepts.length}</small>
            </button>
          ))}
        </div>
        <div className="mood-tabs" role="tablist" aria-label={`${groups[gi].label} to compare`}>
          {concepts.map((k, i) => (
            <button
              key={k.id}
              role="tab"
              aria-selected={i === idx}
              className={i === idx ? "is-on" : ""}
              onClick={() => {
                setIdx(i);
                setPos(50);
              }}
            >
              {k.label}
            </button>
          ))}
        </div>
        <ul className="mood-tiers">
          {tierIds.map((t) => (
            <li key={t}>
              <span className="tier-swatches" aria-hidden="true">
                {[tiers[t].floor, tiers[t].wood, tiers[t].soft, tiers[t].accent].map((c) => <i key={c} style={{ background: c }} />)}
              </span>
              <b>{tiers[t].label}</b>
              <span>{tiers[t].line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div
        ref={box}
        className="mood"
        style={{ "--pos": `${pos}%` } as React.CSSProperties}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          fromEvent(e);
        }}
        onPointerMove={(e) => dragging.current && fromEvent(e)}
        onPointerUp={() => (dragging.current = false)}
      >
        <div className="mood-pair" key={`${gi}-${c.id}`}>
          <Image src={c.premium.src} alt={c.premium.alt} fill sizes="(max-width: 900px) 100vw, 1100px" className="mood-img" />
          <div className="mood-top">
            <Image src={c.minimal.src} alt={c.minimal.alt} fill sizes="(max-width: 900px) 100vw, 1100px" className="mood-img" />
          </div>
        </div>
        <span className="mood-tag mood-tag--l">
          Minimal
          <small>{c.minimal.note}</small>
        </span>
        <span className="mood-tag mood-tag--r">
          Premium
          <small>{c.premium.note}</small>
        </span>
        <div
          className="mood-handle"
          role="slider"
          tabIndex={0}
          aria-label={`Compare minimal and premium ${c.label.toLowerCase()}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
            if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
          }}
        >
          <span>⟨ ⟩</span>
        </div>
      </div>
    </div>
  );
}
