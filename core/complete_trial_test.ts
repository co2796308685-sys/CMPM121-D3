import { assertEquals } from "@std/assert";
import { apply, type Direction, type GameEvent, newGame } from "./mod.ts";

// A fixed keyboard route from spawn. Each Z gathers one cell and each row ends
// with a spellbook command. TESTING.md mirrors this route for browser checks.
const ROUTE = [
  ["NNNZ EZ SZ EZ", "mist_charm"],
  ["EEEEEEZ EZ WWZ", "moon_thread"],
  ["NNZ WZ", "flying_broom"],
  ["EEEZ EZ NZ", "moon_thread"],
  ["WWWWWNNNNZ WWZ NNNNNNNNZ", "star_seal"],
] as const;

const DIRECTIONS: Record<string, Direction> = {
  N: "north",
  S: "south",
  E: "east",
  W: "west",
};

function replayTrial() {
  const state = newGame(121);
  const events: GameEvent[] = [];

  for (const [keys, recipe] of ROUTE) {
    for (const key of keys.replaceAll(" ", "")) {
      const action = key === "Z"
        ? apply(state, { type: "gather" })
        : apply(state, { type: "move", direction: DIRECTIONS[key] });
      assertEquals(
        action.map((event) => event.type),
        [
          key === "Z" ? "gathered" : "moved",
        ],
        `Key ${key} on the way to ${recipe}, at ${state.player.x}, ${state.player.y}`,
      );
      events.push(...action);
    }
    const craft = apply(state, { type: "craft", recipe });
    assertEquals(
      craft.map((event) => event.type),
      recipe === "star_seal" ? ["crafted", "ended"] : ["crafted"],
      `Crafting ${recipe}`,
    );
    events.push(...craft);
  }

  return { state, events };
}

Deno.test("the full trial replays from an empty satchel with identical state and events", () => {
  const first = replayTrial();
  assertEquals(first.state.won, true);
  assertEquals(first.state.player, { x: 3, y: -17 });
  assertEquals(first.state.inventory.star_seal, 1);
  assertEquals(first.state.inventory.moon_thread, 0);
  assertEquals(Object.keys(first.state.harvestedCells).length, 15);
  assertEquals(
    first.events.filter((event) => event.type === "crafted").map((event) =>
      event.inventory.moon_thread ?? 0
    ),
    [0, 1, 0, 1, 0],
  );

  assertEquals(replayTrial(), first);
});
