// js/raceTimer.js
console.log("raceTimer.js starting");

import { playerBoat } from './playerBoat.js';

// Helper function: always returns a DOM element or throws
function mustGetEl(selector) {
    const el = document.getElementById(selector);
    if (!el) throw new Error(`💥 FATAL: Required element #${selector} not found in DOM`);
    return el;
}

const raceTimer = {
    startTime: null,
    elapsed: -180,        // Start at T-3:00
    running: false,
    overEarlyActive: false, // Track over-early status

    start() {
        if (this.running) return;
        this.running = true;
        this.overEarlyActive = false;

        this.startTime = performance.now() - (this.elapsed * 1000);
        console.log("Race timer STARTED at T-3:00");

        // --- Get required flag elements ---
        const preparatory = mustGetEl("preparatory"); // Blue square
        const pennant1 = mustGetEl("pennant1");       // Pennant flag
        const overEarlyFlag = mustGetEl("overEarly"); // OverEarly “X” flag (guarded)

        // Reset visibility
        preparatory.classList.add("hide");
        pennant1.classList.remove("hide");
        overEarlyFlag.classList.add("hide");

        // Schedule flag changes relative to now
        const nowOffset = -this.elapsed; // seconds until T=0

        // T-2:00 → Preparatory UP
        setTimeout(() => {
            console.log("T-2:00 — Preparatory UP");
            preparatory.classList.remove("hide");
        }, (nowOffset - 120) * 1000);

        // T-1:00 → Preparatory DOWN
        setTimeout(() => {
            console.log("T-1:00 — Preparatory DOWN");
            preparatory.classList.add("hide");
        }, (nowOffset - 60) * 1000);

        // T-0:00 → Pennant DOWN + Over-Early check
        setTimeout(() => {
            console.log("T-0:00 — Pennant DOWN");
            pennant1.classList.add("hide");

            // --- OVER EARLY DETECTION ---
            const middleLine = mustGetEl("middle"); // Guarded
            const middleVal = parseFloat(middleLine.getAttribute('data-middle') || '0');
            const BOW_THRESHOLD_Y = 342; // Visual bow Y threshold

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
                overEarlyFlag.classList.remove("hide");
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

        // --- OVER EARLY CLEARING ---
        if (this.overEarlyActive && this.elapsed >= 0) {
            const middleLine = mustGetEl("middle"); // Guarded
            const middleVal = parseFloat(middleLine.getAttribute('data-middle') || '0');
            const BOW_THRESHOLD_Y = 320;
            const overEarlyFlag = mustGetEl("overEarly"); // Guarded

            if (middleVal <= 0.01 && playerBoat.y >= BOW_THRESHOLD_Y) {
                overEarlyFlag.classList.add("hide");
                this.overEarlyActive = false;
                console.log("OverEarly CLEARED – boat fully returned to pre-start side");
            }
        }

        requestAnimationFrame(this.tick.bind(this));
    },

    updateDisplay() {
        const display = mustGetEl('raceTimerDisplay'); // Guarded
        let text;

        if (this.elapsed < 0) {
            // Countdown
            const totalSeconds = Math.ceil(-this.elapsed);
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            text = `T-${mins}:${secs.toString().padStart(2, '0')}`;
        } else {
            // Count-up
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

        mustGetEl("preparatory").classList.add("hide");
        mustGetEl("pennant1").classList.add("hide");
        mustGetEl("overEarly").classList.add("hide");

        this.updateDisplay();
    },

    getElapsed() {
        return this.elapsed;
    }
};

export { raceTimer };
