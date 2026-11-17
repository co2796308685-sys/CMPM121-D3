// The rules of the game. There is no clock here: a command updates the state at
// once, and the events it returns are a record of what happened. Whoever called
// apply() decides how, or whether, to show them over time.

import {
  isPassable,
  type Terrain,
  TERRAIN_YIELDS,
  terrainAt,
} from "./terrain.ts";

export type Cell = { x: number; y: number };

export type Direction = "north" | "south" | "east" | "west";

// Plain data that survives JSON. Terrain is absent because the seed can recompute
// it: besides the seed, only what the player has caused belongs here.
export type GameState = {
  seed: number;
  player: Cell;
  inventory: Record<string, number>;
  harvestedCells: Record<string, true>;
};

// Command: https://gameprogrammingpatterns.com/command.html
export type Command =
  | { type: "move"; direction: Direction }
  | { type: "gather" };

// Domain Event: https://martinfowler.com/eaaDev/DomainEvent.html
export type GameEvent =
  | { type: "moved"; from: Cell; to: Cell }
  | { type: "blocked"; at: Cell; toward: Cell; terrain: Terrain }
  | {
    type: "gathered";
    at: Cell;
    terrain: Terrain;
    item: string;
    inventory: Record<string, number>;
  }
  | {
    type: "gather_failed";
    at: Cell;
    terrain: Terrain;
    reason: "already_harvested";
  };

const STEPS: Record<Direction, Cell> = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
};

// Singleton, avoided on purpose: tests make as many games as they need. https://gameprogrammingpatterns.com/singleton.html
export function newGame(seed: number): GameState {
  return {
    seed,
    player: { x: 0, y: 0 },
    inventory: {},
    harvestedCells: {},
  };
}

// Get the current state of a cell.
export function cellAt(state: GameState, x: number, y: number) {
  return {
    terrain: terrainAt(state.seed, x, y),
    harvested: state.harvestedCells[`${x},${y}`] === true,
  };
}

// The single way in. It updates the state it is given and returns the events.
export function apply(state: GameState, command: Command): GameEvent[] {
  switch (command.type) {
    case "move":
      return move(state, command.direction);
    case "gather":
      return gather(state);
  }
}

function move(state: GameState, direction: Direction): GameEvent[] {
  const step = STEPS[direction];
  // Events are retained and played back later, while state keeps changing. So an
  // event gets cells of its own, never an object that state still holds.
  // Aliasing Bug: https://martinfowler.com/bliki/AliasingBug.html
  // Cells in events act as a Value Object: https://martinfowler.com/bliki/ValueObject.html
  const from = { ...state.player };
  const to = { x: from.x + step.x, y: from.y + step.y };
  const terrain = terrainAt(state.seed, to.x, to.y);
  if (!isPassable(terrain)) {
    return [{ type: "blocked", at: from, toward: to, terrain }];
  }
  state.player.x = to.x;
  state.player.y = to.y;
  return [{ type: "moved", from, to }];
}

// Gather materials from the player's current cell.
function gather(state: GameState): GameEvent[] {
  const at = { ...state.player };
  const { terrain, harvested } = cellAt(state, at.x, at.y);

  // A cell can only be gathered once.
  if (harvested) {
    return [{
      type: "gather_failed",
      at,
      terrain,
      reason: "already_harvested",
    }];
  }

  const item = TERRAIN_YIELDS[terrain];
  const key = `${at.x},${at.y}`;

  state.harvestedCells[key] = true;
  state.inventory[item] = (state.inventory[item] ?? 0) + 1;

  return [{
    type: "gathered",
    at,
    terrain,
    item,
    inventory: { ...state.inventory },
  }];
}
