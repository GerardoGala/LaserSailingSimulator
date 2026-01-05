// js/sea.js — SVG World-Based Sea Engine
console.log("sea.js — SVG world mode active (600x500)");

const sea = {
  // --- Wind state ---
  baseWindSpeed: 10,
  currentWindSpeed: 10,
  trueWindDir: 0,

  // --- Ripple animation ---
  ripplePhase: 0,
  ripples: [],
  rippleGroup: null,

  // --- World constants (SVG units) ---
  WORLD_WIDTH: 600,
  WORLD_HEIGHT: 500,
  RIPPLE_STEP_Y: 20,
  RIPPLE_RANGE: 120,

  svg: null,

  init() {
    this.svg = document.getElementById("world");
    if (!this.svg) {
      console.error("Sea init failed: #world SVG not found");
      return;
    }

    // --- Locate or create sea background group ---
    let seaBg = this.svg.querySelector("#sea-background");
    if (!seaBg) {
      seaBg = document.createElementNS("http://www.w3.org/2000/svg", "g");
      seaBg.setAttribute("id", "sea-background");
      this.svg.prepend(seaBg);
    }

    // --- Ripple group (always behind everything) ---
    this.rippleGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.rippleGroup.setAttribute("id", "rippleGroup");
    seaBg.appendChild(this.rippleGroup);

    this.initRipples();

    // --- Initialize wind ---
    this.baseWindSpeed = this.random(8, 28);
    this.currentWindSpeed = this.baseWindSpeed;
    this.updateWindUI();
    setInterval(() => this.calculateNaturalDynamics(), 10000);

    requestAnimationFrame(() => this.draw());
  },

  // --------------------------------------------------
  // Wind dynamics
  // --------------------------------------------------
  calculateNaturalDynamics() {
    this.trueWindDir = this.random(-20, 20);
    this.currentWindSpeed = Math.max(
      5,
      this.baseWindSpeed + this.random(-2, 2)
    );
    this.updateWindUI();
  },

  updateWindUI() {
    const el = document.querySelector("[data-windCondition]");
    if (!el) return;

    const dir = this.trueWindDir >= 0
      ? `+${this.trueWindDir}`
      : this.trueWindDir;

    el.textContent = `${this.currentWindSpeed} knots at ${dir}°`;
  },

  // --------------------------------------------------
  // Ripple creation
  // --------------------------------------------------
  initRipples() {
    const ns = "http://www.w3.org/2000/svg";
    this.ripples.length = 0;
    this.rippleGroup.innerHTML = "";

    for (
      let y = -this.RIPPLE_RANGE;
      y <= this.WORLD_HEIGHT + this.RIPPLE_RANGE;
      y += this.RIPPLE_STEP_Y
    ) {
      const line = document.createElementNS(ns, "polyline");
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", "rgba(255,255,255,0.2)");
      line.setAttribute("stroke-width", "1.2");

      this.rippleGroup.appendChild(line);
      this.ripples.push({ baseY: y, el: line });
    }
  },

  // --------------------------------------------------
  // Ripple animation
  // --------------------------------------------------
  drawRipples() {
    const speedFactor = this.currentWindSpeed / 10;
    this.ripplePhase += 0.015 * speedFactor;

    const waveHeight = 2 + this.currentWindSpeed * 0.35;
    const minX = -this.RIPPLE_RANGE;
    const maxX = this.WORLD_WIDTH + this.RIPPLE_RANGE;

    this.ripples.forEach(({ baseY, el }) => {
      let points = "";

      for (let x = minX; x <= maxX; x += 16) {
        const wave =
          Math.sin(x * 0.02 + baseY * 0.01 + this.ripplePhase) *
          waveHeight;

        points += `${x},${baseY + wave} `;
      }

      el.setAttribute("points", points);
    });
  },

  // --------------------------------------------------
  // Main draw loop
  // --------------------------------------------------
  draw() {
    this.drawRipples();
    requestAnimationFrame(() => this.draw());
  },

  // --------------------------------------------------
  // Utilities
  // --------------------------------------------------
  random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};

export { sea };
