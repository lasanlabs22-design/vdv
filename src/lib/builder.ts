// "Design your own": a customer-made project. Plans are edited in feet on a 1 ft grid and converted to
// metres for 3D. x runs east, z runs south, (0, 0) is the plot's north-west corner.
import { extent, featuresByKind, type Kind, type Plan, type Room, type Side, type TierId } from "./plans";

export const FT = 0.3048;

export type BRoom = {
  id: string; kind: Kind; name: string;
  x: number; z: number; w: number; d: number;
  door: Side; at: number;
  tier: TierId; off: string[];
  wall?: string; floor?: string;
};

export type Cladding = "none" | "stone" | "wood" | "granite";
export type Railing = "glass" | "ms" | "brass";
export type WindowStyle = "dark" | "wood" | "arched";
export type Parapet = "plain" | "band" | "frieze";
export type Gate = "slats" | "ms" | "ornate";
export type FacadeStyle = "contemporary" | "traditional" | "indo";

export type Elevation = {
  style: FacadeStyle; paint: string; accent: string; trim: string;
  cladding: Cladding; railing: Railing; windows: WindowStyle; parapet: Parapet; gate: Gate;
};

export type Project = { sourcePlan?: string; plot: { w: number; d: number }; facing: Side; floors: BRoom[][]; elevation: Elevation };

export const floorNames = ["Ground", "First", "Second", ...Array.from({ length: 18 }, (_, i) => `Level ${i + 3}`)];
export const MAX_FLOORS = 21;

/** The elements the firm offers, with sensible starting sizes in feet. */
export const elements: { kind: Kind; label: string; w: number; d: number; group: string }[] = [
  { kind: "living", label: "Living", w: 16, d: 14, group: "Living" },
  { kind: "dining", label: "Dining", w: 10, d: 10, group: "Living" },
  { kind: "kitchen", label: "Kitchen", w: 10, d: 10, group: "Living" },
  { kind: "pooja", label: "Pooja", w: 5, d: 6, group: "Living" },
  { kind: "foyer", label: "Foyer / passage", w: 6, d: 6, group: "Living" },
  { kind: "bedroom", label: "Bedroom", w: 12, d: 12, group: "Private" },
  { kind: "kids", label: "Kids room", w: 11, d: 11, group: "Private" },
  { kind: "bath", label: "Bath", w: 6, d: 8, group: "Private" },
  { kind: "dress", label: "Walk-in wardrobe", w: 7, d: 9, group: "Private" },
  { kind: "study", label: "Study", w: 9, d: 9, group: "Private" },
  { kind: "stair", label: "Staircase", w: 8, d: 12, group: "Service" },
  { kind: "utility", label: "Utility", w: 5, d: 8, group: "Service" },
  { kind: "store", label: "Store", w: 6, d: 6, group: "Service" },
  { kind: "balcony", label: "Balcony", w: 10, d: 5, group: "Outdoor" },
  { kind: "porch", label: "Car porch", w: 10, d: 18, group: "Outdoor" },
  { kind: "reception", label: "Reception", w: 10, d: 10, group: "Commercial" },
  { kind: "workspace", label: "Workspace", w: 20, d: 16, group: "Commercial" },
  { kind: "cabin", label: "Cabin", w: 10, d: 10, group: "Commercial" },
  { kind: "meeting", label: "Meeting room", w: 12, d: 10, group: "Commercial" },
  { kind: "retail", label: "Showroom floor", w: 20, d: 16, group: "Commercial" },
  { kind: "display", label: "Display window", w: 12, d: 8, group: "Commercial" },
  { kind: "trial", label: "Trial room", w: 8, d: 8, group: "Commercial" },
  { kind: "counter", label: "Billing counter", w: 10, d: 8, group: "Commercial" },
];

export const elementLabel = (kind: Kind) => elements.find((e) => e.kind === kind)?.label ?? kind;

export const plotPresets = [
  { w: 30, d: 40 },
  { w: 30, d: 50 },
  { w: 33, d: 60 },
  { w: 40, d: 60 },
  { w: 50, d: 80 },
];

/** Curated paints and materials, as a client would see in the firm's sample book. */
export const swatches = [
  { name: "Temple ivory", hex: "#f2ead9" },
  { name: "Lime white", hex: "#f7f5ef" },
  { name: "Sandalwood", hex: "#e3cba1" },
  { name: "Turmeric", hex: "#d9a441" },
  { name: "Kumkum", hex: "#8f1d22" },
  { name: "Laterite", hex: "#a5532e" },
  { name: "Terracotta", hex: "#b4643c" },
  { name: "Sage", hex: "#8b9870" },
  { name: "Peacock", hex: "#1f5c63" },
  { name: "Teak", hex: "#6b4426" },
  { name: "Stone grey", hex: "#a39d93" },
  { name: "Granite", hex: "#2d2a28" },
];

export const swatchName = (hex?: string) => swatches.find((s) => s.hex.toLowerCase() === hex?.toLowerCase())?.name ?? hex ?? "Default";

export const facadeStyles: Record<FacadeStyle, { label: string; line: string; defaults: Omit<Elevation, "style"> }> = {
  contemporary: {
    label: "Contemporary",
    line: "Clean planes, teak fins, glass and deep sunshades.",
    defaults: { paint: "#f2ead9", accent: "#6b4426", trim: "#2d2a28", cladding: "wood", railing: "glass", windows: "dark", parapet: "plain", gate: "slats" },
  },
  traditional: {
    label: "South Indian traditional",
    line: "Pillared verandah, temple arches, frieze parapet and brass.",
    defaults: { paint: "#e3cba1", accent: "#8f1d22", trim: "#d9a441", cladding: "stone", railing: "brass", windows: "arched", parapet: "frieze", gate: "ornate" },
  },
  indo: {
    label: "Indo-modern",
    line: "Natural stone, a teak pergola and calm earthy colours.",
    defaults: { paint: "#f7f5ef", accent: "#a5532e", trim: "#2d2a28", cladding: "stone", railing: "ms", windows: "wood", parapet: "band", gate: "ms" },
  },
};

export const elevationOptions = {
  cladding: [
    { id: "none", label: "None" },
    { id: "stone", label: "Natural stone" },
    { id: "wood", label: "Teak slats" },
    { id: "granite", label: "Black granite" },
  ],
  railing: [
    { id: "glass", label: "Glass" },
    { id: "ms", label: "MS black" },
    { id: "brass", label: "Brass" },
  ],
  windows: [
    { id: "dark", label: "Dark aluminium" },
    { id: "wood", label: "Teak frame" },
    { id: "arched", label: "Temple arch" },
  ],
  parapet: [
    { id: "plain", label: "Plain coping" },
    { id: "band", label: "Accent band" },
    { id: "frieze", label: "Temple frieze" },
  ],
  gate: [
    { id: "slats", label: "Teak slats" },
    { id: "ms", label: "MS black" },
    { id: "ornate", label: "Ornamental gold" },
  ],
} as const;

export const newProject = (): Project => ({
  plot: { w: 30, d: 40 },
  facing: "e",
  floors: [[]],
  elevation: { style: "contemporary", ...facadeStyles.contemporary.defaults },
});

let seq = 0;
export const uid = () => `r${Date.now().toString(36)}${(seq++).toString(36)}`;

const overlaps = (a: { x: number; z: number; w: number; d: number }, b: { x: number; z: number; w: number; d: number }) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.z < b.z + b.d && b.z < a.z + a.d;

/** Rooms that overlap another room on the same floor. */
export function clashes(rooms: BRoom[]) {
  const bad = new Set<string>();
  rooms.forEach((a, i) => rooms.slice(i + 1).forEach((b) => overlaps(a, b) && (bad.add(a.id), bad.add(b.id))));
  return bad;
}

/** The side of a room that faces the plot centre: a sensible first guess for its door. */
export function doorTowardsCentre(r: { x: number; z: number; w: number; d: number }, plot: { w: number; d: number }): Side {
  const dx = plot.w / 2 - (r.x + r.w / 2), dz = plot.d / 2 - (r.z + r.d / 2);
  return Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? "e" : "w") : dz > 0 ? "s" : "n";
}

/** First free spot on the grid for a new room, scanning from the plot's north-west corner. */
export function freeSpot(rooms: BRoom[], w: number, d: number, plot: { w: number; d: number }) {
  for (let z = 0; z + d <= plot.d; z++)
    for (let x = 0; x + w <= plot.w; x++)
      if (!rooms.some((r) => overlaps(r, { x, z, w, d }))) return { x, z };
  return { x: 0, z: 0 };
}

export function makeRoom(kind: Kind, rooms: BRoom[], plot: { w: number; d: number }): BRoom {
  const el = elements.find((e) => e.kind === kind)!;
  const w = Math.min(el.w, plot.w), d = Math.min(el.d, plot.d);
  const { x, z } = freeSpot(rooms, w, d, plot);
  const count = rooms.filter((r) => r.kind === kind).length;
  return {
    id: uid(), kind, name: count ? `${el.label} ${count + 1}` : el.label, x, z, w, d,
    door: doorTowardsCentre({ x, z, w, d }, plot), at: 0.5, tier: "signature", off: [],
  };
}

/** A preset plan, converted to feet and set on a plot with a front setback for the gate and garden. */
export function fromPlan(plan: Plan): Project {
  const { w, d } = plan.floors.reduce((m, f) => {
    const e = extent(f);
    return { w: Math.max(m.w, e.w), d: Math.max(m.d, e.d) };
  }, { w: 0, d: 0 });
  const side = 3, front = 8;
  return {
    sourcePlan: plan.id,
    plot: { w: Math.ceil(w / FT) + side * 2, d: Math.ceil(d / FT) + front + side },
    facing: "n",
    floors: plan.floors.slice(0, MAX_FLOORS).map((f) =>
      f.rooms.map((r) => ({
        id: uid(), kind: r.kind, name: r.name,
        x: Math.round(r.x / FT) + side, z: Math.round(r.z / FT) + front, w: Math.round((r.x + r.w) / FT) - Math.round(r.x / FT), d: Math.round((r.z + r.d) / FT) - Math.round(r.z / FT),
        door: r.door, at: r.at, tier: "signature" as TierId, off: [],
      })),
    ),
    elevation: { style: "contemporary", ...facadeStyles.contemporary.defaults },
  };
}

export const toRoom = (r: BRoom): Room => ({ id: r.id, name: r.name, kind: r.kind, x: r.x * FT, z: r.z * FT, w: r.w * FT, d: r.d * FT, door: r.door, at: r.at });

export const builtUpSqft = (p: Project) => Math.round(p.floors.flat().reduce((s, r) => s + r.w * r.d, 0));

export const sideLength = (r: { w: number; d: number }, side: Side) => (side === "n" || side === "s" ? r.w : r.d);

/** Whether each side of a room faces outside: true unless another room covers at least half of it. */
export function exteriorSides(r: BRoom, rooms: BRoom[]): Record<Side, boolean> {
  const cover = (side: Side) => {
    let len = 0;
    for (const o of rooms) {
      if (o.id === r.id) continue;
      if (side === "n" && o.z + o.d === r.z) len += Math.max(0, Math.min(r.x + r.w, o.x + o.w) - Math.max(r.x, o.x));
      if (side === "s" && o.z === r.z + r.d) len += Math.max(0, Math.min(r.x + r.w, o.x + o.w) - Math.max(r.x, o.x));
      if (side === "w" && o.x + o.w === r.x) len += Math.max(0, Math.min(r.z + r.d, o.z + o.d) - Math.max(r.z, o.z));
      if (side === "e" && o.x === r.x + r.w) len += Math.max(0, Math.min(r.z + r.d, o.z + o.d) - Math.max(r.z, o.z));
    }
    return len;
  };
  const out = {} as Record<Side, boolean>;
  for (const s of ["n", "s", "e", "w"] as Side[]) out[s] = cover(s) < sideLength(r, s) / 2;
  return out;
}

export type Opening = { side: Side; c: number; w: number; type: "window" | "door" | "vent" };

/** Openings on a room's outside walls, in feet along each wall: its door if it opens outside, plus windows. */
export function openings(r: BRoom, rooms: BRoom[]): Opening[] {
  const ext = exteriorSides(r, rooms);
  const out: Opening[] = [];
  const noWindows: Kind[] = ["store", "porch", "balcony"];
  for (const side of ["n", "s", "e", "w"] as Side[]) {
    if (!ext[side]) continue;
    const len = sideLength(r, side);
    if (side === r.door) {
      out.push({ side, c: Math.max(2, Math.min(len - 2, len * r.at)), w: 3.5, type: "door" });
      continue;
    }
    if (noWindows.includes(r.kind) || len < 5) continue;
    if (r.kind === "bath" || r.kind === "utility") {
      out.push({ side, c: len / 2, w: 2, type: "vent" });
      continue;
    }
    const n = len >= 15 ? 2 : 1;
    const w = Math.min(5, (len / n) * 0.5);
    for (let i = 0; i < n; i++) out.push({ side, c: (len * (i + 1)) / (n + 1), w, type: "window" });
  }
  return out;
}

/** Stages of the construction timeline. */
export const timelineStages = (floors: number) => [
  "Plot marking",
  "Foundation & plinth",
  ...floorNames.slice(0, floors).map((f) => `${f} floor`),
  "Roof & parapet",
  "Elevation & paint",
  "Landscape & gate",
  "Lights on",
];

export function summary(p: Project) {
  const e = p.elevation;
  const facing = { n: "North", s: "South", e: "East", w: "West" }[p.facing];
  return [
    "Namaskaram! I designed my own project in the DV Spaces builder.",
    `Plot: ${p.plot.w} × ${p.plot.d} ft, ${facing} facing, ${p.floors.length === 1 ? "G" : `G+${p.floors.length - 1}`}, about ${builtUpSqft(p).toLocaleString("en-IN")} sq ft built up`,
    "",
    ...p.floors.flatMap((rooms, i) => [
      `${floorNames[i]} floor`,
      ...rooms.map((r) => {
        const feats = featuresByKind[r.kind].filter((f) => !r.off.includes(f.id)).map((f) => f.label);
        const colours = r.wall || r.floor ? `, walls ${swatchName(r.wall)}, floor ${swatchName(r.floor)}` : "";
        return `• ${r.name}: ${r.w} × ${r.d} ft, ${r.tier}${colours}${feats.length ? ` (${feats.join(", ")})` : ""}`;
      }),
      "",
    ]),
    `Elevation: ${facadeStyles[e.style].label}, paint ${swatchName(e.paint)}, accent ${swatchName(e.accent)}, trim ${swatchName(e.trim)}`,
    `Cladding ${e.cladding}, railing ${e.railing}, windows ${e.windows}, parapet ${e.parapet}, gate ${e.gate}`,
    "",
    "Please share a quote and a site visit date.",
  ].join("\n");
}
