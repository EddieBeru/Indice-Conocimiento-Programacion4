import Entity from "./entity.js";
import { getInputDir, addPoints } from "../engine.js";
import { ACTUAL_TICK } from "../main.js";

const DEATH_DURATION = 45; // ticks que dura la animación de muerte

export class Pacman extends Entity {
    constructor(x, y) {
        super(x, y, "pacman");
        this.lastInputDir = { x: 0, y: 0 };
        this.deathTick = 0;   // tick en que empezó la muerte
        this.isDead = false;   // true cuando la animación terminó
        this.powerupTimer = 0; // Temporizador del pellet grande
    }

    update(map, fantasmas = []) {
        // Si está muriendo o ya murió, no hacer nada
        if (this.isDying || this.isDead) return;

        // Decrementar temporizador del powerup
        if (this.powerupTimer > 0) {
            this.powerupTimer--;
        }

        this.updateSlide();

        if (this.isSliding) {
            return;
        }

        const inputDir = getInputDir();
        if (inputDir) {
            if (inputDir !== this.lastInputDir && map.isWalkable(this.x + inputDir.x, this.y + inputDir.y)) {
                this.lastInputDir = inputDir;
            }
        }

        // Si tiene el powerup activo, la velocidad aumenta (duración de slide de 300ms en vez de 500ms)
        const duration = this.powerupTimer > 0 ? 300 : 500;

        if (map.isWalkable(this.x + this.lastInputDir.x, this.y + this.lastInputDir.y)) {
            this.dir = this.lastInputDir;
            this.startSlide(this.x + this.lastInputDir.x, this.y + this.lastInputDir.y, duration);
        }

        const coin = map.getCoin(this.x, this.y);
        if (coin !== undefined) {
            if (coin.grande === true) {
                addPoints(50); // Pellets grandes otorgan 50 puntos
                this.powerupTimer = 360; // 12 segundos a 30 FPS / 6 segundos a 60 FPS
                // Asustar a todos los fantasmas que no estén muertos
                fantasmas.forEach(f => f.asustar());
            } else {
                addPoints(10);
            }
            map.removeCoin(this.x, this.y);
        }
    }

    render() {
        if (this.isDying || this.isDead) return; // no dibujar normalmente

        this.updateSlide();
        const currentFrame = Math.floor(ACTUAL_TICK / 2) % 8;

        if (this.sprite) {
            this.sprite.style.backgroundPosition = `-${currentFrame * 16}px 0px`;

            // Aplicar rotación y espejo al sprite
            let angle = 0;
            let scaleY = 1;
            if (this.dir.x === 1) {
                angle = 0;
            } else if (this.dir.x === -1) {
                angle = 180;
                scaleY = -1;
            }
            this.sprite.style.transform = `rotate(${angle}deg) scaleY(${scaleY})`;
        }
    }

    morir() {
        if (this.isDying) return; // evitar llamadas múltiples
        this.isDying = true;
        this.isSliding = false;
        this.deathTick = 0;
        if (this.sprite) {
            this.sprite.classList.add("dying");
        }
        console.log("Pacman murio en el DOM");
    }

    /**
     * Actualiza y dibuja la animación de muerte.
     * Retorna true mientras la animación sigue, false cuando terminó.
     */
    updateDeath() {
        if (!this.isDying || this.isDead) return false;

        this.deathTick++;

        const progress = Math.min(1, this.deathTick / DEATH_DURATION);

        if (progress >= 1) {
            this.isDead = true;
            this.isDying = false;
            if (this.element) {
                this.element.style.display = "none"; // ocultar elemento al terminar
            }
            return false;
        }

        return true;
    }
}
