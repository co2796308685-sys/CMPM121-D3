export type Recipe = {
  id: string;
  name: string;
  inputs: Record<string, number>;
  output: string;
  amount: number;
  wins?: boolean;
};

export const RECIPES: Recipe[] = [
  {
    id: "mist_charm",
    name: "Mist Charm",
    inputs: { silverleaf: 2, glowcap: 2 },
    output: "mist_charm",
    amount: 1,
  },
  {
    id: "moon_thread",
    name: "Moon Thread",
    inputs: { moonwater: 2, glowcap: 1 },
    output: "moon_thread",
    amount: 1,
  },
  {
    id: "flying_broom",
    name: "Flying Broom",
    inputs: { moon_thread: 1, silverleaf: 2 },
    output: "flying_broom",
    amount: 1,
  },
  {
    id: "star_seal",
    name: "Star Seal",
    inputs: { starshard: 2, moonwater: 1, moon_thread: 1 },
    output: "star_seal",
    amount: 1,
    wins: true,
  },
];

// Both the rule and the recipe buttons use these same shortages.
export function missingMaterials(
  recipe: Recipe,
  inventory: Record<string, number>,
): Record<string, number> {
  const missing: Record<string, number> = {};
  for (const [item, amount] of Object.entries(recipe.inputs)) {
    const shortage = amount - (inventory[item] ?? 0);
    if (shortage > 0) missing[item] = shortage;
  }
  return missing;
}
