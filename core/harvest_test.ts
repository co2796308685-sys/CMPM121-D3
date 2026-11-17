import { assertEquals } from "@std/assert";
import { apply, cellAt, newGame, TERRAIN_YIELDS } from "./mod.ts";

const SEED = 121;

Deno.test("gathering adds a material to inventory", () => {
  const state = newGame(SEED);
  const terrain = cellAt(state, 0, 0).terrain;
  const item = TERRAIN_YIELDS[terrain];

  const events = apply(state, { type: "gather" });

  assertEquals(state.inventory[item], 1);
  assertEquals(state.harvestedCells["0,0"], true);
  assertEquals(events, [{
    type: "gathered",
    at: { x: 0, y: 0 },
    terrain,
    item,
    inventory: { [item]: 1 },
  }]);
});

Deno.test("gathering twice does not give more materials", () => {
  const state = newGame(SEED);

  apply(state, { type: "gather" });

  const snapshot = JSON.parse(JSON.stringify(state));
  const terrain = cellAt(state, 0, 0).terrain;

  const events = apply(state, { type: "gather" });

  assertEquals(state, snapshot);
  assertEquals(events, [{
    type: "gather_failed",
    at: { x: 0, y: 0 },
    terrain,
    reason: "already_harvested",
  }]);
});

Deno.test("gathering only stores changed cells", () => {
  const state = newGame(SEED);

  assertEquals(state.harvestedCells, {});

  apply(state, { type: "gather" });

  assertEquals(state.harvestedCells, {
    "0,0": true,
  });
});

Deno.test("gather event keeps its inventory after later commands", () => {
  const state = newGame(SEED);

  const first = apply(state, { type: "gather" });
  const saved = JSON.parse(JSON.stringify(first));

  apply(state, { type: "move", direction: "east" });
  apply(state, { type: "gather" });

  assertEquals(first, saved);
});
