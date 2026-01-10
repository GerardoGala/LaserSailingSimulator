// ==============================
// COLLISION MODULE - SAT.js
// ==============================

const SAT = window.SAT;
if (!SAT) throw new Error('SAT.js not loaded. Check script order.');

// 1. DEFINE SHAPES ONCE (Global Scope)
// Matches your SVG: points="0,0 -25,100 25,100" (Clockwise for SAT)
const boatPoints = [
  new SAT.Vector(0, 0),     // Bow (Pivot)
  new SAT.Vector(25, 100),  // Starboard Stern
  new SAT.Vector(-25, 100)  // Port Stern
];

const polygonPlayerBoat = new SAT.Polygon(new SAT.Vector(0, 0), boatPoints);
// Fixed World Position for the buoy
const circleBuoy = new SAT.Circle(new SAT.Vector(300, 250), 10);
const satResponse = new SAT.Response();

/**
 * Handles Mark Visibility, Scoring Penalties (Rule 44.3),
 * and collision detection without affecting boat movement.
 */
export function updateMarksAndCollisions(playerBoat) {
  const markEl = document.getElementById('mark');
  const mEl = document.getElementById('middle');
  const cEl = document.getElementById('center');

  if (!markEl || !mEl || !cEl) return;

  // --- 2. KNOTLINE LOGIC (World Position) ---
  const currentMiddle = parseFloat(mEl.dataset.middle).toFixed(1);
  const currentCenter = parseFloat(cEl.dataset.center).toFixed(1);

  let markNumber = 0;
  if (currentMiddle === "0.2" && currentCenter === "0.0") markNumber = 1;
  else if (currentMiddle === "0.0" && currentCenter === "-0.6") markNumber = 2;
  else if (currentMiddle === "-0.6" && currentCenter === "0.0") markNumber = 3;

  // If no buoy is in this area, hide and exit
  if (markNumber === 0) {
    markEl.style.display = 'none';
    return;
  }

  // --- 3. SYNC SAT MATH ---
  polygonPlayerBoat.pos.x = playerBoat.x;
  polygonPlayerBoat.pos.y = playerBoat.y;
  polygonPlayerBoat.setAngle((playerBoat.heading * Math.PI) / 180);

  // --- 4. COLLISION TEST ---
  satResponse.clear();
  const isTouching = SAT.testPolygonCircle(polygonPlayerBoat, circleBuoy, satResponse);
  
  const markKey = `mark${markNumber}`;

  // If currently touching and hasn't been hit before, record it
  if (isTouching && playerBoat.penalty && !playerBoat.penalty.marksHit[markKey]) {
    playerBoat.penalty.marksHit[markKey] = true;
    playerBoat.penalty.active = true;
    console.log(`RULE 31: Mark ${markNumber} touched! Yellow Flag (Scoring Penalty) applied.`);
  }

  // --- 5. VISUAL UPDATES ---
  markEl.style.display = 'block';
  const circleEl = markEl.querySelector('circle');
  const textEl = markEl.querySelector('text');

  if (textEl) textEl.textContent = markNumber;
  
  if (circleEl) {
    // PERSISTENCE: If the boat has EVER hit this specific mark, it stays red
    if (playerBoat.penalty && playerBoat.penalty.marksHit[markKey]) {
      circleEl.setAttribute('fill', 'red');
    } else {
      circleEl.setAttribute('fill', 'yellow');
    }
  }

  // --- 6. YELLOW FLAG VISUAL (RULE 44.3) ---
  if (playerBoat.penalty && playerBoat.penalty.active) {
    const hull = document.getElementById('hull');
    if (hull) hull.setAttribute('stroke', '#FFD700'); // Gold stroke for Yellow Flag
  }
}