import type { PlanId } from "./plans";

/** A labelled panel on a design board, in the board's own pixels: [x, y, width, height]. */
export type Panel = { label: string; rect: [number, number, number, number] };

// The client's design boards. `hero` is the main render cut from the board; the board itself opens full size.
export type Project = {
  slug: string;
  title: string;
  group: "Homes" | "Communities" | "Commercial" | "Industrial";
  line: string;
  board: [number, number];
  hero: [number, number];
  /** Rooms and drawings on the board, for the studio viewer to zoom into. */
  panels: Panel[];
  /** Studio plan built from this board's blueprint. */
  plan?: PlanId;
};

const p = (label: string, x: number, y: number, w: number, h: number): Panel => ({ label, rect: [x, y, w, h] });

export const projects: Project[] = [
  {
    slug: "villa-g2", title: "Luxury villa, G+2", group: "Homes", line: "Five bedrooms, a home theatre, puja unit and terrace garden.", board: [1600, 900], hero: [816, 526],
    panels: [
      p("Elevation", 0, 0, 818, 528), p("Living hall", 1040, 0, 560, 282), p("Dining", 1040, 284, 308, 244), p("Modular kitchen", 1350, 284, 250, 244),
      p("Master bedroom", 0, 530, 460, 178), p("Bedroom 2", 462, 530, 365, 178), p("Bedroom 3", 829, 530, 365, 178), p("Home theatre", 1196, 530, 404, 178),
      p("Puja unit", 0, 710, 310, 190), p("Staircase", 312, 710, 297, 190), p("Family lounge", 611, 710, 326, 190), p("Terrace garden", 939, 710, 350, 190), p("Balcony", 1291, 710, 309, 190),
    ],
  },
  {
    slug: "home-3bhk", title: "Luxury 3 BHK", group: "Homes", line: "Three themed bedrooms, a puja unit and a swing balcony.", board: [1536, 1024], hero: [1136, 536], plan: "3bhk",
    panels: [
      p("Living", 0, 0, 1138, 538), p("Floor plan", 1140, 0, 396, 745), p("Master bedroom", 0, 540, 405, 213), p("Bedroom 2", 407, 540, 385, 213), p("Bedroom 3", 794, 540, 345, 213),
      p("Dining", 0, 755, 415, 255), p("Modular kitchen", 417, 755, 420, 255), p("Puja unit", 839, 755, 330, 255), p("Balcony", 1171, 755, 365, 255),
    ],
  },
  {
    slug: "home-2bhk", title: "Premium 2 BHK", group: "Homes", line: "Olive and gold living, two bedrooms and an open kitchen.", board: [1536, 1024], hero: [1148, 683], plan: "2bhk",
    panels: [p("Living", 0, 0, 1150, 685), p("Floor plan", 1152, 0, 384, 685), p("Master bedroom", 0, 687, 420, 305), p("Bedroom 2", 422, 687, 370, 305), p("Kitchen", 794, 687, 410, 305), p("Dining", 1206, 687, 330, 305)],
  },
  {
    slug: "home-1bhk", title: "Premium 1 BHK", group: "Homes", line: "A first home with the finish of a villa.", board: [1536, 1024], hero: [1148, 683], plan: "1bhk",
    panels: [p("Living", 0, 0, 1150, 685), p("Floor plan", 1152, 0, 384, 685), p("Bedroom", 0, 687, 572, 330), p("Kitchen", 574, 687, 510, 330), p("Toilet", 1086, 687, 450, 330)],
  },
  {
    slug: "highrise-residential", title: "High-rise residences, G+20", group: "Communities", line: "2, 3 and 4 BHK towers with a sky lounge and rooftop pool.", board: [1536, 1024], hero: [903, 768],
    panels: [
      p("Towers", 0, 0, 905, 770), p("Grand lobby", 908, 0, 398, 287), p("Sky lounge", 908, 289, 398, 218), p("Rooftop pool", 908, 509, 398, 261), p("Amenities", 1308, 0, 228, 770),
      p("Landscaped garden", 0, 772, 460, 215), p("Clubhouse", 462, 772, 422, 215), p("Gym", 886, 772, 420, 215),
    ],
  },
  {
    slug: "gated-community-sreevaas", title: "Sreevaas gated community", group: "Communities", line: "Villas and plots, a clubhouse, and a temple and meditation zone.", board: [1600, 900], hero: [1315, 465],
    panels: [
      p("Entrance gate", 0, 0, 1318, 470), p("Amenities", 1320, 0, 280, 720), p("Villa", 0, 472, 435, 250), p("Clubhouse & pool", 437, 472, 518, 250), p("Garden pavilion", 957, 472, 363, 250),
      p("Temple", 0, 722, 320, 178), p("Play area", 322, 722, 328, 178), p("Sports court", 652, 722, 333, 178), p("Jogging track", 987, 722, 303, 178), p("Outdoor gym", 1292, 722, 308, 178),
    ],
  },
  {
    slug: "mall-city-square", title: "City Square shopping mall", group: "Commercial", line: "Retail, food court, multiplex and a landscaped atrium.", board: [1600, 900], hero: [1075, 632],
    panels: [
      p("Facade", 0, 0, 1080, 635), p("Central atrium", 1082, 0, 518, 228), p("Food court", 1082, 230, 518, 195), p("Multiplex", 1082, 427, 518, 208),
      p("Retail store", 0, 637, 355, 263), p("Escalators", 357, 637, 370, 263), p("Mall reception", 729, 637, 360, 263), p("Amenities", 1090, 637, 510, 263),
    ],
  },
  {
    slug: "salon-luxury-beauty", title: "Luxury beauty salon", group: "Commercial", line: "Reception, styling, makeup, facial, hair wash and pedicure zones.", board: [1536, 1024], hero: [900, 640],
    panels: [
      p("Shopfront", 0, 0, 900, 645), p("Reception", 905, 0, 631, 322), p("Hair styling", 905, 325, 631, 320), p("Makeup zone", 0, 650, 395, 285),
      p("Facial room", 398, 650, 358, 285), p("Hair wash", 760, 650, 365, 285), p("Pedicure & manicure", 1128, 650, 408, 285),
    ],
  },
  {
    slug: "industrial-shed", title: "Industrial shed, PEB", group: "Industrial", line: "A 60 × 30 m pre-engineered shed with its office and admin block.", board: [1600, 900], hero: [1283, 515],
    panels: [
      p("Front view", 0, 0, 1285, 518), p("Specifications", 1287, 0, 313, 518), p("Shop floor", 0, 520, 635, 220), p("Reception", 638, 520, 497, 220), p("Conference room", 1137, 520, 463, 220),
      p("Front elevation", 0, 742, 463, 140), p("Side elevation", 465, 742, 505, 140), p("Typical section", 972, 742, 315, 140), p("Shed details", 1289, 742, 311, 140),
    ],
  },
];

/** 1280px WebP copy of the board, used as the 3D gallery texture. */
export const boardSrc = (p: Project) => `/boards/tex/${p.slug}.webp`;
export const heroSrc = (p: Project) => `/boards/${p.slug}-hero.jpg`;
/** The board enlarged 2× with a Lanczos filter and light sharpening, for zooming. Panel rects stay in board pixels. */
export const hdSrc = (p: Project) => `/boards/${p.slug}-hd.jpg`;
