"use strict";
(() => {
  // public/game-dom/entities/entity.js
  var Entity = class {
    constructor(x, y, className, dir = { x: 0, y: 0 }) {
      this.x = x;
      this.y = y;
      this.dir = dir;
      this.rx = x;
      this.ry = y;
      this.isDying = false;
      this.randomInt = Math.floor(Math.random() * 1e3);
      this.isSliding = false;
      this.slideStart = 0;
      this.slideDuration = 500;
      this.slideFromX = x;
      this.slideFromY = y;
      this.slideToX = x;
      this.slideToY = y;
      this.element = document.createElement("div");
      this.element.className = `entity ${className}`;
      this.sprite = document.createElement("div");
      this.sprite.className = "sprite";
      this.element.appendChild(this.sprite);
      this.updateDOMPosition();
    }
    update() {
    }
    render() {
    }
    startSlide(nextX, nextY, duration = 500) {
      if (nextX === 0 && nextY === 13) {
        this.x = 25;
        this.rx = 25;
        this.updateDOMPosition();
        return;
      } else if (nextX === 26 && nextY === 13) {
        this.x = 0;
        this.rx = 0;
        this.updateDOMPosition();
        return;
      }
      this.isSliding = true;
      this.slideStart = performance.now();
      this.slideDuration = duration;
      this.slideFromX = this.rx;
      this.slideFromY = this.ry;
      this.slideToX = nextX;
      this.slideToY = nextY;
    }
    updateSlide(now = performance.now()) {
      if (!this.isSliding) {
        return;
      }
      const progress = Math.min(1, (now - this.slideStart) / this.slideDuration);
      this.rx = this.slideFromX + (this.slideToX - this.slideFromX) * progress;
      this.ry = this.slideFromY + (this.slideToY - this.slideFromY) * progress;
      if (progress === 1) {
        this.x = this.slideToX;
        this.y = this.slideToY;
        this.rx = this.x;
        this.ry = this.y;
        this.isSliding = false;
      }
      this.updateDOMPosition();
    }
    updateDOMPosition() {
      if (this.element) {
        this.element.style.transform = `translate3d(${this.rx * 16}px, ${this.ry * 16}px, 0)`;
      }
    }
  };

  // public/game-dom/engine.js
  var lastTime = 0;
  var TICK_MS = 1e3 / 30;
  var accum = 0;
  var playerPoints = 0;
  function addPoints(points) {
    playerPoints += points;
  }
  function getPlayerPoints() {
    return playerPoints;
  }
  function resetPoints() {
    playerPoints = 0;
  }
  function startLoop(update, render) {
    function frame(ts) {
      const dt = ts - lastTime;
      lastTime = ts;
      accum += dt;
      while (accum >= TICK_MS) {
        update();
        accum -= TICK_MS;
      }
      render();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var lastKey = null;
  document.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      lastKey = e.key;
      e.preventDefault();
    }
  });
  function getInputDir() {
    switch (lastKey) {
      case "ArrowUp":
        return { x: 0, y: -1 };
      case "ArrowDown":
        return { x: 0, y: 1 };
      case "ArrowLeft":
        return { x: -1, y: 0 };
      case "ArrowRight":
        return { x: 1, y: 0 };
      default:
        return null;
    }
  }

  // public/game-dom/entities/pacman.js
  var DEATH_DURATION = 45;
  var Pacman = class extends Entity {
    constructor(x, y) {
      super(x, y, "pacman");
      this.lastInputDir = { x: 0, y: 0 };
      this.deathTick = 0;
      this.isDead = false;
      this.powerupTimer = 0;
    }
    update(map, fantasmas = []) {
      if (this.isDying || this.isDead) return;
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
      const duration = this.powerupTimer > 0 ? 300 : 500;
      if (map.isWalkable(this.x + this.lastInputDir.x, this.y + this.lastInputDir.y)) {
        this.dir = this.lastInputDir;
        this.startSlide(this.x + this.lastInputDir.x, this.y + this.lastInputDir.y, duration);
      }
      const coin = map.getCoin(this.x, this.y);
      if (coin !== void 0) {
        if (coin.grande === true) {
          addPoints(50);
          this.powerupTimer = 360;
          fantasmas.forEach((f) => f.asustar());
        } else {
          addPoints(10);
        }
        map.removeCoin(this.x, this.y);
      }
    }
    render() {
      if (this.isDying || this.isDead) return;
      this.updateSlide();
      const currentFrame = Math.floor(ACTUAL_TICK / 2) % 8;
      if (this.sprite) {
        this.sprite.style.backgroundPosition = `-${currentFrame * 16}px 0px`;
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
      if (this.isDying) return;
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
          this.element.style.display = "none";
        }
        return false;
      }
      return true;
    }
  };

  // public/game-dom/entities/fantasma.js
  var Fantasma = class extends Entity {
    constructor(x, y, color) {
      super(x, y, `ghost ghost-${color}`);
      this.color = color;
      this.state = "normal";
      this.scaredTimer = 0;
    }
    asustar() {
      if (this.state === "dead") return;
      this.state = "scared";
      this.scaredTimer = 360;
    }
    manejarColision(pacman) {
      if (this.state === "scared") {
        this.state = "dead";
        addPoints(200);
        console.log("Pacman se comi\xF3 al fantasma asustado en DOM: " + this.color);
      } else if (this.state === "normal") {
        pacman.morir();
      }
    }
    regresarAlSpawn(map, directions) {
      const spawnCol = 13;
      const spawnRow = 13;
      if (this.x === spawnCol && this.y === spawnRow) {
        this.state = "normal";
        this.dir = { x: 0, y: -1 };
        this.startSlide(this.x, this.y - 1, 500);
        return;
      }
      const path = map.getPath(this.x, this.y, spawnCol, spawnRow);
      if (path && path.length > 0) {
        const nextDir = path[0];
        const nextPosition = map.getNextPosition(this.x, this.y, nextDir);
        if (map.isWalkable(nextPosition.col, nextPosition.row)) {
          this.dir = nextDir;
          this.startSlide(nextPosition.col, nextPosition.row, 200);
          return;
        }
      }
      this.moverAzar(directions);
    }
    moverAsustado(directions) {
      if (directions.length === 0) return;
      const validDirections = directions.filter((direction) => {
        const isReverse = direction.x === -this.dir.x && direction.y === -this.dir.y;
        return !isReverse || directions.length === 1;
      });
      const choices = validDirections.length > 0 ? validDirections : directions;
      const nextDir = choices[Math.floor(Math.random() * choices.length)];
      this.dir = nextDir;
      this.startSlide(this.x + nextDir.x, this.y + nextDir.y, 800);
    }
    update(map, pacman, fantasmas = []) {
      if (pacman.x === -1 && pacman.y === -1) {
        return;
      }
      if (this.state === "scared") {
        this.scaredTimer--;
        if (this.scaredTimer <= 0 || pacman.powerupTimer <= 0) {
          this.state = "normal";
        }
      }
      if (pacman.x === this.x && pacman.y === this.y) {
        this.manejarColision(pacman);
        return;
      }
      this.updateSlide();
      if (this.isSliding) {
        return;
      }
      if (pacman.x === this.x && pacman.y === this.y && (this.state === "scared" || this.state === "normal")) {
        this.manejarColision(pacman);
        return;
      }
      const directions = map.getAvailableDirections(this.x, this.y);
      if (this.state === "dead") {
        this.regresarAlSpawn(map, directions);
        return;
      }
      if (this.state === "scared") {
        this.moverAsustado(directions);
        return;
      }
      switch (this.color) {
        case "red":
          this.persiguePacman(map, directions, pacman);
          break;
        case "blue":
          this.perseguirInky(map, directions, pacman, fantasmas);
          break;
        case "yellow":
          const cycle = ACTUAL_TICK % 600;
          if (cycle < 400) {
            this.perseguirMachibuse(map, directions, pacman);
          } else {
            this.rodearObstaculos(map, directions);
          }
          break;
        case "orange":
          this.moverAzar(directions);
          break;
      }
    }
    render() {
      this.updateSlide();
      if (this.element) {
        if (this.state === "scared") {
          this.element.classList.add("scared");
          this.element.classList.remove("dead");
        } else if (this.state === "dead") {
          this.element.classList.add("dead");
          this.element.classList.remove("scared");
        } else {
          this.element.classList.remove("scared", "dead");
        }
      }
      const currentFrame = Math.floor((ACTUAL_TICK + this.randomInt) / (this.randomInt % 4 + 1)) % 8;
      if (this.sprite) {
        this.sprite.style.backgroundPosition = `-${currentFrame * 16}px 0px`;
      }
    }
    persiguePacman(map, directions, pacman) {
      const path = map.getPath(this.x, this.y, pacman.x, pacman.y);
      if (path && path.length > 0) {
        const nextDir = path[0];
        const nextPosition = map.getNextPosition(this.x, this.y, nextDir);
        if (!map.isWalkable(nextPosition.col, nextPosition.row)) {
          this.moverAzar(directions);
          return;
        }
        this.dir = nextDir;
        this.startSlide(nextPosition.col, nextPosition.row, 500);
      } else {
        this.moverAzar(directions);
      }
    }
    perseguirInky(map, directions, pacman, fantasmas) {
      const blinky = fantasmas.find((f) => f.color === "red");
      if (!blinky) {
        this.moverAzar(directions);
        return;
      }
      const aheadX = pacman.x + pacman.dir.x * 2;
      const aheadY = pacman.y + pacman.dir.y * 2;
      const vecX = aheadX - blinky.x;
      const vecY = aheadY - blinky.y;
      let targetX = aheadX + vecX;
      let targetY = aheadY + vecY;
      targetX = Math.max(0, Math.min(COLS - 1, targetX));
      targetY = Math.max(0, Math.min(ROWS - 1, targetY));
      if (!map.isWalkable(targetX, targetY)) {
        let bestDist = Infinity;
        let bestX = targetX;
        let bestY = targetY;
        for (let r = 1; r <= 5; r++) {
          for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
              const cx = targetX + dx;
              const cy = targetY + dy;
              if (cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS && map.isWalkable(cx, cy)) {
                const dist = Math.abs(dx) + Math.abs(dy);
                if (dist < bestDist) {
                  bestDist = dist;
                  bestX = cx;
                  bestY = cy;
                }
              }
            }
          }
          if (bestDist < Infinity) break;
        }
        targetX = bestX;
        targetY = bestY;
      }
      const path = map.getPath(this.x, this.y, targetX, targetY);
      if (path && path.length > 0) {
        const nextDir = path[0];
        const nextPosition = map.getNextPosition(this.x, this.y, nextDir);
        if (!map.isWalkable(nextPosition.col, nextPosition.row)) {
          this.moverAzar(directions);
          return;
        }
        this.dir = nextDir;
        this.startSlide(nextPosition.col, nextPosition.row, 500);
      } else {
        this.moverAzar(directions);
      }
    }
    perseguirMachibuse(map, directions, pacman) {
      let targetX = pacman.x + pacman.dir.x * 4;
      let targetY = pacman.y + pacman.dir.y * 4;
      targetX = Math.max(0, Math.min(COLS - 1, targetX));
      targetY = Math.max(0, Math.min(ROWS - 1, targetY));
      if (!map.isWalkable(targetX, targetY)) {
        let bestDist = Infinity;
        let bestX = targetX;
        let bestY = targetY;
        for (let r = 1; r <= 5; r++) {
          for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
              const cx = targetX + dx;
              const cy = targetY + dy;
              if (cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS && map.isWalkable(cx, cy)) {
                const dist = Math.abs(dx) + Math.abs(dy);
                if (dist < bestDist) {
                  bestDist = dist;
                  bestX = cx;
                  bestY = cy;
                }
              }
            }
          }
          if (bestDist < Infinity) break;
        }
        targetX = bestX;
        targetY = bestY;
      }
      const path = map.getPath(this.x, this.y, targetX, targetY);
      if (path && path.length > 0) {
        const nextDir = path[0];
        const nextPosition = map.getNextPosition(this.x, this.y, nextDir);
        if (!map.isWalkable(nextPosition.col, nextPosition.row)) {
          this.moverAzar(directions);
          return;
        }
        this.dir = nextDir;
        this.startSlide(nextPosition.col, nextPosition.row, 500);
      } else {
        this.rodearObstaculos(map, directions);
      }
    }
    rodearObstaculos(map, directions) {
      if (directions.length === 0) return;
      if (this.dir.x === 0 && this.dir.y === 0) {
        this.dir = directions[0];
      }
      const dirIzquierda = { x: this.dir.y, y: -this.dir.x };
      const dirRecto = { x: this.dir.x, y: this.dir.y };
      const dirDerecha = { x: -this.dir.y, y: this.dir.x };
      const dirAtras = { x: -this.dir.x, y: -this.dir.y };
      const opciones = [dirIzquierda, dirRecto, dirDerecha, dirAtras];
      for (const op of opciones) {
        const existe = directions.some((d) => d.x === op.x && d.y === op.y);
        if (existe) {
          const nextCol = this.x + op.x;
          const nextRow = this.y + op.y;
          if (map.isWalkable(nextCol, nextRow)) {
            this.dir = op;
            this.startSlide(nextCol, nextRow, 500);
            return;
          }
        }
      }
      this.moverAzar(directions);
    }
    moverAzar(directions) {
      if (directions.length === 0) {
        return;
      }
      const validDirections = directions.filter((direction) => {
        const isReverse = direction.x === -this.dir.x && direction.y === -this.dir.y;
        return !isReverse || directions.length === 1;
      });
      const choices = validDirections.length > 0 ? validDirections : directions;
      const nextDir = choices[Math.floor(Math.random() * choices.length)];
      this.dir = nextDir;
      this.startSlide(this.x + nextDir.x, this.y + nextDir.y, 500);
    }
  };

  // public/game-dom/entities/coin.js
  var Coin = class extends Entity {
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
  };

  // public/game-dom/map.js
  var MAP_DATA = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    // 0
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    // 1
    [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
    // 2
    [1, 3, 1, 0, 0, 1, 2, 1, 0, 0, 0, 1, 2, 1, 2, 1, 0, 0, 0, 1, 2, 1, 0, 0, 1, 3, 1],
    // 3  ← power pellets
    [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
    // 4
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    // 5
    [1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1],
    // 6
    [1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1],
    // 7
    [1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 1],
    // 8
    [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1],
    // 9
    [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
    // 10
    [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
    // 11
    [1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1],
    // 12
    [0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0],
    // 13 ← tunnel
    [1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1],
    // 14
    [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
    // 15
    [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
    // 16
    [1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1],
    // 17
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    // 18
    [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
    // 19
    [1, 3, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 3, 1],
    // 20 ← power pellets
    [1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1],
    // 21
    [1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1],
    // 22
    [1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 1],
    // 23
    [1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
    // 24
    [1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
    // 25
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    // 26
    [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
    // 27
    [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
    // 28
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    // 29
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    // 30
  ];
  var coins = [];
  var Map = class {
    constructor(boardEl) {
      this.boardEl = boardEl;
      this.grid = MAP_DATA.map((row) => [...row]);
      this.inicializarDOM();
    }
    inicializarDOM() {
      coins = [];
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const type = this.grid[row][col];
          if (type === 1) {
            const wallEl = document.createElement("div");
            wallEl.className = "tile-wall";
            wallEl.style.left = `${col * 16}px`;
            wallEl.style.top = `${row * 16}px`;
            const neighbors = this.getTileNeighbors(col, row).split(",");
            neighbors.forEach((neighbor, index) => {
              const subTile = document.createElement("div");
              subTile.className = "sub-tile";
              if (neighbor === "1") {
                subTile.classList.add("blue");
              }
              wallEl.appendChild(subTile);
            });
            this.boardEl.appendChild(wallEl);
          } else if (type === 2) {
            const coin = new Coin(col, row, false);
            coins.push(coin);
            this.boardEl.appendChild(coin.element);
          } else if (type === 3) {
            const coin = new Coin(col, row, true);
            coins.push(coin);
            this.boardEl.appendChild(coin.element);
          }
        }
      }
    }
    getTileNeighbors(col, row) {
      const neighbors = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) {
            neighbors.push(1);
            continue;
          }
          const x = col + dx;
          const y = row + dy;
          if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
            neighbors.push(this.grid[y][x]);
          } else {
            neighbors.push(0);
          }
        }
      }
      return neighbors.join(",");
    }
    isWalkable(col, row) {
      if (col === 0 && row === 13) {
        return true;
      } else if (col === 26 && row === 13) {
        return true;
      }
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
        return false;
      }
      return this.grid[row] && this.grid[row][col].length != 0 && this.grid[row][col] !== 1;
    }
    getAvailableDirections(col, row) {
      const directions = [];
      if (this.isWalkable(col, row - 1)) directions.push({ x: 0, y: -1 });
      if (this.isWalkable(col, row + 1)) directions.push({ x: 0, y: 1 });
      if (this.isWalkable(col - 1, row)) directions.push({ x: -1, y: 0 });
      if (this.isWalkable(col + 1, row)) directions.push({ x: 1, y: 0 });
      if (row === 13) {
        if (col === 0) {
          directions.push({ x: -1, y: 0 });
        }
        if (col === COLS - 1) {
          directions.push({ x: 1, y: 0 });
        }
      }
      return directions;
    }
    getDistance(x1, y1, x2, y2) {
      return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
    getNextPosition(col, row, dir) {
      if (row === 13 && col === 0 && dir.x === -1 && dir.y === 0) {
        return { col: COLS - 1, row: 13 };
      }
      if (row === 13 && col === COLS - 1 && dir.x === 1 && dir.y === 0) {
        return { col: 0, row: 13 };
      }
      return { col: col + dir.x, row: row + dir.y };
    }
    getPath(startCol, startRow, endCol, endRow) {
      const queue = [{ col: startCol, row: startRow, path: [] }];
      const visited = /* @__PURE__ */ new Set();
      visited.add(`${startCol},${startRow}`);
      while (queue.length > 0) {
        const { col, row, path } = queue.shift();
        if (col === endCol && row === endRow) {
          return path;
        }
        this.getAvailableDirections(col, row).forEach((dir) => {
          const { col: nextCol, row: nextRow } = this.getNextPosition(col, row, dir);
          const key = `${nextCol},${nextRow}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push({ col: nextCol, row: nextRow, path: [...path, dir] });
          }
        });
      }
      return null;
    }
    getCoin(x, y) {
      return coins.find((coin) => coin.x === x && coin.y === y);
    }
    removeCoin(x, y) {
      this.grid[y][x] = 0;
      const coinIndex = coins.findIndex((coin) => coin.x === x && coin.y === y);
      if (coinIndex !== -1) {
        const coin = coins[coinIndex];
        if (coin.element) {
          coin.element.remove();
        }
        coins.splice(coinIndex, 1);
      }
    }
  };

  // public/game-dom/game.js
  var scoreEl = document.getElementById("game-score");
  var Game = class {
    constructor() {
      this.boardEl = document.getElementById("game-board");
      this.isStarted = false;
      this.reset();
      const playButton = document.getElementById("play-button");
      if (playButton) {
        playButton.addEventListener("click", () => {
          if (this.pacman.isDead || this.isWon) {
            this.reset();
            this.isStarted = true;
            const overlay = document.getElementById("game-overlay");
            if (overlay) overlay.classList.add("hidden");
            this.boardEl.classList.remove("blurred");
          } else {
            this.isStarted = true;
            const overlay = document.getElementById("game-overlay");
            if (overlay) overlay.classList.add("hidden");
            this.boardEl.classList.remove("blurred");
          }
        });
      }
    }
    reset() {
      this.boardEl.innerHTML = "";
      this.map = new Map(this.boardEl);
      this.pacman = new Pacman(13, 20);
      this.boardEl.appendChild(this.pacman.element);
      this.fantasmas = [
        new Fantasma(12, 13, "red"),
        new Fantasma(13, 13, "blue"),
        new Fantasma(14, 13, "orange"),
        new Fantasma(13, 10, "yellow")
      ];
      this.fantasmas.forEach((f) => this.boardEl.appendChild(f.element));
      resetPoints();
      this.isStarted = false;
      this.isWon = false;
      this.boardEl.classList.add("blurred");
      const overlayTitle = document.getElementById("overlay-title");
      if (overlayTitle) {
        overlayTitle.textContent = "READY?";
        overlayTitle.style.color = "";
        overlayTitle.style.textShadow = "";
      }
    }
    update() {
      if (!this.isStarted) return;
      if (this.isWon) {
        this.mostrarOverlayVictoria();
        return;
      }
      if (this.pacman.isDead) {
        this.mostrarOverlayMuerte();
        return;
      }
      if (this.pacman.isDying) return;
      this.pacman.update(this.map, this.fantasmas);
      if (coins.length === 0) {
        this.isWon = true;
        this.mostrarOverlayVictoria();
        return;
      }
      this.fantasmas.forEach((f) => f.update(this.map, this.pacman, this.fantasmas));
      addTick();
    }
    mostrarOverlayMuerte() {
      const overlay = document.getElementById("game-overlay");
      const overlayTitle = document.getElementById("overlay-title");
      const playButton = document.getElementById("play-button");
      if (overlay && overlay.classList.contains("hidden")) {
        if (overlayTitle) {
          overlayTitle.textContent = "GAME OVER";
          overlayTitle.style.color = "";
          overlayTitle.style.textShadow = "";
        }
        if (playButton) playButton.textContent = "TRY AGAIN";
        overlay.classList.remove("hidden");
        this.boardEl.classList.add("blurred");
      }
    }
    mostrarOverlayVictoria() {
      const overlay = document.getElementById("game-overlay");
      const overlayTitle = document.getElementById("overlay-title");
      const playButton = document.getElementById("play-button");
      if (overlay && overlay.classList.contains("hidden")) {
        if (overlayTitle) {
          overlayTitle.textContent = "YOU WIN!";
          overlayTitle.style.color = "#00ffaa";
          overlayTitle.style.textShadow = "0 0 15px rgba(0, 255, 170, 0.8)";
        }
        if (playButton) playButton.textContent = "PLAY AGAIN";
        overlay.classList.remove("hidden");
        this.boardEl.classList.add("blurred");
      }
    }
    render() {
      if (scoreEl) {
        scoreEl.textContent = getPlayerPoints();
      }
      if (this.isWon) {
        this.mostrarOverlayVictoria();
        return;
      }
      if (this.pacman.isDead) {
        this.mostrarOverlayMuerte();
        return;
      }
      if (this.pacman.isDying) {
        this.pacman.updateDeath();
      } else {
        this.pacman.render();
        this.fantasmas.forEach((f) => f.render());
      }
      coins.forEach((coin) => coin.render());
    }
  };

  // public/game-dom/main.js
  var ACTUAL_TICK = 0;
  var TILE = 16;
  var COLS = 27;
  var ROWS = 31;
  function addTick() {
    ACTUAL_TICK++;
  }
  var game = new Game();
  startLoop(
    () => game.update(),
    () => game.render()
  );
})();
