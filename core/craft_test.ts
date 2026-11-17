import { assert, assertEquals } from "@std/assert";
import {
  apply,
  missingMaterials,
  newGame,
  type Recipe,
  RECIPES,
} from "./mod.ts";

Deno.test("crafting spends the recipe inputs and adds its output", () => {
  const recipe = RECIPES[0];
  const state = newGame(121);
  state.inventory = { ...recipe.inputs, keepsake: 3 };

  const events = apply(state, { type: "craft", recipe: recipe.id });

  for (const item of Object.keys(recipe.inputs)) {
    assertEquals(state.inventory[item], 0);
  }
  assertEquals(state.inventory[recipe.output], recipe.amount);
  assertEquals(state.inventory.keepsake, 3);
  assertEquals(events, [{
    type: "crafted",
    recipe: recipe.id,
    item: recipe.output,
    amount: recipe.amount,
    inventory: { ...state.inventory },
  }]);
});

Deno.test("missing materials report deficits without spending anything", () => {
  const recipe = RECIPES[0];
  const state = newGame(121);
  state.inventory = { ...recipe.inputs };
  const [item, amount] = Object.entries(recipe.inputs)[0];
  state.inventory[item] = amount - 1;
  const before = JSON.parse(JSON.stringify(state));

  const events = apply(state, { type: "craft", recipe: recipe.id });

  assertEquals(missingMaterials(recipe, state.inventory), { [item]: 1 });
  assertEquals(state, before);
  assertEquals(events, [{
    type: "craft_failed",
    recipe: recipe.id,
    reason: "missing_materials",
    missing: { [item]: 1 },
  }]);
});

Deno.test("an unknown recipe changes nothing", () => {
  const state = newGame(121);
  const before = JSON.parse(JSON.stringify(state));

  assertEquals(apply(state, { type: "craft", recipe: "unknown" }), [{
    type: "craft_failed",
    recipe: "unknown",
    reason: "unknown_recipe",
    missing: {},
  }]);
  assertEquals(state, before);
});

Deno.test("a retained craft event keeps its inventory after another craft", () => {
  const recipe = RECIPES[0];
  const state = newGame(121);
  for (const [item, amount] of Object.entries(recipe.inputs)) {
    state.inventory[item] = amount * 2;
  }
  const first = apply(state, { type: "craft", recipe: recipe.id });
  const saved = JSON.parse(JSON.stringify(first));

  apply(state, { type: "craft", recipe: recipe.id });

  assertEquals(first, saved);
  assertEquals(state.inventory[recipe.output], recipe.amount * 2);
});

Deno.test("a new recipe uses the same craft rule", () => {
  const recipe: Recipe = {
    id: "test_pouch",
    name: "Test Pouch",
    inputs: { silverleaf: 3 },
    output: "test_pouch",
    amount: 2,
  };
  RECIPES.push(recipe);
  try {
    const state = newGame(121);
    state.inventory = { ...recipe.inputs };

    const events = apply(state, { type: "craft", recipe: recipe.id });

    assertEquals(state.inventory[recipe.output], recipe.amount);
    assert(events[0].type === "crafted");
  } finally {
    RECIPES.pop();
  }
});
