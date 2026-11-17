import {
  type GameEvent,
  type GameState,
  TERRAIN_RULES,
  terrainAt,
} from "../core/mod.ts";

function element(id: string): HTMLElement {
  return document.getElementById(id)!;
}

function describe(event: GameEvent): string {
  switch (event.type) {
    case "moved":
      return `moved to ${event.to.x}, ${event.to.y}`;

    case "blocked": {
      const opener = TERRAIN_RULES[event.terrain].opener;
      return `blocked by ${event.terrain} at ${event.toward.x}, ${event.toward.y}` +
        (opener ? `; craft ${opener.replaceAll("_", " ")} to enter.` : "");
    }

    case "gathered":
      return `gathered ${event.item}! Total: ${event.inventory[event.item]}`;

    case "gather_failed":
      return "This cell has already been harvested.";

    case "crafted":
      return `Crafted ${event.item.replaceAll("_", " ")} × ${event.amount}.`;

    case "craft_failed":
      return event.reason === "unknown_recipe"
        ? "That recipe is not in the spellbook."
        : `Cannot craft yet. Need: ${
          Object.entries(event.missing).map(
            ([item, count]) => `${item.replaceAll("_", " ")} × ${count}`,
          ).join(", ")
        }.`;

    case "ended":
      return "The Star Seal is complete. You passed the witch's trial!";
  }
}

// The readout, as ordinary page elements that CSS can style and that assistive
// tools can read. It changes only as events play.
export class Hud {
  private readonly seed: number;
  private readonly harvestedCells = new Set<string>();

  constructor(state: GameState) {
    this.seed = state.seed;
    this.showPosition(state.player.x, state.player.y);
    this.showInventory(state.inventory);
  }

  show(event: GameEvent) {
    element("live").textContent = describe(event);

    if (event.type === "gathered") {
      const key = `${event.at.x},${event.at.y}`;
      this.harvestedCells.add(key);

      this.showPosition(event.at.x, event.at.y);
      this.showInventory(event.inventory);
    }

    if (event.type === "moved") {
      this.showPosition(event.to.x, event.to.y);
    }

    if (event.type === "crafted") this.showInventory(event.inventory);
    if (event.type === "ended") element("ending").hidden = false;
  }

  private showPosition(x: number, y: number) {
    element("position").textContent = `${x}, ${y}`;

    const terrain = terrainAt(this.seed, x, y);
    const harvested = this.harvestedCells.has(`${x},${y}`);

    element("terrain").textContent = harvested
      ? `${terrain} (harvested)`
      : terrain;
  }

  private showInventory(inventory: Record<string, number>) {
    const list = element("inventory");
    list.replaceChildren();

    for (const [item, count] of Object.entries(inventory)) {
      const li = document.createElement("li");
      li.textContent = `${item}: ${count}`;
      list.appendChild(li);
    }
  }
}
