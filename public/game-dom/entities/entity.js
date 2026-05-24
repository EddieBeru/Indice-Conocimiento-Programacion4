export default class Entity {
    constructor(x, y, className, dir = { x: 0, y: 0 }) {
        // Ubicacion lógica
        this.x = x;
        this.y = y;
        this.dir = dir;

        // Ubicacion del render
        this.rx = x;
        this.ry = y;

        this.isDying = false;
        this.randomInt = Math.floor(Math.random() * 1000);

        // todo para el deslizamiento
        this.isSliding = false;
        this.slideStart = 0;
        this.slideDuration = 500;
        this.slideFromX = x;
        this.slideFromY = y;
        this.slideToX = x;
        this.slideToY = y;

        // Crear elemento DOM
        this.element = document.createElement("div");
        this.element.className = `entity ${className}`;
        
        // Crear sprite interno para permitir rotación/escalado/animaciones sin romper el translate del contenedor
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
}
