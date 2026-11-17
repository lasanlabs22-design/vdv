import type { Room, Side } from "@/lib/plans";

export const WALL_T = 0.08;
export const WALL_H = 2.6;
export const DOOR_W = 0.9;

const opposite: Record<Side, Side> = { n: "s", s: "n", e: "w", w: "e" };

/** Rotation that turns a room's furniture so its back faces away from the door. */
const rotationFor: Record<Side, number> = { n: 0, s: Math.PI, e: -Math.PI / 2, w: Math.PI / 2 };

/**
 * Furniture is laid out in a canonical frame: back wall at -z, door at +z, width along x.
 * Rooms with their back on the east or west wall swap width and depth.
 */
export function canonical(room: Room) {
  const back = opposite[room.door];
  const sideways = back === "e" || back === "w";
  return { cw: sideways ? room.d : room.w, cd: sideways ? room.w : room.d, rotY: rotationFor[back] };
}

export const wallLength = (room: Room, side: Side) => (side === "n" || side === "s" ? room.w : room.d);

/** Door opening along its wall, measured from the wall's west or north end. */
export function doorSpan(room: Room) {
  const len = wallLength(room, room.door);
  const c = Math.max(DOOR_W / 2 + 0.1, Math.min(len - DOOR_W / 2 - 0.1, len * room.at));
  return { start: c - DOOR_W / 2, end: c + DOOR_W / 2 };
}

const EPS = 0.02;

/**
 * Door openings on each wall of a room, in metres from the wall's west or north end: the room's own door,
 * plus any neighbour's door that passes through the same wall line, so every doorway is open on both sides.
 */
export function doorGaps(room: Room, rooms: Room[]): Record<Side, { start: number; end: number; own: boolean }[]> {
  const gaps: Record<Side, { start: number; end: number; own: boolean }[]> = { n: [], s: [], e: [], w: [] };
  gaps[room.door].push({ ...doorSpan(room), own: true });
  for (const o of rooms) {
    if (o.id === room.id) continue;
    const s = doorSpan(o);
    const horizontal = o.door === "n" || o.door === "s";
    // Where the neighbour's door sits in plan, and which of this room's walls shares that line.
    const line = o.door === "n" ? o.z : o.door === "s" ? o.z + o.d : o.door === "w" ? o.x : o.x + o.w;
    const a = (horizontal ? o.x : o.z) + s.start, b = (horizontal ? o.x : o.z) + s.end;
    const side: Side | null = horizontal
      ? Math.abs(line - room.z) < EPS ? "n" : Math.abs(line - (room.z + room.d)) < EPS ? "s" : null
      : Math.abs(line - room.x) < EPS ? "w" : Math.abs(line - (room.x + room.w)) < EPS ? "e" : null;
    if (!side || opposite[o.door] !== side) continue;
    const base = horizontal ? room.x : room.z;
    const len = wallLength(room, side);
    const start = Math.max(0, a - base), end = Math.min(len, b - base);
    if (end - start > 0.3) gaps[side].push({ start, end, own: false });
  }
  return gaps;
}

/** Outward unit normal of a wall, in plan (x, z). */
export const normals: Record<Side, [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
