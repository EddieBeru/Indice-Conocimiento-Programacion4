import { Pacman } from "./entities/pacman.js";
import { Fantasma } from "./entities/fantasma.js";
import { Map, coins } from "./map.js";
import { clearCanvas, getPlayerPoints, resetPoints } from "./engine.js";
import { addTick } from "./main.js";

const canvas = document.getElementById("game-canvas");
const scoreEl = document.getElementById("game-score");

export class Game {
  constructor() {
    this.map = new Map();
    this.pacman = new Pacman(13, 20);
    this.fantasmas = [
      new Fantasma(12, 13, "red"),
      new Fantasma(13, 13, "blue"),
      new Fantasma(14, 13, "orange"),
      new Fantasma(13, 10, "yellow"),
    ];
    this.isStarted = false;

    // Inicializar el canvas como borroso
    canvas.classList.add("blurred");

    // Conectar botón de jugar/reintentar
    const playButton = document.getElementById("play-button");
    if (playButton) {
      playButton.addEventListener("click", () => {
        if (this.pacman.isDead) {
          // Si estaba muerto, resetear y empezar
          this.reset();
          this.isStarted = true;
          const overlay = document.getElementById("game-overlay");
          if (overlay) overlay.classList.add("hidden");
          canvas.classList.remove("blurred");
        } else {
          // Si es el inicio, solo empezar
          this.isStarted = true;
          const overlay = document.getElementById("game-overlay");
          if (overlay) overlay.classList.add("hidden");
          canvas.classList.remove("blurred");
        }
      });
    }
  }

  reset() {
    this.map = new Map();
    this.pacman = new Pacman(13, 20);
    this.fantasmas = [
      new Fantasma(12, 13, "red"),
      new Fantasma(13, 13, "blue"),
      new Fantasma(14, 13, "orange"),
      new Fantasma(13, 10, "yellow"),
    ];
    resetPoints();
    this.isStarted = false;
    canvas.classList.add("blurred");
  }

  update() {
    if (!this.isStarted) return;

    // Si pacman ya terminó de morir, no actualizar nada
    if (this.pacman.isDead) {
      this.mostrarOverlayMuerte();
      return;
    }

    // Si está en animación de muerte, solo avanzar esa animación
    if (this.pacman.isDying) return;

    this.pacman.update(this.map, this.fantasmas);
    this.fantasmas.forEach(f => f.update(this.map, this.pacman, this.fantasmas));
    addTick();
  }

  mostrarOverlayMuerte() {
    const overlay = document.getElementById("game-overlay");
    const overlayTitle = document.getElementById("overlay-title");
    const playButton = document.getElementById("play-button");
    if (overlay && overlay.classList.contains("hidden")) {
      if (overlayTitle) overlayTitle.textContent = "GAME OVER";
      if (playButton) playButton.textContent = "TRY AGAIN";
      overlay.classList.remove("hidden");
      canvas.classList.add("blurred");
    }
  }

  render() {
    // Actualizar marcador siempre
    scoreEl.textContent = getPlayerPoints();

    // Si pacman ya terminó su animación, congelar todo y mostrar overlay
    if (this.pacman.isDead) {
      this.mostrarOverlayMuerte();
      return;
    }

    clearCanvas(canvas);

    // Siempre dibujar el mapa y las monedas
    this.map.dibujar();
    coins.forEach(coin => coin.render());

    if (this.pacman.isDying) {
      // Durante la muerte: solo animación de pacman, fantasmas estáticos
      this.pacman.updateDeath();
    } else {
      // Juego normal (o estado inicial pausado)
      this.pacman.render();
      this.fantasmas.forEach(f => f.render());
    }
  }
}