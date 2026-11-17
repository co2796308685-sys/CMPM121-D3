import { assert, assertEquals } from "@std/assert";
import {
  apply,
  type Command,
  isPassable,
  newGame,
  RECIPES,
  type Terrain,
  TERRAIN_RULES,
  terrainAt,
} from "./mod.ts";

function westOf(terrain: Terrain) {
  for (let y = -100; y <= 100; y++) {
    for (let x = -100; x < 100; x++) {
      if (
        isPassable(terrainAt(121, x, y)) &&
        terrainAt(121, x + 1, y) === terrain
      ) {
        return { x, y };
      }
    }
  }
  throw new Error(`No edge found for ${terrain}`);
}

for (const terrain of ["mist", "ridge"] as const) {
  Deno.test(`${terrain} opens with its crafted tool and yields its material`, () => {
    const rule = TERRAIN_RULES[terrain];
    const recipe = RECIPES.find((recipe) => recipe.output === rule.opener)!;
    const state = newGame(121);
    state.player = westOf(terrain);
    state.inventory = { ...recipe.inputs };
    const before = JSON.parse(JSON.stringify(state));

    const blocked = apply(state, { type: "move", direction: "east" });
    assertEquals(blocked[0].type, "blocked");
    assertEquals(state, before);

    const crafted = apply(state, { type: "craft", recipe: recipe.id });
    assertEquals(crafted[0].type, "crafted");
    assert(isPassable(terrain, state.inventory));
    const moved = apply(state, { type: "move", direction: "east" });
    assertEquals(moved[0].type, "moved");
    const gathered = apply(state, { type: "gather" });
    assertEquals(gathered[0].type, "gathered");
    assertEquals(state.inventory[rule.item], 1);
    assertEquals(state.inventory[rule.opener!], recipe.amount);
  });
}

Deno.test("the capstone ends the trial and every later command is ignored", () => {
  const recipe = RECIPES.find((recipe) => recipe.wins)!;
  const state = newGame(121);
  assertEquals(state.won, false);
  state.inventory = { ...recipe.inputs };

  const events = apply(state, { type: "craft", recipe: recipe.id });

  assertEquals(events.map((event) => event.type), ["crafted", "ended"]);
  assertEquals(state.inventory[recipe.output], recipe.amount);
  assertEquals(state.won, true);
  const finished = JSON.parse(JSON.stringify(state));
  const commands: Command[] = [
    { type: "move", direction: "east" },
    { type: "gather" },
    { type: "craft", recipe: recipe.id },
    { type: "craft", recipe: "unknown" },
  ];
  for (const command of commands) {
    assertEquals(apply(state, command), []);
    assertEquals(state, finished);
  }
});
