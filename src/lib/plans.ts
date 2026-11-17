// Preset plans for the 3D studio. One source drives both the 2D blueprint and the 3D model.
// Units are metres. x runs east, z runs south, (0, 0) is the plan's north-west corner.

export type Side = "n" | "s" | "e" | "w";

export type Kind =
  | "living" | "dining" | "kitchen" | "bedroom" | "kids" | "bath" | "pooja" | "balcony" | "foyer" | "utility"
  | "stair" | "porch" | "study" | "dress" | "workspace" | "cabin" | "meeting" | "reception" | "retail" | "display"
  | "counter" | "trial" | "store";

export type Room = { id: string; name: string; kind: Kind; x: number; z: number; w: number; d: number; door: Side; at: number };
export type Floor = { name: string; rooms: Room[] };
export type PlanId = "1bhk" | "2bhk" | "3bhk" | "villa" | "office" | "retail" | "pooja" | "villa-g2" | "highrise" | "community" | "mall" | "salon" | "industrial";

export type Plan = {
  id: PlanId;
  label: string;
  group: "Residential" | "Commercial" | "Sacred" | "Communities" | "Industrial";
  blurb: string;
  /** "Starting from" price, only where the client has published one. */
  from?: string;
  /** The client's finished design board for this plan. */
  board?: string;
  floors: Floor[];
};

export type TierId = "minimal" | "signature" | "premium";

export type Tier = {
  label: string;
  line: string;
  floor: string;
  wall: string;
  wood: string;
  soft: string;
  accent: string;
  /** Strength of hidden cove and strip lighting. */
  glow: number;
  /** Floor roughness: low reads as polished marble. */
  rough: number;
};

export const tierIds: TierId[] = ["minimal", "signature", "premium"];

export const tiers: Record<TierId, Tier> = {
  minimal: { label: "Minimal", line: "Clean lines, light oak, daylight calm.", floor: "#e6ddcf", wall: "#f1ece4", wood: "#caa67d", soft: "#e4d9c7", accent: "#b9a37f", glow: 0, rough: 0.8 },
  signature: { label: "Signature", line: "Walnut slats, sage tones, warm cove light.", floor: "#d6c4a7", wall: "#eee3d2", wood: "#7a5131", soft: "#8b9870", accent: "#c79c45", glow: 0.8, rough: 0.5 },
  premium: { label: "Premium", line: "Marble, gold inlay and layered glow.", floor: "#f4efe9", wall: "#f6ecdd", wood: "#583820", soft: "#dcc8a6", accent: "#dcaa3e", glow: 1.8, rough: 0.16 },
};

export type Feature = { id: string; label: string };

const ceiling: Feature = { id: "ceiling", label: "Cove ceiling" };

export const featuresByKind: Record<Kind, Feature[]> = {
  living: [{ id: "tv", label: "TV feature wall" }, { id: "sofa", label: "L-sofa & rug" }, ceiling],
  dining: [{ id: "table", label: "Dining set" }, { id: "crockery", label: "Crockery unit" }, ceiling],
  kitchen: [{ id: "counters", label: "Modular counters" }, { id: "tall", label: "Tall units" }, { id: "island", label: "Breakfast island" }],
  bedroom: [{ id: "bed", label: "Bed & side tables" }, { id: "wardrobe", label: "Wardrobe" }, { id: "headboard", label: "Arched headboard wall" }, ceiling],
  kids: [{ id: "bed", label: "Bed" }, { id: "desk", label: "Study desk" }, { id: "wardrobe", label: "Wardrobe" }, ceiling],
  bath: [{ id: "vanity", label: "Vanity & mirror" }, { id: "shower", label: "Glass shower" }],
  pooja: [{ id: "mandir", label: "Mandir with arch" }, { id: "lamps", label: "Lamps & bells" }, { id: "rangoli", label: "Lotus floor inlay" }],
  balcony: [{ id: "swing", label: "Swing chair" }, { id: "planters", label: "Planters" }, { id: "seat", label: "Deck seating" }],
  foyer: [{ id: "console", label: "Console & mirror" }, { id: "shoe", label: "Shoe unit" }],
  utility: [{ id: "units", label: "Utility units" }],
  stair: [{ id: "stairs", label: "Staircase" }, { id: "wall", label: "Leaf relief wall" }],
  porch: [{ id: "car", label: "Car parking" }, { id: "wall", label: "Tree of life wall" }, { id: "ceiling", label: "Floating ceiling" }],
  study: [{ id: "desk", label: "Desk & shelves" }],
  dress: [{ id: "units", label: "Walk-in units" }, { id: "island", label: "Dresser island" }],
  workspace: [{ id: "desks", label: "Workstations" }, { id: "ceiling", label: "Baffle ceiling" }],
  cabin: [{ id: "desk", label: "Executive desk" }, { id: "shelves", label: "Display shelves" }],
  meeting: [{ id: "table", label: "Meeting table" }, { id: "screen", label: "Display wall" }],
  reception: [{ id: "counter", label: "Reception desk" }, { id: "wall", label: "Logo wall" }, { id: "seats", label: "Waiting seats" }],
  retail: [{ id: "racks", label: "Display racks" }, { id: "podium", label: "Centre podium" }, ceiling],
  display: [{ id: "podium", label: "Window podiums" }],
  counter: [{ id: "desk", label: "Billing counter" }, { id: "shelves", label: "Back shelves" }],
  trial: [{ id: "booths", label: "Trial booths" }],
  store: [{ id: "shelves", label: "Storage racks" }],
};

const r = (id: string, name: string, kind: Kind, x: number, z: number, w: number, d: number, door: Side, at = 0.5): Room => ({ id, name, kind, x, z, w, d, door, at });

export const plans: Plan[] = [
  {
    id: "1bhk",
    label: "1 BHK",
    group: "Residential",
    blurb: "A first home, finished with care.",
    board: "/boards/home-1bhk.jpg",
    // From the client's Premium 1 BHK blueprint: bedroom 10' × 11', living/dining 13' × 12', toilet 4' × 7'.
    floors: [{
      name: "Home",
      rooms: [
        r("bed", "Bedroom", "bedroom", 0, 0, 3.05, 3.35, "s", 0.75),
        r("kitchen", "Kitchen", "kitchen", 3.05, 0, 2.13, 3.35, "s", 0.2),
        r("living", "Living / Dining", "living", 0, 3.35, 3.96, 3.66, "e", 0.79),
        r("bath", "Toilet", "bath", 3.96, 3.35, 1.22, 2.13, "w"),
        r("entry", "Entry", "foyer", 3.96, 5.48, 1.22, 1.53, "s"),
      ],
    }],
  },
  {
    id: "2bhk",
    label: "2 BHK",
    group: "Residential",
    blurb: "Complete interiors for a two bedroom home.",
    from: "₹3.5 L",
    board: "/boards/home-2bhk.jpg",
    // Follows the client's Premium 2 BHK blueprint: bedrooms at the back, toilets either side of the passage,
    // living with kitchen and dining at the front by the entry.
    floors: [{
      name: "Home",
      rooms: [
        r("bed2", "Bedroom 2", "bedroom", 0, 0, 3.35, 3.35, "s", 0.8),
        r("master", "Master bedroom", "bedroom", 3.35, 0, 4.27, 3.35, "s", 0.22),
        r("bath1", "Toilet", "bath", 0, 3.35, 2.13, 1.52, "e"),
        r("passage", "Passage", "foyer", 2.13, 3.35, 3.05, 1.52, "s", 0.35),
        r("bath2", "Attached toilet", "bath", 5.18, 3.35, 2.44, 1.52, "w"),
        r("living", "Living", "living", 0, 4.87, 4.27, 4.27, "s", 0.8),
        r("kitchen", "Kitchen", "kitchen", 4.27, 4.87, 3.35, 2.13, "s"),
        r("dining", "Dining", "dining", 4.27, 7, 3.35, 2.14, "w"),
      ],
    }],
  },
  {
    id: "3bhk",
    label: "3 BHK",
    group: "Residential",
    blurb: "Three bedrooms, a pooja room and room to grow.",
    from: "₹7.5 L",
    board: "/boards/home-3bhk.jpg",
    floors: [{
      name: "Home",
      rooms: [
        r("living", "Living", "living", 0, 0, 5.4, 4.8, "e", 0.3),
        r("dining", "Dining", "dining", 5.4, 0, 3.3, 3, "w"),
        r("kitchen", "Kitchen", "kitchen", 8.7, 0, 3, 3, "w"),
        r("utility", "Utility", "utility", 11.7, 0, 1.5, 3, "w"),
        r("pooja", "Pooja", "pooja", 5.4, 3, 1.5, 1.8, "n"),
        r("passage", "Passage", "foyer", 6.9, 3, 3.3, 1.8, "n"),
        r("bath1", "Common bath", "bath", 10.2, 3, 3, 1.8, "w"),
        r("master", "Master bedroom", "bedroom", 0, 4.8, 4.5, 4.8, "n"),
        r("bed2", "Bedroom 2", "bedroom", 4.5, 4.8, 3.6, 4.8, "n", 0.83),
        r("kids", "Kids room", "kids", 8.1, 4.8, 3.3, 3.6, "n", 0.27),
        r("bath2", "Bath 2", "bath", 11.4, 4.8, 1.8, 2.4, "w"),
        r("bath3", "Bath 3", "bath", 11.4, 7.2, 1.8, 2.4, "w", 0.25),
        r("balcony", "Balcony", "balcony", 8.1, 8.4, 3.3, 1.2, "n"),
      ],
    }],
  },
  {
    id: "villa",
    label: "Villa G+1",
    group: "Residential",
    blurb: "Architecture and interiors for an independent home.",
    floors: [
      {
        name: "Ground",
        rooms: [
          r("g-porch", "Porch", "porch", 0, 0, 4.2, 5.4, "e", 0.22),
          r("g-foyer", "Foyer", "foyer", 4.2, 0, 2.4, 2.4, "w"),
          r("g-pooja", "Pooja room", "pooja", 6.6, 0, 3, 2.4, "s"),
          r("g-living", "Living", "living", 4.2, 2.4, 5.4, 4.2, "n", 0.22),
          r("g-bath", "Powder bath", "bath", 0, 5.4, 2.4, 1.8, "e"),
          r("g-utility", "Utility", "utility", 0, 7.2, 2.4, 1.8, "e"),
          r("g-stair", "Staircase", "stair", 2.4, 5.4, 1.8, 3.6, "e", 0.17),
          r("g-dining", "Dining", "dining", 4.2, 6.6, 5.4, 2.4, "n"),
          r("g-guest", "Guest bedroom", "bedroom", 0, 9, 4.2, 3, "n", 0.79),
          r("g-gbath", "Guest bath", "bath", 4.2, 9, 1.8, 3, "w"),
          r("g-kitchen", "Kitchen", "kitchen", 6, 9, 3.6, 3, "n"),
        ],
      },
      {
        name: "First",
        rooms: [
          r("f-balcony", "Front balcony", "balcony", 0, 0, 9.6, 1.5, "s", 0.28),
          r("f-master", "Master bedroom", "bedroom", 0, 1.5, 5.4, 3.9, "s", 0.61),
          r("f-mbath", "Master bath", "bath", 5.4, 1.5, 2.1, 3.9, "w"),
          r("f-dress", "Walk-in wardrobe", "dress", 7.5, 1.5, 2.1, 3.9, "s"),
          r("f-bath", "Bath", "bath", 0, 5.4, 2.4, 1.8, "e"),
          r("f-study", "Study", "study", 0, 7.2, 2.4, 1.8, "e"),
          r("f-stair", "Staircase", "stair", 2.4, 5.4, 1.8, 3.6, "e", 0.17),
          r("f-lounge", "Family lounge", "living", 4.2, 5.4, 5.4, 3.6, "w"),
          r("f-bed2", "Bedroom 2", "bedroom", 0, 9, 4.8, 3, "n", 0.69),
          r("f-kids", "Kids room", "kids", 4.8, 9, 4.8, 3, "n"),
        ],
      },
    ],
  },
  {
    id: "office",
    label: "Office",
    group: "Commercial",
    blurb: "Workplaces that welcome clients and focus teams.",
    floors: [{
      name: "Office",
      rooms: [
        r("reception", "Reception", "reception", 0, 0, 3.6, 3.6, "n"),
        r("work", "Open workspace", "workspace", 3.6, 0, 7.2, 6, "w", 0.3),
        r("md", "MD cabin", "cabin", 10.8, 0, 3.6, 3.6, "w"),
        r("cabin", "Manager cabin", "cabin", 10.8, 3.6, 3.6, 2.4, "w"),
        r("meeting", "Meeting room", "meeting", 0, 3.6, 3.6, 3.6, "e", 0.33),
        r("pantry", "Pantry", "kitchen", 0, 7.2, 3.6, 2.4, "e"),
        r("conference", "Conference", "meeting", 3.6, 6, 4.8, 3.6, "n"),
        r("lounge", "Breakout lounge", "living", 8.4, 6, 2.4, 3.6, "n"),
        r("wash", "Washrooms", "bath", 10.8, 6, 3.6, 3.6, "w"),
      ],
    }],
  },
  {
    id: "retail",
    label: "Showroom",
    group: "Commercial",
    blurb: "Retail spaces designed to stop people at the door.",
    floors: [{
      name: "Showroom",
      rooms: [
        r("floor", "Showroom floor", "retail", 0, 0, 8.4, 6, "n"),
        r("window", "Window display", "display", 8.4, 0, 3.6, 2.4, "w"),
        r("billing", "Billing", "counter", 8.4, 2.4, 3.6, 3.6, "w"),
        r("trial", "Trial rooms", "trial", 0, 6, 3.6, 3, "n"),
        r("store", "Store room", "store", 3.6, 6, 4.8, 3, "n"),
        r("staff", "Staff & wash", "bath", 8.4, 6, 3.6, 3, "w"),
      ],
    }],
  },
  {
    id: "pooja",
    label: "Pooja room",
    group: "Sacred",
    blurb: "A home for the Lord, inside your home.",
    floors: [{ name: "Pooja room", rooms: [r("pooja", "Pooja room", "pooja", 0, 0, 3.6, 3, "s")] }],
  },
  { id: "villa-g2", label: "Luxury villa · G+2", group: "Residential", board: "/boards/villa-g2.jpg", blurb: "Three levels, generous suites and a private terrace.", floors: Array.from({ length: 3 }, (_, i) => ({ name: ["Ground", "First", "Second"][i], rooms: [r("v"+i+"l", i ? "Family lounge" : "Living hall", "living", 0, 0, 6, 5, "n"), r("v"+i+"s", "Staircase", "stair", 6, 0, 3, 5, "w"), r("v"+i+"b", "Bedroom suite", "bedroom", 0, 5, 6, 5, "n"), r("v"+i+"d", i ? "Terrace" : "Kitchen", i ? "balcony" : "kitchen", 6, 5, 3, 5, "w")] })) },
  { id: "highrise", label: "High-rise residences", group: "Communities", board: "/boards/highrise-residential.jpg", blurb: "G+20 concept tower with editable residential floor plates.", floors: Array.from({ length: 21 }, (_, i) => ({ name: i ? "Level " + i : "Ground", rooms: [r("h"+i+"a", i ? "Residence A" : "Grand lobby", i ? "living" : "reception", 0, 0, 8, 8, "n"), r("h"+i+"c", "Circulation core", "stair", 8, 0, 4, 8, "w"), r("h"+i+"b", i ? "Residence B" : "Residents lounge", "living", 12, 0, 8, 8, "n")] })) },
  { id: "community", label: "Gated community", group: "Communities", board: "/boards/gated-community-sreevaas.jpg", blurb: "A neighbourhood concept with villas and a shared clubhouse.", floors: [{ name: "Site plan", rooms: [r("ca", "Villa A", "living", 0, 0, 8, 10, "s"), r("cb", "Villa B", "living", 13, 0, 8, 10, "s"), r("cc", "Clubhouse", "reception", 0, 16, 12, 8, "n"), r("cp", "Meditation pavilion", "pooja", 16, 17, 5, 6, "n")] }] },
  { id: "mall", label: "Shopping mall", group: "Commercial", board: "/boards/mall-city-square.jpg", blurb: "Retail galleries, a central concourse and a food court.", floors: Array.from({ length: 3 }, (_, i) => ({ name: ["Ground", "First", "Second"][i], rooms: [r("m"+i+"a", i === 2 ? "Food court" : "Retail gallery A", i === 2 ? "dining" : "retail", 0, 0, 12, 12, "e"), r("m"+i+"c", "Central concourse", "foyer", 12, 0, 6, 12, "n"), r("m"+i+"b", "Retail gallery B", "retail", 18, 0, 12, 12, "w"), r("m"+i+"s", "Stair & services", "stair", 12, 12, 6, 6, "n")] })) },
  { id: "salon", label: "Beauty salon", group: "Commercial", board: "/boards/salon-luxury-beauty.jpg", blurb: "Styling, private treatment suites and a welcoming reception.", floors: [{ name: "Salon", rooms: [r("sr", "Reception", "reception", 0, 0, 4, 4, "n"), r("sw", "Styling studio", "workspace", 4, 0, 8, 4, "w"), r("sf", "Facial suite", "cabin", 0, 4, 4, 4, "n"), r("sm", "Makeup suite", "dress", 4, 4, 4, 4, "n"), r("sh", "Hair wash", "utility", 8, 4, 4, 4, "n")] }] },
  { id: "industrial", label: "Industrial & warehouse", group: "Industrial", board: "/boards/industrial-shed.jpg", blurb: "A 60 × 30 m facility concept with production, storage and administration.", floors: [{ name: "Facility", rooms: [r("ip", "Production hall", "workspace", 0, 0, 40, 24, "s"), r("is", "Warehouse", "store", 40, 0, 20, 24, "s"), r("ir", "Reception", "reception", 0, 24, 12, 6, "s"), r("ia", "Administration", "workspace", 12, 24, 30, 6, "s"), r("im", "Conference", "meeting", 42, 24, 18, 6, "s")] }] },

];

export const planById = (id: string) => plans.find((p) => p.id === id);

/** Overall footprint of a floor, in metres. */
export const extent = (floor: Floor) => ({
  w: Math.max(...floor.rooms.map((r) => r.x + r.w)),
  d: Math.max(...floor.rooms.map((r) => r.z + r.d)),
});

/** Carpet area across all floors, in square feet. */
export const sqft = (plan: Plan) =>
  Math.round(plan.floors.reduce((sum, f) => sum + f.rooms.reduce((s, r) => s + r.w * r.d, 0), 0) * 10.764);
