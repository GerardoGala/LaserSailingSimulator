// js/environment.js — Brazil Venue: Wide Range Dynamics (Fixed Initial Layout Bug - Robust Version)
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

    // Randomize initial wind
    this.baseWindSpeed = Math.floor(Math.random() * (28 - 8 + 1)) + 8;
    this.currentWindSpeed = this.baseWindSpeed;

    // Update UI immediately (wind text/arrow are independent of size)
    this.updateWindUI();

    // Create ripple elements first
    this.initRipples();

    // Robust fix: Use a loop with requestAnimationFrame until we get valid non-zero dimensions
    const tryInitialResize = () => {
      const container = document.getElementById('gameScreen');
      if (container && container.clientWidth > 0 && container.clientHeight > 0) {
        this.resize();  // Now has correct size
        this.draw();    // Force immediate draw with proper points
      } else {
        requestAnimationFrame(tryInitialResize);  // Try again next frame
      }
    };

    requestAnimationFrame(tryInitialResize);

    // === RESTORED WIND OSCILLATION ===
    // Natural tactical shifts and breathing every 10 seconds
    setInterval(() => this.calculateNaturalDynamics(), 10000);

    // Standard resize handler for actual window resizes
    window.addEventListener("resize", () => this.resize());
  },

  calculateNaturalDynamics() {
    // DIRECTION: Natural tactical oscillations of +/- 15 to 20 degrees
    this.trueWindDir = Math.floor(Math.random() * 41) - 20;

    // SPEED: Natural "breath" fluctuation (±2 knots)
    const fluctuation = Math.floor(Math.random() * 5) - 2;
    this.currentWindSpeed = this.baseWindSpeed + fluctuation;
    
    // Safety clamp: never drop below 5 knots in Fortaleza
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
    const animationSpeed = 0.015 * (this.currentWindSpeed / 8);
    this.ripplePhase += animationSpeed;

    this.ripples.forEach(({ y, line }) => {
      if (y > this.height) {
        line.setAttribute("points", ""); 
        return;
      }

      let points = "";
      for (let x = 0; x <= this.width; x += 20) {
        const waveHeight = 2 + (this.currentWindSpeed * 0.4);
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

  draw() {
    this.drawRipples();
  }
};

export { environment };