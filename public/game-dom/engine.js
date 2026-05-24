let lastTime = 0;
const TICK_MS = 1000 / 30; // ~33.3 ms → 30 ticks por segundo
let accum = 0;

let playerPoints = 0;

export function addPoints(points) {
    playerPoints += points;
}

export function getPlayerPoints() {
    return playerPoints;
}

export function resetPoints() {
    playerPoints = 0;
}

export function startLoop(update, render) {
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

// --- Input ---
let lastKey = null;

document.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        lastKey = e.key;
        e.preventDefault();
    }
});

export function getInputDir() {
    switch (lastKey) {
        case "ArrowUp": return { x: 0, y: -1 };
        case "ArrowDown": return { x: 0, y: 1 };
        case "ArrowLeft": return { x: -1, y: 0 };
        case "ArrowRight": return { x: 1, y: 0 };
        default: return null;
    }
}
