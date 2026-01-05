// js/playerBoat.js
console.log("playerBoat.js loading…");
import { WORLD } from './world.js';

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

  x: 300,       // now in world coordinates (0-600)
  y: 350,       // now in world coordinates (0-500)
  logicalX: 300,
  logicalY: 350,
  heading: 315,   
  speed: 0,      
  boomAngle: 0,
  tackCommitment: false, 
  tillerAngle: 0,
  sheetAngle: 15,

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

    // Start position is already set in HTML via transform="translate(300,350)"
    this.x = 300;
    this.y = 350;
    this.logicalX = 300;
    this.logicalY = 350;

    console.log("Player boat initialized.");
    window.playerBoat = this;
  },
  // #endregion

  // #region UPDATE LOOP (physics unchanged – only position code updated)
  update() {
    if (!this.el) return;

    // --- 1. TILLER & INPUT (unchanged) ---
    const tillerUI = document.getElementById('tillerControl');
    let targetTillerAngle = parseFloat(tillerUI?.getAttribute('data-angle') || '0');
    if (Math.abs(targetTillerAngle) <= 2) targetTillerAngle = 0;
    
    if (this.tillerGroup) {
      this.tillerGroup.setAttribute('transform', `translate(0,100) rotate(${targetTillerAngle})`);
    }
    
    this.heading += targetTillerAngle * 0.04;
    this.heading = (this.heading % 360 + 360) % 360;

    // --- 2. MAINSHEET (unchanged) ---
    const sheetUI = document.getElementById('sheetControl');
    this.sheetAngle = parseInt(sheetUI?.getAttribute('data-angle') || '15', 10);
    this.tillerAngle = targetTillerAngle;

    // --- 3. PHYSICS (exactly your original code – unchanged) ---
    const windDisplay = document.querySelector('[data-windCondition]')?.textContent || "10 knots at 0°";
    const windMatch = windDisplay.match(/(-?\d+)/g); 
    const currentWindSpeed = windMatch ? parseFloat(windMatch[0]) : 10;
    const currentWindShift = windMatch ? parseFloat(windMatch[1]) : 0;

    const outhaulElement = document.getElementById('outhaulValue');
    const outhaulVal = parseFloat(outhaulElement?.getAttribute('data-outhaul')) || 0;

    const relativeWind = ((this.heading + 180 - currentWindShift) % 360) - 180; 
    const onPortTack = relativeWind < 0; 
    const absRel = Math.abs(relativeWind);
    const inNoGoZone = absRel < 45;
    const isLuffing = this.sheetAngle > absRel;

    if (Math.abs(this.tillerAngle) >= 9 && inNoGoZone && !this.tackCommitment) {
        this.tackCommitment = true;
        this.targetRelativeWind = onPortTack ? 45 : -45;
    }

    const turnDragFactor   = 150;
    const tackPenaltyBase  = 0.25;

    let idealOuthaul = 0; 
    if (currentWindSpeed < 8) idealOuthaul = -2.0;
    else if (currentWindSpeed > 18) idealOuthaul = 2.0;
    else if (currentWindSpeed > 15) idealOuthaul = 1.0;
    else if (currentWindSpeed < 10) idealOuthaul = -1.0;

    const outhaulError = Math.abs(outhaulVal - idealOuthaul);
    const outhaulEfficiency = Math.max(0.80, 1 - (outhaulError * 0.05));

    let potentialSpeed = 0; 
    let idealSheet = 0;

    if (this.tackCommitment) {
        potentialSpeed = currentWindSpeed * tackPenaltyBase; 
        let angleDiff = this.targetRelativeWind - relativeWind;
        this.heading += Math.sign(angleDiff) * 2.0;
        if (Math.abs(this.targetRelativeWind - relativeWind) < 2) this.tackCommitment = false;
    } 
    else if (inNoGoZone || isLuffing) {
        potentialSpeed = 0;
        this.boomAngle = -relativeWind; 
        if (this.sailLuffing) this.sailLuffing.style.display = 'block';
    } 
    else {
        switch (true) {
            case (absRel < 44): potentialSpeed = currentWindSpeed * 0.32; idealSheet = 2;  break;
            case (absRel < 49): potentialSpeed = currentWindSpeed * 0.47; idealSheet = 5;  break;
            case (absRel < 65): potentialSpeed = currentWindSpeed * 0.58; idealSheet = 15; break;
            case (absRel < 115): potentialSpeed = currentWindSpeed * 0.85; idealSheet = 45; break;
            case (absRel < 155): potentialSpeed = currentWindSpeed * 0.70; idealSheet = 75; break;
            default: potentialSpeed = currentWindSpeed * 0.42; idealSheet = 90; break;
        }

        const sheetError = Math.abs(this.sheetAngle - idealSheet);
        let sheetEfficiency = Math.max(0.2, 1 - (sheetError / 40)); 
        potentialSpeed = potentialSpeed * sheetEfficiency * outhaulEfficiency;
        const turnPenalty = 1 - (Math.abs(this.tillerAngle) / turnDragFactor); 
        potentialSpeed *= turnPenalty;
        this.boomAngle = onPortTack ? this.sheetAngle : -this.sheetAngle;
        if (this.sailLuffing) this.sailLuffing.style.display = 'none';
    }

    const inertiaRate = (potentialSpeed > this.speed) ? 0.015 : 0.04;
    this.speed += (potentialSpeed - this.speed) * inertiaRate;

    // --- SAIL VISIBILITY & SHAPE (unchanged) ---
    const clewY = 90 + (outhaulVal * 2.5); 
    const belly = -30 - (outhaulVal * 5);
    let pathString = "";

    if (onPortTack) {
        pathString = `M-2,0 L-2,${clewY} Q ${belly},65 2,0 Z`;
        this.sailStarboardTack.setAttribute('d', pathString);
    } else {
        pathString = `M2,0 L2,${clewY} Q ${-belly},65 2,0 Z`;
        this.sailPortTack.setAttribute('d', pathString);
    }

    if (!this.tackCommitment && !inNoGoZone && !isLuffing) {
        if (onPortTack) {
            this.sailStarboardTack.style.display = 'block';
            this.sailPortTack.style.display = 'none';
        } else {
            this.sailPortTack.style.display = 'block';
            this.sailStarboardTack.style.display = 'none';
        }
        this.sailLuffing.style.display = 'none';
    } else {
        this.sailLuffing.style.display = 'block';
        this.sailPortTack.style.display = 'none';
        this.sailStarboardTack.style.display = 'none';
        pathString = `M 0,0 L 0,${clewY.toFixed(1)} Q 20,40 -20,60 Q 25,70 0,0 Z`;
        this.sailLuffing.setAttribute('d', pathString);
    }

    // --- 4. BOOM & BOAT ROTATION (unchanged) ---
    if (this.boomPivot) {
        this.boomPivot.setAttribute('transform', `translate(0,0) rotate(${this.boomAngle}, 0, 0)`);
    }
    if (this.boatGroup) {
        this.boatGroup.setAttribute('transform', `translate(0,50) rotate(${this.heading}) translate(0,-50)`);
    }

    // --- 5. MOVEMENT (now in world units) ---
    const pixelsPerSecond = this.speed * 50;
    const dx = Math.sin(this.heading * Math.PI / 180) * (pixelsPerSecond / 60);
    const dy = -Math.cos(this.heading * Math.PI / 180) * (pixelsPerSecond / 60);

    this.x += dx;
    this.y += dy;
    this.logicalX += dx;
    this.logicalY += dy;

    // --- 6. SCREEN WRAPPING (fixed to match viewBox 0-600 x, 0-500 y) ---
    const step = 0.2;
    const worldWidth = 600;
    const worldHeight = 500;

    if (this.y < 0) {
      this.y = worldHeight;
      this.updateVerticalKnotlines(step);
    }
    else if (this.y > worldHeight) {
      this.y = 0;
      this.updateVerticalKnotlines(-step);
    }

    if (this.x > worldWidth) {
      this.x = 0;
      this.updateHorizontalKnotlines(step);
    }
    else if (this.x < 0) {
      this.x = worldWidth;
      this.updateHorizontalKnotlines(-step);
    }

    // --- 7. MARK VISIBILITY & COLLISION (unchanged) ---
    const mEl = document.getElementById('middle');
    const cEl = document.getElementById('center');
    const startFinishLine = document.getElementById('startFinishLine');
    const mark1 = document.getElementById('mark1');
    const mark2 = document.getElementById('mark2');
    const mark3 = document.getElementById('mark3');
    
    if (mEl && cEl && mark1) {
        const currentMid = parseFloat(mEl.dataset.middle).toFixed(1);
        const currentCent = parseFloat(cEl.dataset.center).toFixed(1);
        
        startFinishLine.style.display = (currentMid === "0.0" && currentCent === "0.0") ? 'block' : 'none';
        mark1.style.display = (currentMid === "0.6" && currentCent === "0.0") ? 'block' : 'none';
        mark2.style.display = (currentMid === "0.0" && currentCent === "-0.6") ? 'block' : 'none';
        mark3.style.display = (currentMid === "-0.6" && currentCent === "0.0") ? 'block' : 'none';
    }

    if (mEl && cEl) {
        const currentMid = parseFloat(mEl.dataset.middle).toFixed(1);
        const currentCent = parseFloat(cEl.dataset.center).toFixed(1);
        const hitRadius = 22;
        const boatRect = this.el.getBoundingClientRect();
        const boatCenterX = boatRect.left + boatRect.width / 2;
        const boatCenterY = boatRect.top + boatRect.height / 2;

        const checkMark = (mark, midTarget, centTarget) => {
          if (currentMid === midTarget && currentCent === centTarget) {
            const rect = mark.getBoundingClientRect();
            const dist = Math.sqrt(Math.pow(boatCenterX - (rect.left + rect.width / 2), 2) + Math.pow(boatCenterY - (rect.top + rect.height / 2), 2));
            if (dist < hitRadius) {
                mark.dataset.hit = "true";
                mark.dataset.needsExoneration = "true";
            }
            if (mark.dataset.penaltyTurnComplete === "true") {
                mark.dataset.hit = "false"; mark.dataset.needsExoneration = "false"; mark.dataset.penaltyTurnComplete = "false";
            }
          }
        };

        checkMark(mark1, "0.6", "0.0");
        checkMark(mark2, "0.0", "-0.6");
        checkMark(mark3, "-0.6", "0.0");
    }

    // --- 8. DASHBOARD SYNC (unchanged) ---
    document.querySelector('[data-heading]').textContent = Math.round(this.heading).toString().padStart(3, '0') + '°';
    document.querySelector('[data-speed]').textContent = this.speed.toFixed(3) + ' kn'; 

    // --- 9. UPDATE POSITION IN SVG WORLD ---
    this.el.setAttribute('transform', `translate(${this.x}, ${this.y})`);
  },

  // #region HELPER METHODS (unchanged)
  updateVerticalKnotlines(val) {
    const t = document.getElementById('top'), m = document.getElementById('middle'), b = document.getElementById('bottom');
    if (t && m && b) {
      let topVal = parseFloat(t.dataset.top) + val;
      let midVal = parseFloat(m.dataset.middle) + val;
      let botVal = parseFloat(b.dataset.bottom) + val;
      t.dataset.top = topVal; t.textContent = (topVal > 0 ? '+' : '') + topVal.toFixed(1);
      m.dataset.middle = midVal; m.textContent = (midVal > 0 ? '+' : '') + midVal.toFixed(1);
      b.dataset.bottom = botVal; b.textContent = (botVal > 0 ? '+' : '') + botVal.toFixed(1);
    }
  },

  updateHorizontalKnotlines(val) {
    const l = document.getElementById('left'), c = document.getElementById('center'), r = document.getElementById('right');
    if (l && c && r) {
      let leftVal = parseFloat(l.dataset.left) + val;
      let centVal = parseFloat(c.dataset.center) + val;
      let righVal = parseFloat(r.dataset.right) + val;
      l.dataset.left = leftVal; l.textContent = (leftVal > 0 ? '+' : '') + leftVal.toFixed(1);
      c.dataset.center = centVal; c.textContent = (centVal > 0 ? '+' : '') + centVal.toFixed(1);
      r.dataset.right = righVal; r.textContent = (righVal > 0 ? '+' : '') + righVal.toFixed(1);
    }
  }
  // #endregion
};

document.addEventListener('DOMContentLoaded', () => {
  playerBoat.init();
});