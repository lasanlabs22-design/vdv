export type WorkCategory = "Bedrooms" | "Living" | "Kitchens" | "Staircases" | "Balconies" | "Exteriors" | "Entrances" | "Pooja";

export type Work = { src: string; title: string; category: WorkCategory; w: number; h: number };

export const workCategories: WorkCategory[] = ["Bedrooms", "Living", "Kitchens", "Staircases", "Balconies", "Exteriors", "Entrances", "Pooja"];

const w = (file: string, title: string, category: WorkCategory, size: [number, number]): Work => ({
  src: `/works/${file}.jpg`,
  title,
  category,
  w: size[0],
  h: size[1],
});

export const works: Work[] = [
  w("24-pooja-room-balaji", "Srivari pooja room", "Pooja", [1199, 1312]),
  w("17-master-bedroom-gold", "Master bedroom, gold leaf", "Bedrooms", [1600, 900]),
  w("19-living-hall-mountain-arch", "Living hall, seven hills arch", "Living", [1600, 900]),
  w("11-elevation-nellore-g1", "G+1 residence, Nellore", "Exteriors", [1536, 1024]),
  w("06-staircase-onyx-wall", "Backlit onyx staircase", "Staircases", [1536, 1024]),
  w("22-corridor-lotus", "Lotus corridor", "Entrances", [1086, 1448]),
  w("15-kitchen-glossy-sage", "Sage gloss kitchen", "Kitchens", [1600, 900]),
  w("14-balcony-swing-night", "Swing balcony at dusk", "Balconies", [1448, 1086]),
  w("03-bedroom-minimal-daylight", "Calm daylight bedroom", "Bedrooms", [1536, 1024]),
  w("12-living-hall-g2-first-floor", "First floor hall, G+2", "Living", [1600, 900]),
  w("10-porch-tree-of-life-night", "Tree of life porch", "Exteriors", [1600, 900]),
  w("20-staircase-gold-leaf", "Gold leaf staircase", "Staircases", [1312, 1199]),
  w("07-kitchen-olive-island", "Olive island kitchen", "Kitchens", [1536, 1024]),
  w("08-foyer-carved-entrance", "Carved teak entrance", "Entrances", [1448, 1086]),
  w("13-guest-bedroom-1-olive", "Guest bedroom, olive", "Bedrooms", [1600, 900]),
  w("04-balcony-curved-wood-ceiling", "Curved teak balcony", "Balconies", [1586, 992]),
  w("09-staircase-wave-wall", "Wave relief staircase", "Staircases", [1536, 1024]),
  w("18-guest-bedroom-2-maroon", "Guest bedroom, maroon", "Bedrooms", [1600, 900]),
  w("05-porch-carport-day", "Floating ceiling carport", "Exteriors", [1600, 900]),
  w("23-balcony-lotus-compact", "Compact lotus balcony", "Balconies", [1199, 1312]),
  w("21-guest-bedroom-3-sage", "Guest bedroom, sage", "Bedrooms", [1600, 900]),
];
