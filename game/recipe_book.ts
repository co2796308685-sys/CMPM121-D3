import { type GameState, missingMaterials, type Recipe } from "../core/mod.ts";

// Buttons stay in place so updating the list does not lose keyboard focus.
export class RecipeBook {
  private readonly rows: { recipe: Recipe; status: HTMLElement }[] = [];

  constructor(
    host: HTMLElement,
    recipes: Recipe[],
    state: GameState,
    onCraft: (recipe: string) => void,
  ) {
    for (const recipe of recipes) {
      const row = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `Craft ${recipe.name}`;
      button.addEventListener("click", (event) => {
        onCraft(recipe.id);
        if (event.detail > 0) button.blur();
      });

      const ingredients = document.createElement("p");
      ingredients.textContent = Object.entries(recipe.inputs)
        .map(([item, count]) => `${item.replaceAll("_", " ")} × ${count}`)
        .join(" + ");
      const status = document.createElement("p");
      status.className = "recipe-status";
      row.append(button, ingredients, status);
      host.append(row);
      this.rows.push({ recipe, status });
    }
    this.update(state);
  }

  update(state: GameState) {
    for (const { recipe, status } of this.rows) {
      const missing = Object.entries(missingMaterials(recipe, state.inventory));
      status.textContent = state.won
        ? "The trial is complete."
        : missing.length === 0
        ? "Ready to craft"
        : `Need: ${
          missing.map(([item, count]) =>
            `${item.replaceAll("_", " ")} × ${count}`
          ).join(", ")
        }`;
    }
  }
}
