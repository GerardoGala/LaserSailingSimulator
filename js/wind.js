// js/wind.js — Pattern-Based Oscillating Wind (Deterministic)
console.log("wind.js — pattern-based oscillating wind");

// Base pattern (0 → +5, with natural pauses)
const BASE_PATTERN = [0, 0, 1, 1, 2, 3, 4, 4, 5, 5];
const WIND_UPDATE_INTERVAL = 10_000; // 10 seconds

const wind = {
  favoredWindSpeed: 10,
  currentWindSpeed: 10,
  trueWindDir: 0,
  phase: 0,
  patternIndex: 0,

  init() {
    // Random favored wind speed (race-appropriate)
    this.favoredWindSpeed = Math.floor(Math.random() * (14 - 8 + 1)) + 8;
    this.currentWindSpeed = this.favoredWindSpeed;
    this.trueWindDir = 0;
    this.phase = 0;
    this.patternIndex = 0;

    // Update UI immediately at T=0
    this.advanceWind();

    // Schedule updates every 10 seconds
    setInterval(() => this.advanceWind(), WIND_UPDATE_INTERVAL);
  },

  advanceWind() {
    const value = BASE_PATTERN[this.patternIndex];

    switch (this.phase) {
      case 0: this.trueWindDir = value; break;             // 0 → +5
      case 1: this.trueWindDir = BASE_PATTERN[BASE_PATTERN.length - 1 - this.patternIndex]; break; // +5 → 0
      case 2: this.trueWindDir = -value; break;            // 0 → -5
      case 3: this.trueWindDir = -BASE_PATTERN[BASE_PATTERN.length - 1 - this.patternIndex]; break; // -5 → 0
    }

    this.patternIndex++;
    if (this.patternIndex >= BASE_PATTERN.length) {
      this.patternIndex = 0;
      this.phase = (this.phase + 1) % 4;
    }

    this.updateWindUI();
  },

  updateWindUI() {
    const speedEl = document.querySelector('#console text[data-windSpeed]');
    const dirEl   = document.querySelector('#console text[data-windDirection]');
    if (!speedEl || !dirEl) return;

    speedEl.textContent = `${this.currentWindSpeed} kn`;
    const label = this.trueWindDir >= 0 ? `+${this.trueWindDir}` : `${this.trueWindDir}`;
    dirEl.textContent = `${label}°`;
  },

  getCurrentWind() {
    return { speed: this.currentWindSpeed, directionShift: this.trueWindDir };
  }
};

export { wind };
