// ==============================
// COLLISION MODULE - SAT.js
// ==============================

// --- EXECUTE ONCE: Memory Allocation ---
const SAT = window.SAT;
if (!SAT) throw new Error('SAT.js not loaded. Check script order.');

// 1. DEFINE SHAPES ONCE (Global Scope)
const boatPoints = [
    new SAT.Vector(0, 0),     // Bow (Pivot)
    new SAT.Vector(25, 100),  // Starboard Stern
    new SAT.Vector(-25, 100)  // Port Stern
];

const polygonPlayerBoat = new SAT.Polygon(new SAT.Vector(0, 0), boatPoints);

// Standard Rounding Buoy (Center of screen when active)
const circleBuoy = new SAT.Circle(new SAT.Vector(300, 250), 10);

// --- NEW: FINISH LINE MARKS (Coordinates from your SVG) ---
// Pin: cx="100" cy="250" r="12"
const circleStartPin = new SAT.Circle(new SAT.Vector(100, 250), 12);
// RC Boat: x="470" y="220" width="60" height="60" (Center is 500, 250)
const circleStartRC = new SAT.Circle(new SAT.Vector(500, 250), 30); 

const satResponse = new SAT.Response();

/**
 * Handles Mark Visibility, Scoring Penalties (Rule 44.3),
 * and collision detection.
 */
export function updateMarksAndCollisions(playerBoat) {
    const markEl = document.getElementById('mark');
    const mEl = document.getElementById('middle');
    const cEl = document.getElementById('center');
    const pinEl = document.getElementById('startPin');
    const rcEl = document.getElementById('startRC');

    if (!markEl || !mEl || !cEl) return;

    // --- 2. KNOTLINE LOGIC (World Position) ---
    const currentMiddle = parseFloat(mEl.dataset.middle).toFixed(1);
    const currentCenter = parseFloat(cEl.dataset.center).toFixed(1);

    // --- 3. SYNC SAT MATH ---
    polygonPlayerBoat.pos.x = playerBoat.x;
    polygonPlayerBoat.pos.y = playerBoat.y;
    polygonPlayerBoat.setAngle((playerBoat.heading * Math.PI) / 180);
    satResponse.clear();

    // --- 4. FINISH LINE COLLISION (ONLY AT 0.0, 0.0) ---
    if (currentMiddle === "0.0" && currentCenter === "0.0") {
        const hitPin = SAT.testPolygonCircle(polygonPlayerBoat, circleStartPin, satResponse);
        const hitRC = SAT.testPolygonCircle(polygonPlayerBoat, circleStartRC, satResponse);

        if (hitPin || hitRC) {
            // Record specifically that a FINISH mark was touched
            if (playerBoat.penalty && !playerBoat.penalty.marksHit.finishMark) {
                playerBoat.penalty.marksHit.finishMark = true;
                playerBoat.penalty.active = true;
                console.log("RULE 31: Finish Mark touched! (+30s penalty recorded)");
            }
            if (pinEl && hitPin) pinEl.setAttribute('fill', 'red');
            if (rcEl && hitRC) rcEl.setAttribute('fill', 'red');
        }
    }

    // --- 5. ROUNDING MARKS LOGIC ---
    let markNumber = 0;
    if (currentMiddle === "0.2" && currentCenter === "0.0") markNumber = 1;
    else if (currentMiddle === "0.0" && currentCenter === "-0.2") markNumber = 2;
    else if (currentMiddle === "-0.2" && currentCenter === "0.0") markNumber = 3;

    if (markNumber === 0) {
        markEl.style.display = 'none';
    } else {
        markEl.style.display = 'block';
        const isTouching = SAT.testPolygonCircle(polygonPlayerBoat, circleBuoy, satResponse);
        const markKey = `mark${markNumber}`;

        if (isTouching && playerBoat.penalty && !playerBoat.penalty.marksHit[markKey]) {
            playerBoat.penalty.marksHit[markKey] = true;
            playerBoat.penalty.active = true;
            console.log(`RULE 31: Mark ${markNumber} touched!`);
        }

        // Visual Persistence for Rounding Marks
        const circleEl = markEl.querySelector('circle');
        const textEl = markEl.querySelector('text');
        if (textEl) textEl.textContent = markNumber;
        if (circleEl) {
            circleEl.setAttribute('fill', playerBoat.penalty.marksHit[markKey] ? 'red' : 'yellow');
        }
    }

    // --- 6. YELLOW FLAG VISUAL (RULE 44.3) ---
    if (playerBoat.penalty && playerBoat.penalty.active) {
        const hull = document.getElementById('hull');
        if (hull) hull.setAttribute('stroke', '#FFD700'); 
    }
}