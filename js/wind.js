// js/wind.js — Wind System for Fortaleza Venue
console.log("wind.js — Fortaleza dynamic wind system active");

const wind = {
  baseWindSpeed: 10,
  currentWindSpeed: 10,
  trueWindDir: 0,        // Relative shift in degrees (±20°)

  init() {
    // Randomize initial base wind (8–28 knots, typical Fortaleza trade winds)
    this.baseWindSpeed = Math.floor(Math.random() * (28 - 8 + 1)) + 8;
    this.currentWindSpeed = this.baseWindSpeed;
    this.trueWindDir = 0;

    // Update UI immediately
    this.updateWindUI();

    // Natural wind changes every 10 seconds
    setInterval(() => this.calculateNaturalDynamics(), 10000);
  },

  calculateNaturalDynamics() {
    // Tactical direction oscillations ±20°
    this.trueWindDir = Math.floor(Math.random() * 41) - 20;

    // Speed "breath" ±2 knots
    const fluctuation = Math.floor(Math.random() * 5) - 2;
    this.currentWindSpeed = this.baseWindSpeed + fluctuation;

    // Never drop below 5 knots (keeps race playable)
    if (this.currentWindSpeed < 5) this.currentWindSpeed = 5;

    this.updateWindUI();
  },

updateWindUI() {
  const windText = document.querySelector('[data-windCondition]');
  const gameScreen = document.getElementById('gameScreen');

  if (!gameScreen || !windText ) return;

  // Update text (unchanged)
  const shiftLabel = this.trueWindDir >= 0 ? `+${this.trueWindDir}` : `${this.trueWindDir}`;
  windText.textContent = `${this.currentWindSpeed} knots at ${shiftLabel}°`;

},

  // Helper for other modules to read current wind values
  getCurrentWind() {
    return {
      speed: this.currentWindSpeed,
      directionShift: this.trueWindDir
    };
  }
};

export { wind };