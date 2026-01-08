// js/playerBoat.js
console.log("playerBoat.js loading…");

import { WORLD } from './world.js';
import { runPhysics } from './boatPhysics.js';  // <-- import physics module
import { updateMarksAndCollisions } from './collision.js';

// #region ANIMATION ENGINE SETUP (unchanged)
const animePromise = new Promise((resolve, reject) => {
  if (window.anime && typeof window.anime === 'function') return resolve(window.anime);
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js';
  script.onload = () => requestAnimationFrame(() => window.anime ? resolve(window.anime) : reject(new Error('anime.js CDN failed')));
  script.onerror = () => reject();
  document.head.appendChild(script);
});
// #endregion

// #region PROPERTIES & STATE
export const playerBoat = {
  el: null,
  boatGroup: null,
  tillerGroup: null,
  boomPivot: null,
  sailPortTack: null,
  sailStarboardTack: null,
  sailLuffing: null,

  x: 300,
  y: 350,
  logicalX: 300,
  logicalY: 350,
  heading: 45,
  speed: 0,
  boomAngle: 0,
  tackCommitment: false,
  tillerAngle: 0,
  sheetAngle: 15,

  penalty: {
    active: false,
    tackDone: false,
    gybeDone: false,
    lastTWA: null
  },


  // #region INITIALIZATION
  async init() {
    try {
      this.anime = await animePromise;
      console.log("anime.js loaded");
    } catch (e) {
      console.warn("anime.js failed");
      this.anime = null;
    }

    this.el = document.getElementById('playerBoat');
    this.boatGroup = this.el.querySelector('#boatGroup');
    this.tillerGroup = this.el.querySelector('#tillerGroup');
    this.boomPivot = this.el.querySelector('#boomPivot');

    if (!this.el || !this.boatGroup) {
      console.error("Player boat SVG elements missing!");
      return;
    }

    this.sailPortTack = this.boomPivot.querySelector('#sailPortTack');
    this.sailStarboardTack = this.boomPivot.querySelector('#sailStarboardTack');
    this.sailLuffing = this.boomPivot.querySelector('#sailLuffing');

    // Start position
    this.x = 300;
    this.y = 350;
    this.logicalX = 300;
    this.logicalY = 350;

    console.log("Player boat initialized.");
    window.playerBoat = this;
  },
  // #endregion

  // #region UPDATE LOOP
  update() {
    if (!this.el) return;

    // --- 1. TILLER & INPUT ---
    const tillerUI = document.getElementById('tillerControl');
    let targetTillerAngle = parseFloat(tillerUI?.getAttribute('data-angle') || '0');
    if (Math.abs(targetTillerAngle) <= 2) targetTillerAngle = 0;

    if (this.tillerGroup) {
      this.tillerGroup.setAttribute('transform', `translate(0,100) rotate(${targetTillerAngle})`);
    }

    this.heading += targetTillerAngle * 0.04;
    this.heading = (this.heading % 360 + 360) % 360;

    // --- 2. MAINSHEET ---
    const sheetUI = document.getElementById('sheetControl');
    this.sheetAngle = parseInt(sheetUI?.getAttribute('data-angle') || '15', 10);
    this.tillerAngle = targetTillerAngle;

    // --- 3. PHYSICS ---
    runPhysics(this);  // <-- call physics module, pass the boat instance

    // --- 4. BOOM & BOAT ROTATION ---
    if (this.boomPivot) {
      this.boomPivot.setAttribute('transform', `translate(0,0) rotate(${this.boomAngle}, 0, 0)`);
    }
    if (this.boatGroup) {
      this.boatGroup.setAttribute('transform', `translate(0,50) rotate(${this.heading}) translate(0,-50)`);
    }

    // --- 5. MOVEMENT (world units) ---
    const pixelsPerSecond = this.speed * 50;
    const dx = Math.sin(this.heading * Math.PI / 180) * (pixelsPerSecond / 60);
    const dy = -Math.cos(this.heading * Math.PI / 180) * (pixelsPerSecond / 60);

    this.x += dx;
    this.y += dy;
    this.logicalX += dx;
    this.logicalY += dy;

    // --- 6. SCREEN WRAPPING ---
    const step = 0.2;
    const worldWidth = 600;
    const worldHeight = 500;

    if (this.y < 0) { this.y = worldHeight; this.updateVerticalKnotlines(step); }
    else if (this.y > worldHeight) { this.y = 0; this.updateVerticalKnotlines(-step); }

    if (this.x > worldWidth) { this.x = 0; this.updateHorizontalKnotlines(step); }
    else if (this.x < 0) { this.x = worldWidth; this.updateHorizontalKnotlines(-step); }

    // --- 7. MARK VISIBILITY & COLLISION ---
updateMarksAndCollisions(this);  // <-- handle mark visibility + SAT collision

    // --- 8. DASHBOARD SYNC ---
    document.querySelector('[data-heading]').textContent = Math.round(this.heading).toString().padStart(3,'0') + '°';
    document.querySelector('[data-speed]').textContent = this.speed.toFixed(3) + ' kn';

    // --- 9. UPDATE POSITION IN SVG WORLD ---
    this.el.setAttribute('transform', `translate(${this.x}, ${this.y})`);
  },

  // #region HELPER METHODS
  updateVerticalKnotlines(val) {
    const t = document.getElementById('top'), m = document.getElementById('middle'), b = document.getElementById('bottom');
    if (t && m && b) {
      let topVal = parseFloat(t.dataset.top) + val;
      let midVal = parseFloat(m.dataset.middle) + val;
      let botVal = parseFloat(b.dataset.bottom) + val;
      t.dataset.top = topVal; t.textContent = (topVal>0?'+':'') + topVal.toFixed(1);
      m.dataset.middle = midVal; m.textContent = (midVal>0?'+':'') + midVal.toFixed(1);
      b.dataset.bottom = botVal; b.textContent = (botVal>0?'+':'') + botVal.toFixed(1);
    }
  },

  updateHorizontalKnotlines(val) {
    const l = document.getElementById('left'), c = document.getElementById('center'), r = document.getElementById('right');
    if (l && c && r) {
      let leftVal = parseFloat(l.dataset.left) + val;
      let centVal = parseFloat(c.dataset.center) + val;
      let righVal = parseFloat(r.dataset.right) + val;
      l.dataset.left = leftVal; l.textContent = (leftVal>0?'+':'') + leftVal.toFixed(1);
      c.dataset.center = centVal; c.textContent = (centVal>0?'+':'') + centVal.toFixed(1);
      r.dataset.right = righVal; r.textContent = (righVal>0?'+':'') + righVal.toFixed(1);
    }
  }
  // #endregion
};

document.addEventListener('DOMContentLoaded', () => {
  playerBoat.init();
});
