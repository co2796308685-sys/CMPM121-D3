import { assert, assertEquals } from "@std/assert";
import { unreachableRecipes } from "./can_reach.ts";
import { missingMaterials, type Recipe, RECIPES } from "./recipes.ts";
import { TERRAIN_RULES } from "./terrain.ts";

Deno.test("missing materials reports only shortages without changing inventory", () => {
  const recipe = RECIPES[0];
  const inventory = { silverleaf: recipe.inputs.silverleaf - 1, extra: 3 };
  const before = { ...inventory };

  assertEquals(missingMaterials(recipe, inventory), {
    silverleaf: 1,
    glowcap: recipe.inputs.glowcap,
  });
  assertEquals(inventory, before);
  assertEquals(missingMaterials(recipe, recipe.inputs), {});
});

Deno.test("every recipe input has a terrain or recipe source", () => {
  const sources = new Set(Object.values(TERRAIN_RULES).map((row) => row.item));
  for (const recipe of RECIPES) sources.add(recipe.output);

  for (const recipe of RECIPES) {
    for (const item of Object.keys(recipe.inputs)) {
      assert(sources.has(item), `${recipe.id} has no source for ${item}`);
    }
  }
});

Deno.test("recipes never spend a reusable terrain opener", () => {
  for (const terrain of Object.values(TERRAIN_RULES)) {
    if (!terrain.opener) continue;
    for (const recipe of RECIPES) {
      assertEquals(recipe.inputs[terrain.opener], undefined);
    }
  }
});

Deno.test("all real recipes including the capstone are reachable", () => {
  assertEquals(unreachableRecipes(RECIPES), []);
  const ending = RECIPES.filter((recipe) => recipe.wins);
  assertEquals(ending.length, 1);
  assertEquals(ending[0].output, "star_seal");
});

Deno.test("reachability includes materials behind a newly made opener", () => {
  const recipes: Recipe[] = [
    {
      id: "use_moonwater",
      name: "Moonwater test",
      inputs: { moonwater: 100 },
      output: "test_result",
      amount: 1,
    },
    {
      id: "open_mist",
      name: "Open mist",
      inputs: { silverleaf: 1 },
      output: "mist_charm",
      amount: 1,
    },
  ];
  assertEquals(unreachableRecipes(recipes), []);
});

Deno.test("a gatherable output does not make its recipe reachable", () => {
  const recipes: Recipe[] = [{
    id: "broken",
    name: "Broken",
    inputs: { lost_item: 1 },
    output: "silverleaf",
    amount: 1,
  }];
  assertEquals(unreachableRecipes(recipes), ["broken"]);
});

Deno.test("a recipe that needs its own output stays unreachable", () => {
  const recipes: Recipe[] = [{
    id: "broken",
    name: "Broken",
    inputs: { silverleaf: 1, lost_item: 1 },
    output: "lost_item",
    amount: 1,
  }];
  assertEquals(unreachableRecipes(recipes), ["broken"]);
});

Deno.test("recipes with a circular dependency stay unreachable", () => {
  const recipes: Recipe[] = [
    {
      id: "first",
      name: "First",
      inputs: { second_item: 1 },
      output: "first_item",
      amount: 1,
    },
    {
      id: "second",
      name: "Second",
      inputs: { first_item: 1 },
      output: "second_item",
      amount: 1,
    },
  ];
  assertEquals(unreachableRecipes(recipes), ["first", "second"]);
});

Deno.test("a recipe that requires the capstone cannot be crafted before the trial ends", () => {
  const afterTrial: Recipe = {
    id: "seal_ribbon",
    name: "Seal Ribbon",
    inputs: { star_seal: 1 },
    output: "seal_ribbon",
    amount: 1,
  };

  assertEquals(unreachableRecipes([...RECIPES, afterTrial]), ["seal_ribbon"]);
});
