console.log("raceTimer.js starting");

import { playerBoat } from './playerBoat.js';
import { wind } from './wind.js';         // ← NEW IMPORT

const raceTimer = {
  startTime: null,
  elapsed: -180,        // start at T-3:00
  running: false,

  // Track whether an OverEarly violation is currently active
  overEarlyActive: false,

  start() {
    if (this.running) return;
    this.running = true;
    this.overEarlyActive = false; // Reset in case of restart

    // === WIND INITIALIZATION AT T-3:00 ===
    // This is the perfect moment: layout is stable (fixes mobile bug)
    // and player now has full 3 minutes to read the wind and plan strategy
    wind.init();

    this.startTime = performance.now() - (this.elapsed * 1000);
    console.log("Race timer STARTED at T-3:00");

    // Flag elements
    const preparatory = document.getElementById("preparatory");
    const pennant1 = document.getElementById("pennant1");
    const overEarlyFlag = document.getElementById("overEarly");

    // Ensure OverEarly flag is hidden at fresh start
    overEarlyFlag?.classList.add("hide");

    // Clear any previous state
    preparatory?.classList.add("hide");
    pennant1?.classList.remove("hide");

    // Schedule flag changes relative to NOW
    const nowOffset = -this.elapsed; // seconds until T=0

    // T-2:00 → Preparatory UP
    setTimeout(() => {
      console.log("T-2:00 — Preparatory UP");
      preparatory?.classList.remove("hide");
    }, (nowOffset - 120) * 1000);

    // T-1:00 → Preparatory DOWN
    setTimeout(() => {
      console.log("T-1:00 — Preparatory DOWN");
      preparatory?.classList.add("hide");
    }, (nowOffset - 60) * 1000);

    // T-0:00 → Pennant DOWN + Over-Early Check
    setTimeout(() => {
      console.log("T-0:00 — Pennant DOWN");
      pennant1?.classList.add("hide");

      // === OVER EARLY DETECTION AT THE START GUN ===
      const middleLine = document.getElementById("middle");
      const middleVal = middleLine ? parseFloat(middleLine.getAttribute('data-middle') || '0') : 0;
      const BOW_THRESHOLD_Y = 342; // Bow crosses line around this Y value

      let overEarly = false;

      if (middleVal > 0.01) {
        overEarly = true;
        console.log(`OVER EARLY – player has wrapped (middle: ${middleVal.toFixed(2)})`);
      } else if (playerBoat.y < BOW_THRESHOLD_Y) {
        overEarly = true;
        console.log(`OVER EARLY – bow above line (y: ${playerBoat.y.toFixed(0)} < ${BOW_THRESHOLD_Y})`);
      } else {
        console.log(`Clean start – middle: ${middleVal.toFixed(2)}, y: ${playerBoat.y.toFixed(0)}`);
      }

      if (overEarly) {
        overEarlyFlag?.classList.remove("hide");
        this.overEarlyActive = true;
        console.log("OVER EARLY – X flag raised");
      }
    }, nowOffset * 1000);

    this.updateDisplay();
    requestAnimationFrame(this.tick.bind(this));
  },

  tick(now) {
    if (!this.running) return;
    this.elapsed = (now - this.startTime) / 1000;
    this.updateDisplay();

    // === OVER EARLY CLEARING LOGIC (runs every frame after start) ===
    if (this.overEarlyActive && this.elapsed >= 0) {
      const middleLine = document.getElementById("middle");
      const middleVal = middleLine ? parseFloat(middleLine.getAttribute('data-middle') || '0') : 0;
      const BOW_THRESHOLD_Y = 320;

      const overEarlyFlag = document.getElementById("overEarly");

      if (middleVal <= 0.01 && playerBoat.y >= BOW_THRESHOLD_Y) {
        overEarlyFlag?.classList.add("hide");
        this.overEarlyActive = false;
        console.log("OverEarly CLEARED – boat fully returned to pre-start side");
      }
    }

    requestAnimationFrame(this.tick.bind(this));
  },

  getElapsed() {
    return this.elapsed;
  },

  updateDisplay() {
    const display = document.getElementById('raceTimerDisplay');
    if (!display) return;

    let text;

    if (this.elapsed < 0) {
      // Countdown (pre-start)
      const totalSeconds = Math.ceil(-this.elapsed);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;

      text = `T-${mins}:${secs.toString().padStart(2, '0')}`;
    } else {
      // Count-up (post-start)
      const totalSeconds = Math.floor(this.elapsed);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;

      text = `+${mins}:${secs.toString().padStart(2, '0')}`;
    }

    display.textContent = text;
  },

  reset() {
    this.running = false;
    this.elapsed = -180;
    this.overEarlyActive = false;

    // Hide all flags on reset
    document.getElementById("preparatory")?.classList.add("hide");
    document.getElementById("pennant1")?.classList.add("hide");
    document.getElementById("overEarly")?.classList.add("hide");

    this.updateDisplay();
  }
};

export { raceTimer };