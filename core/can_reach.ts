import type { Recipe } from "./recipes.ts";
import { TERRAIN_RULES } from "./terrain.ts";

// This checks possible item kinds, not the quantities or a route through a seed.
export function unreachableRecipes(recipes: Recipe[]): string[] {
  const reached = new Set<string>();
  const made = new Set<string>();
  const terrains = Object.values(TERRAIN_RULES);

  for (const terrain of terrains) {
    if (!terrain.opener) reached.add(terrain.item);
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const recipe of recipes) {
      if (made.has(recipe.id)) continue;
      const ready = Object.keys(recipe.inputs).every((item) =>
        reached.has(item)
      );
      if (!ready) continue;

      made.add(recipe.id);
      reached.add(recipe.output);
      changed = true;
      for (const terrain of terrains) {
        if (!terrain.opener || reached.has(terrain.opener)) {
          reached.add(terrain.item);
        }
      }
    }
  }

  return recipes.filter((recipe) => !made.has(recipe.id)).map((recipe) =>
    recipe.id
  );
}
