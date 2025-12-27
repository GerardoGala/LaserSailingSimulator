// js/environment.js — Brazil Venue: Wide Range Dynamics
console.log("environment.js — Fortaleza: 8-28 Knot Range Active");

const environment = {
  baseWindSpeed: 10,     
  currentWindSpeed: 10,  
  trueWindDir: 0,        
  ripplePhase: 0,
  range: 230,
  svg: null,
  ripples: [],
  width: 0,
  height: 0,

  init(svg) {
    this.svg = svg;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.initRipples();
    
    // 1. Fortaleza Range: 8 to 28 knots
    this.baseWindSpeed = Math.floor(Math.random() * (28 - 8 + 1)) + 8;
    this.currentWindSpeed = this.baseWindSpeed;

    this.updateWindUI();

    // 2. Natural Oscillation Cycle (10 seconds)
    // Dynamic changes DISABLED for control testing
    //setInterval(() => this.calculateNaturalDynamics(), 10000);

    window.addEventListener("resize", () => this.resize());
    this.resize();
  },

  calculateNaturalDynamics() {
    // DIRECTION: Natural tactical oscillations of +/- 15 to 20 degrees
    this.trueWindDir = Math.floor(Math.random() * 41) - 20; 

    // SPEED: Natural "breath" fluctuation
    // At 8 knots, +/- 2 is a huge 25% shift. 
    // At 28 knots, +/- 2 is a manageable 7% shift.
    const fluctuation = Math.floor(Math.random() * 5) - 2; 
    this.currentWindSpeed = this.baseWindSpeed + fluctuation;
    
    // Safety clamp to ensure wind doesn't drop below 5 knots in Fortaleza
    if (this.currentWindSpeed < 5) this.currentWindSpeed = 5;

    this.updateWindUI();
  },

  updateWindUI() {
    const windText = document.querySelector('[data-windCondition]');
    const arrowGroup = document.getElementById('windArrowGroup');

    if (windText) {
      const shiftLabel = this.trueWindDir >= 0 ? `+${this.trueWindDir}` : this.trueWindDir;
      windText.textContent = `${this.currentWindSpeed} knots at ${shiftLabel}°`;
    }

    if (arrowGroup) {
      // Rotate around center (100,100). Arrow points DOWN in HTML.
      arrowGroup.setAttribute('transform', `rotate(${this.trueWindDir}, 100, 100)`);
    }
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

  drawRipples() {
    const hCenter = this.width / 2;
    const vCenter = this.height / 2;
    const minX = hCenter - this.range;
    const maxX = hCenter + this.range;
    const minY = vCenter - this.range;
    const maxY = vCenter + this.range;

    // Visual feedback: ripples move faster and get taller in high wind
    const animationSpeed = 0.015 * (this.currentWindSpeed / 8);
    this.ripplePhase += animationSpeed;

    this.ripples.forEach(({ y, line }) => {
      if (y < minY || y > maxY) {
        line.setAttribute("points", ""); 
        return;
      }

      let points = "";
      for (let x = minX; x <= maxX; x += 15) {
        const waveHeight = 2 + (this.currentWindSpeed * 0.4);
        const wave = Math.sin(x * 0.02 + y * 0.01 + this.ripplePhase) * waveHeight;
        points += `${x},${y + wave} `;
      }
      line.setAttribute("points", points);
    });
  },

    resize() {
    if (!this.svg) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.svg.setAttribute("width", this.width);
    this.svg.setAttribute("height", this.height);
  },

  draw() {
    this.drawRipples();
  }
};

export { environment };