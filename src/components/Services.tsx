import { site } from "@/lib/site";

const lines: Record<string, string> = {
  "Architecture Design":
    "Homes, villas, apartment blocks and institutional buildings, taken from site study and concept design through to detailed working drawings.",
  "Interior Design":
    "Complete interiors for homes and workplaces: ceilings and lighting, modular kitchens, wardrobes and pooja units, for every budget from minimal to premium.",
  "3D Visualization":
    "Photorealistic views of every room and elevation, so you can see your space and refine it before construction begins.",
  "Turnkey Projects":
    "One accountable team for design, materials, execution and handover. You receive the keys to a finished, ready-to-live space.",
  "Villas & Commercial Spaces":
    "Independent villas, gated communities, offices, showrooms, salons, malls and industrial sheds, each shaped around how it will be used.",
};

export default function Services() {
  return (
    <ol className="services">
      {site.services.map((s, i) => (
        <li key={s} className="reveal" data-delay={i * 80}>
          <span className="services-num">{String(i + 1).padStart(2, "0")}</span>
          <h3>{s}</h3>
          <p>{lines[s]}</p>
        </li>
      ))}
    </ol>
  );
}
