// js/environment.js — Ocean ripple background (visual only)
console.log("environment.js — Ocean ripple system active");

const environment = {
  ripplePhase: 0,
  svg: null,
  ripples: [],
  width: 0,
  height: 0,

  init(svg) {
    this.svg = svg;

    // Create ripple elements
    this.initRipples();

    // Robust initial sizing fix (especially important on mobile/with CSS scale)
    const tryInitialResize = () => {
      const container = document.getElementById('gameScreen');
      if (container && container.clientWidth > 0 && container.clientHeight > 0) {
        this.resize();
        this.draw();
      } else {
        requestAnimationFrame(tryInitialResize);
      }
    };
    requestAnimationFrame(tryInitialResize);

    // Normal resize handling
    window.addEventListener("resize", () => this.resize());
  },

  initRipples() {
    const ns = "http://www.w3.org/2000/svg";
    const stepY = 25;
    this.ripples = [];

    for (let y = 0; y < 2000; y += stepY) {
      const line = document.createElementNS(ns, "polyline");
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", "rgba(255,255,255,0.2)");
      line.setAttribute("stroke-width", "1.5");
      this.svg.appendChild(line);
      this.ripples.push({ y, line });
    }
  },

  drawRipples(currentWindSpeed = 10) {
    // Use wind speed from the wind module if available, otherwise default
    const windSpeed = currentWindSpeed || 10;
    const animationSpeed = 0.015 * (windSpeed / 8);
    this.ripplePhase += animationSpeed;

    this.ripples.forEach(({ y, line }) => {
      if (y > this.height) {
        line.setAttribute("points", "");
        return;
      }

      let points = "";
      const waveHeight = 2 + (windSpeed * 0.4);

      for (let x = 0; x <= this.width; x += 20) {
        const wave = Math.sin(x * 0.02 + y * 0.01 + this.ripplePhase) * waveHeight;
        points += `${x},${y + wave} `;
      }
      line.setAttribute("points", points);
    });
  },

  resize() {
    if (!this.svg) return;
    const container = document.getElementById('gameScreen');
    if (!container) return;

    this.width = container.clientWidth;
    this.height = container.clientHeight;

    this.svg.setAttribute("width", this.width);
    this.svg.setAttribute("height", this.height);
    this.svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
  },

  draw(currentWindSpeed) {
    this.drawRipples(currentWindSpeed);
  }
};

export { environment };