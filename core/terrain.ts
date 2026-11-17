// The world is a pure function of a seed and coordinates. Nothing here is stored,
// so the world can be effectively unbounded while saved state stays small.

export type Terrain = "glade" | "grove" | "mist" | "ridge";

export function terrainAt(seed: number, x: number, y: number): Terrain {
  const raw = 0.65 * noise(seed, x, y, 9) + 0.35 * noise(seed + 1, x, y, 3);

  // Keep the starting area safe.
  const height = 0.5 + (raw - 0.5) * Math.min(1, Math.hypot(x, y) / 10);

  if (height < 0.3) return "mist";
  if (height > 0.7) return "ridge";

  return noise(seed + 2, x, y, 6) < 0.45 ? "grove" : "glade";
}

// Each barrier keeps its material and reusable opener together.
export const TERRAIN_RULES: Record<
  Terrain,
  { item: string; opener?: string }
> = {
  glade: { item: "silverleaf" },
  grove: { item: "glowcap" },
  mist: { item: "moonwater", opener: "mist_charm" },
  ridge: { item: "starshard", opener: "flying_broom" },
};

export function isPassable(
  terrain: Terrain,
  inventory: Record<string, number> = {},
): boolean {
  const opener = TERRAIN_RULES[terrain].opener;
  return opener === undefined || (inventory[opener] ?? 0) > 0;
}

// Keep the gathering lookup derived from the same terrain rows.
export const TERRAIN_YIELDS = Object.fromEntries(
  Object.entries(TERRAIN_RULES).map(([terrain, rule]) => [terrain, rule.item]),
) as Record<Terrain, string>;

// Value noise: random numbers at coarse grid points, blended between them, so
// that terrain forms regions instead of static.
function noise(seed: number, x: number, y: number, scale: number): number {
  const left = Math.floor(x / scale);
  const top = Math.floor(y / scale);
  const blendX = smooth(x / scale - left);
  const blendY = smooth(y / scale - top);
  return mix(
    mix(gridValue(seed, left, top), gridValue(seed, left + 1, top), blendX),
    mix(
      gridValue(seed, left, top + 1),
      gridValue(seed, left + 1, top + 1),
      blendX,
    ),
    blendY,
  );
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// A hash, not a generator: the same inputs give the same number in [0, 1), with
// no memory of earlier calls.
function gridValue(seed: number, x: number, y: number): number {
  let hash = Math.imul(seed, 0x9e3779b1) ^ Math.imul(x, 0x85ebca6b) ^
    Math.imul(y, 0xc2b2ae35);
  hash = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d);
  hash = Math.imul(hash ^ (hash >>> 12), 0x297a2d39);
  return ((hash ^ (hash >>> 15)) >>> 0) / 2 ** 32;
}
