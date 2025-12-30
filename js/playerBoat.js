// js/playerBoat.js
console.log("playerBoat.js loading…");

// #region ANIMATION ENGINE SETUP
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

  x: 0,
  y: 0,
  logicalX: 0,
  logicalY: 0,
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

    const margin = 100;
    const viewWidth = window.innerWidth;
    const viewHeight = window.innerHeight; 
    const startX = viewWidth - margin;
    const startY = viewHeight - margin;

    this.x = startX;
    this.y = startY;
    this.logicalX = startX;
    this.logicalY = startY;

    if (!this.el || !this.boatGroup) {
      console.error("Player boat SVG elements missing!");
      return;
    }

    this.sailPortTack = this.boomPivot.querySelector('#sailPortTack');
    this.sailStarboardTack = this.boomPivot.querySelector('#sailStarboardTack');
    this.sailLuffing = this.boomPivot.querySelector('#sailLuffing');

    this.updatePosition();
    console.log("Player boat initialized.");
    window.playerBoat = this;
  },
  // #endregion

  // #region UPDATE LOOP
  update() {
    if (!this.el) return;

    const gameScreen = document.getElementById('gameScreen');
const rect = gameScreen.getBoundingClientRect();
const viewWidth  = rect.width;
const viewHeight = rect.height;


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



// --- 3. PHYSICS (Laser Performance Specs) ---
    // A. Parse Wind Condition from DOM
    const windDisplay = document.querySelector('[data-windCondition]')?.textContent || "10 knots at 0°";
    const windMatch = windDisplay.match(/(-?\d+)/g); 
    const currentWindSpeed = windMatch ? parseFloat(windMatch[0]) : 10;
    const currentWindShift = windMatch ? parseFloat(windMatch[1]) : 0;

    // A2. Capture Outhaul Tuning (Range -2 to +2)
    const outhaulElement = document.getElementById('outhaulValue');
    const outhaulVal = parseFloat(outhaulElement?.getAttribute('data-outhaul')) || 0;

    // B. Calculate Wind Geometry
    const relativeWind = ((this.heading + 180 - currentWindShift) % 360) - 180; 
    const onPortTack = relativeWind < 0; 
    const absRel = Math.abs(relativeWind);
    const inNoGoZone = absRel < 45;
    const isLuffing = this.sheetAngle > absRel;

    // C. Auto-Tack Logic
    if (Math.abs(this.tillerAngle) >= 9 && inNoGoZone && !this.tackCommitment) {
        this.tackCommitment = true;
        this.targetRelativeWind = onPortTack ? 45 : -45;
    }

    // D. PHYSICS (Tuning Constants) ---
    const turnDragFactor   = 150;  // Higher = LESS speed lost when just steering
    const tackPenaltyBase  = 0.25; // % of wind speed maintained during a tack

    // E. IDEAL OUTHAUL CALCULATION (Per Chapter 05 Physics)
    // Range -2 (Loose) to +2 (Tight)
    let idealOuthaul = 0; 
    if (currentWindSpeed < 8) {
        idealOuthaul = -2.0; // Light air: Needs max depth/power
    } else if (currentWindSpeed > 18) {
        idealOuthaul = 2.0;  // Heavy air: Needs max flatness to reduce drag
    } else if (currentWindSpeed > 15) {
        idealOuthaul = 1.0;  
    } else if (currentWindSpeed < 10) {
        idealOuthaul = -1.0; 
    }

    // Calculate Outhaul Efficiency
    const outhaulError = Math.abs(outhaulVal - idealOuthaul);
    const outhaulEfficiency = Math.max(0.80, 1 - (outhaulError * 0.05));

    

    let potentialSpeed = 0; 
    let idealSheet = 0;

    if (this.tackCommitment) {
        // TACK PENALTY
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
        // Speed Ratios based on Point of Sail
        switch (true) {
            case (absRel < 44): potentialSpeed = currentWindSpeed * 0.32; idealSheet = 2;  break;
            case (absRel < 49): potentialSpeed = currentWindSpeed * 0.47; idealSheet = 5;  break;
            case (absRel < 65): potentialSpeed = currentWindSpeed * 0.58; idealSheet = 15; break;
            case (absRel < 115): potentialSpeed = currentWindSpeed * 0.85; idealSheet = 45; break;
            case (absRel < 155): potentialSpeed = currentWindSpeed * 0.70; idealSheet = 75; break;
            default: potentialSpeed = currentWindSpeed * 0.42; idealSheet = 90; break;
        }

        // Calculate Sail Trim Efficiency
        const sheetError = Math.abs(this.sheetAngle - idealSheet);
        let sheetEfficiency = Math.max(0.2, 1 - (sheetError / 40)); 

        // Apply all multipliers to final potential speed
        potentialSpeed = potentialSpeed * sheetEfficiency * outhaulEfficiency;

        // TURNING DRAG: Squeeze the speed if the tiller is hard over
        const turnPenalty = 1 - (Math.abs(this.tillerAngle) / turnDragFactor); 
        potentialSpeed *= turnPenalty;

        this.boomAngle = onPortTack ? this.sheetAngle : -this.sheetAngle;
        if (this.sailLuffing) this.sailLuffing.style.display = 'none';
    }






    // --- THE INERTIA ENGINE ---
    // If potentialSpeed is higher, we accelerate slowly (0.015)
    // If potentialSpeed is lower (like during a tack), we drop speed faster (0.04)
    const inertiaRate = (potentialSpeed > this.speed) ? 0.015 : 0.04;
    this.speed += (potentialSpeed - this.speed) * inertiaRate;

// --- SAIL VISIBILITY & SHAPE ---
let pathString = "";
// 1. ClewY: Median 90, Range 85 to 95 (Stretching along the boom)
// Tight (-2) = 95 units long | Loose (+2) = 85 units long
const clewY = 90 + (outhaulVal * 2.5); 

// 2. BellyX: Median 30, Range 20 to 40 (The bulge)
// Tight (-2) = -20 (Flat) | Loose (+2) = -40 (Baggy)
const belly = -30 - (outhaulVal * 5);

if (onPortTack) {
    // Starboard sail (Belly is negative X)
    pathString = `M-2,0 L-2,${clewY} Q ${belly},65 2,0 Z`;
    this.sailStarboardTack.setAttribute('d', pathString);
} else {
    // Port sail (Belly is positive X)
    pathString = `M2,0 L2,${clewY} Q ${-belly},65 2,0 Z`;
    this.sailPortTack.setAttribute('d', pathString);
}

if (!this.tackCommitment && !inNoGoZone && !isLuffing) {
    if (onPortTack) {
        // --- STARBOARD TACK ---
        this.sailStarboardTack.style.display = 'block';
        this.sailPortTack.style.display = 'none';
        
        // Construct the string
        this.sailStarboardTack.setAttribute('d', pathString);
        console.log("starboardTack path: ", pathString);
        
    } else {
        // --- PORT TACK ---
        this.sailPortTack.style.display = 'block';
        this.sailStarboardTack.style.display = 'none';
        
        // Construct the string
        this.sailPortTack.setAttribute('d', pathString);
        console.log("portTack path: ", pathString);
    }
    this.sailLuffing.style.display = 'none';
} else {
    // --- LUFFING OR TACKING ---
    this.sailLuffing.style.display = 'block';
    this.sailPortTack.style.display = 'none';
    this.sailStarboardTack.style.display = 'none';
    
    pathString = `M 0,0 L 0,${clewY.toFixed(1)} Q 20,40 -20,60 Q 25,70 0,0 Z`;
    this.sailLuffing.setAttribute('d', pathString);
}






// --- 4. VISUAL TRANSFORMATIONS ---
    if (this.boomPivot) {
        this.boomPivot.setAttribute('transform', `translate(0,0) rotate(${this.boomAngle}, 0, 0)`);
    }
    if (this.boatGroup) {
        this.boatGroup.setAttribute('transform', `translate(0,50) rotate(${this.heading}) translate(0,-50)`);
    }

    const pixelsPerSecond = this.speed * 10.6;
    const dx = Math.sin(this.heading * Math.PI / 180) * (pixelsPerSecond / 60);
    const dy = -Math.cos(this.heading * Math.PI / 180) * (pixelsPerSecond / 60);

    this.x += dx;
    this.y += dy;
    this.logicalX += dx;
    this.logicalY += dy;

    // --- 5. SCREEN WRAPPING ---
    const step = 0.2; 
    const threshold = 230; 
const horizontalCenter = viewWidth / 2;
const verticalCenter   = viewHeight / 2;

    if (this.y < (verticalCenter - threshold)) { 
      this.y = verticalCenter + threshold;
      this.updateVerticalKnotlines(step);
    } else if (this.y > (verticalCenter + threshold)) {
      this.y = verticalCenter - threshold;
      this.updateVerticalKnotlines(-step);
    }

    if (this.x > (horizontalCenter + threshold)) {
      this.x = horizontalCenter - threshold;
      this.updateHorizontalKnotlines(step);
    } else if (this.x < (horizontalCenter - threshold)) {
      this.x = horizontalCenter + threshold;
      this.updateHorizontalKnotlines(-step);
    }

    // --- 6. MARK VISIBILITY & UI ---
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

    // --- 7. RULE 31: COLLISION LOGIC ---
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

    // --- 8. DASHBOARD SYNC ---
    document.querySelector('[data-heading]').textContent = Math.round(this.heading).toString().padStart(3, '0') + '°';
    document.querySelector('[data-speed]').textContent = this.speed.toFixed(3) + ' kn'; 

    this.updatePosition();
  },

  // #region HELPER METHODS
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
  },

  updatePosition() {
    if (!this.el) return;
    this.el.style.left = `${this.x.toFixed(2)}px`;
    this.el.style.top  = `${this.y.toFixed(2)}px`;
    this.el.style.transform = 'translate(-50%, -50%)';
  }
  // #endregion
};

document.addEventListener('DOMContentLoaded', () => {
  playerBoat.init();
});