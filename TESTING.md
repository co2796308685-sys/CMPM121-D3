# Manual test script

For a person, or an agent driving a browser. Run `deno task dev` and open the local URL with `?seed=121`. Before each section, reload. To read logical state, use `game.state` in the console. To read what has played, use the panel beside the grid, including the `#live` text, or look at the marker.

**Promotion rule:** a bug found by hand or by an agent becomes a permanent test in `core/` before it is fixed, unless it truly lives in `game/`, in which case add a step here.

| #  | Action                                                                                        | Expected observation                                                                                                                                     |
| -- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Load the page                                                                                 | One canvas. A pale marker at the center of a green map. No console errors.                                                                               |
| 2  | Tap the right arrow                                                                           | The marker slides one cell east. `#live` says `moved to 1, 0`. `player` is `{ x: 1, y: 0 }`.                                                             |
| 3  | Before crafting tools, walk toward mist or ridge terrain                                      | The marker bumps and returns. The HUD names the required Mist Charm or Flying Broom. `player` has not changed.                                           |
| 4  | Tap an arrow during a walk                                                                    | The tap waits. The marker finishes the walk, then takes that step. It never skips a cell.                                                                |
| 5  | Mash arrows quickly, then stop                                                                | The marker settles on the cell `player` reports.                                                                                                         |
| 6  | Hold an arrow down                                                                            | The marker keeps walking. Holding into a wall repeats the bump.                                                                                          |
| 7  | Load `?seed=7`                                                                                | A different map.                                                                                                                                         |
| 8  | Run `game.state` in the console                                                               | Plain data: `seed`, `player`, `inventory`, `harvestedCells`, and `won`. No terrain list or browser objects.                                              |
| 9  | Press an arrow several times                                                                  | Position and Terrain in the panel change as each step plays, and never ahead of the marker.                                                              |
| 10 | Make the window short, then press the down arrow                                              | The page does not scroll. The marker moves.                                                                                                              |
| 11 | Click the sound button, then press an arrow                                                   | The button reads `Sound: off`, and the arrow still moves the marker.                                                                                     |
| 12 | Click the sound button again                                                                  | The button reads `Sound: on`, and you hear a two-note chime.                                                                                             |
| 13 | Tab to the sound button and press Space                                                       | It toggles. Arrow keys still move the marker.                                                                                                            |
| 14 | Listen while walking and bumping (headphones or speakers)                                     | A soft tick on each step, and a low buzz on each bump. **This is the only check that a person can hear them.**                                           |
| 15 | On a high-resolution display, or at browser zoom 200%                                         | Grid edges stay sharp. The marker stays centered. Run `document.querySelector("canvas").width`: it is the canvas `clientWidth` times `devicePixelRatio`. |
| 16 | Gather with Z, then press Z again on that cell                                                | The satchel gains one material. The cell darkens. The second attempt reports that it was harvested and adds nothing.                                     |
| 17 | Tab to Craft Mist Charm and press Enter before collecting enough                              | The HUD lists the missing materials. Inventory is unchanged, and the same button keeps keyboard focus.                                                   |
| 18 | Collect the ingredients shown for Mist Charm, then craft it                                   | Inputs are spent, the charm appears in the satchel, and the recipe shortages update after playback. Mouse clicks return focus to the game.               |
| 19 | Request a craft while a movement animation is playing                                         | The craft waits for the walk to finish. Recipe buttons keep their identity and focus when their status updates.                                          |
| 20 | Enter mist after making the charm and gather; later make the broom and enter a ridge          | Mist yields moonwater and ridge yields starshard. The charm and broom stay in the satchel.                                                               |
| 21 | Make Moon Thread, Flying Broom, another Moon Thread, then Star Seal using the displayed costs | The final craft shows the trial-complete banner. The goal is visible before winning; the banner was hidden before winning.                               |
| 22 | After winning, try arrows, Z, and every recipe button                                         | No movement, inventory change, or new gameplay events. Reload starts a new trial.                                                                        |

For the recipe timing check, temporarily increase `WALK_MS` in
`game/grid/grid_view.ts` to 3000. Queue a craft during the walk and watch the
recipe statuses. They must wait until playback is settled. Restore the original
duration after checking.

## Full keyboard walkthrough

Open the deployed game with seed 121 or use the same seed locally. Start at
(0, 0) with an empty satchel. N, S, E, and W mean the up, down, right, and left
arrow keys. Tap each key once and let the marker finish each move. Z gathers
from the current cell. At the end of each row, use Tab to focus the named recipe,
then Enter to craft it.

| Keys                     | Craft        | Position after gathering | Expected result                        |
| ------------------------ | ------------ | ------------------------ | -------------------------------------- |
| NNNZ EZ SZ EZ            | Mist Charm   | (2, -2)                  | The charm lets you enter mist.         |
| EEEEEEZ EZ WWZ           | Moon Thread  | (7, -2)                  | Moonwater becomes the first thread.    |
| NNZ WZ                   | Flying Broom | (6, -4)                  | The broom spends the first thread.     |
| EEEZ EZ NZ               | Moon Thread  | (10, -5)                 | The recipe makes a second thread.      |
| WWWWWNNNNZ WWZ NNNNNNNNZ | Star Seal    | (3, -17)                 | The trial ends and the banner appears. |

To show a barrier before and after crafting, pause at the first row's position
before making the Mist Charm. Tap East six times. The sixth tap is blocked by
mist at (8, -2), and you stay at (7, -2). Craft the charm there, tap East again,
and confirm you enter (8, -2). Walk West six times to (2, -2), then resume at
the second row. After the ending, try an arrow key, Z, and Enter on a recipe
button. The marker, satchel, and ending should stay the same.

The route without the optional barrier detour uses 62 commands. The automated
version in `core/complete_trial_test.ts` starts two fresh games and compares the
complete event streams and final states, including both Moon Thread crafts.

## Rehearse the live demo checks

- **Broken recipe.** In `core/recipes.ts`, temporarily replace `silverleaf: 2`
  with `lost_herb: 2` in the Mist Charm recipe. Run
  `deno test core/recipe_content_test.ts --filter "every recipe input has"`.
  Expect `mist_charm has no source for lost_herb`. Restore the recipe.
- **Broken boundary.** Temporarily add
  `import type _Phaser from "npm:phaser@4.2.1";` to `core/rules.ts`. Run
  `deno task boundary` and show the file and import that it rejects. Remove
  the import.
- **Promoted bug.** The reachability check used to make the Star Seal available
  as a crafting ingredient even though crafting it ends the trial and the core
  ignores later commands. A test recipe called Seal Ribbon exposed the mismatch.
  Temporarily remove `if (recipe.wins) continue;` from `core/can_reach.ts`. Run
  `deno test core/recipe_content_test.ts --filter "requires the capstone"`.
  Expect the test to fail because Seal Ribbon is missing from the unreachable
  list. Restore the line and rerun the same command to show the test passing.

There are three command types in `core/rules.ts` (`move`, `gather`, and
`craft`). Craft takes a recipe ID, so all four recipes use the same command.
For the event walkthrough, follow `gathered` from `apply` through
`game/controller.ts` to `game/presenter.ts`. The grid draws the harvested cell
and starts the marker animation, and `game/hud.ts` renders the copied inventory.
