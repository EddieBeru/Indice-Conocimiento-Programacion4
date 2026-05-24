import Entity from "./entity.js";
import { ACTUAL_TICK } from "../main.js";

export default class Coin extends Entity {
    constructor(x, y, grande = false) {
        super(x, y, grande ? "coin-big" : "coin");
        this.grande = grande;
    }

    render() {
        const currentFrame = Math.floor(ACTUAL_TICK / 2) % 8;
        if (this.sprite) {
            this.sprite.style.backgroundPosition = `-${currentFrame * 16}px 0px`;
        }
    }
}
