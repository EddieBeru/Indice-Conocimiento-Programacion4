import { Game } from "./game.js";
import { startLoop } from "./engine.js";

export let ACTUAL_TICK = 0;
export const TILE = 16;

export const COLS = 27;
export const ROWS = 31;

export function addTick() {
    ACTUAL_TICK++;
}

const game = new Game();
startLoop(
    () => game.update(), 
    () => game.render()
);
