// ==============================
// COLLISION MODULE - SAT.js
// ==============================

// Use the global SAT
const SAT = window.SAT;
if (!SAT) throw new Error('SAT.js not loaded. Check script order.');

// ==============================
// SAT SHAPES (DEFINE ONCE)
// ==============================

// Player boat polygon (relative to boat center)
export const boatSAT = new SAT.Polygon(
  new SAT.Vector(0, 0),
  [
    new SAT.Vector(-8, -16),
    new SAT.Vector(8, -16),
    new SAT.Vector(6, 16),
    new SAT.Vector(-6, 16)
  ]
);

// Virtual buoy at camera center
export const buoyRadius = 10;
export const buoySAT = new SAT.Circle(new SAT.Vector(0, 0), buoyRadius);

// SAT response object (reused each frame)
export const satResponse = new SAT.Response();

// ==============================
// UPDATE MARK VISIBILITY & COLLISIONS
// ==============================
export function updateMarksAndCollisions(playerBoat) {
  // Get the “knotline” elements
  const mEl = document.getElementById('middle');
  const cEl = document.getElementById('center');
  const startFinishLine = document.getElementById('startFinishLine');
  const mark1 = document.getElementById('mark1');
  const mark2 = document.getElementById('mark2');
  const mark3 = document.getElementById('mark3');

  if (!mEl || !cEl || !mark1) return;

  // --- Current virtual location (from knot lines)
  const currentMid = parseFloat(mEl.dataset.middle).toFixed(1);
  const currentCent = parseFloat(cEl.dataset.center).toFixed(1);

  // --- Determine which mark is visible
  const atStart = (currentMid === "0.0" && currentCent === "0.0");
  const atM1 = (currentMid === "0.6" && currentCent === "0.0");
  const atM2 = (currentMid === "0.0" && currentCent === "-0.6");
  const atM3 = (currentMid === "-0.6" && currentCent === "0.0");

  startFinishLine.style.display = atStart ? 'block' : 'none';
  mark1.style.display = atM1 ? 'block' : 'none';
  mark2.style.display = atM2 ? 'block' : 'none';
  mark3.style.display = atM3 ? 'block' : 'none';

  // --- Only check SAT collision if a mark is visible
  if (atM1 || atM2 || atM3) {
    // Update boat SAT position and rotation
    boatSAT.pos.x = playerBoat.x;
    boatSAT.pos.y = playerBoat.y;
    boatSAT.setAngle(playerBoat.heading * Math.PI / 180);

    // Virtual buoy always at camera center
    const CAMERA_CENTER_X = 300;
    const CAMERA_CENTER_Y = 350;
    buoySAT.pos.x = CAMERA_CENTER_X;
    buoySAT.pos.y = CAMERA_CENTER_Y;

    satResponse.clear();

    if (SAT.testPolygonCircle(boatSAT, buoySAT, satResponse)) {
      console.log('🎯 Mark collision detected at camera center!');

      // --- Apply penalty ---
      playerBoat.penalty = playerBoat.penalty || {};
      playerBoat.penalty.active = true;       // penalty is now owed
      playerBoat.penalty.tackDone = false;    // reset tack/gybe counters
      playerBoat.penalty.gybeDone = false;
      playerBoat.penalty.lastTWA = playerBoat.heading;

      // --- Visual cue: mark turns red to indicate violation ---
if (atM1) {
    mark1.setAttribute('fill', 'red');
}
      if (atM2) mark2.setAttribute('fill', 'red');
      if (atM3) mark3.setAttribute('fill', 'red');
    }
  }
}
