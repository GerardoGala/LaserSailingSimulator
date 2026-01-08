// js/physics.js
// --- 3. PHYSICS (polar-driven, rules-correct) ---
export function runPhysics(boat) {
  // Read wind from UI
  const speedEl = document.querySelector('[data-windSpeed]');
  const dirEl   = document.querySelector('[data-windDirection]');

  const currentWindSpeed = speedEl
    ? parseFloat(speedEl.textContent) || 10
    : 10;

  const currentWindShift = dirEl
    ? parseFloat(dirEl.textContent.replace('°', '').replace('+', '')) || 0
    : 0;

  // --- ILCA POLAR DIAGRAM (10 kts reference) ---
  const ILCA_POLAR = [
    { twa: 30,  speed: 4.8, sheet: 3  },   // Close Hauled
    { twa: 45,  speed: 5.2, sheet: 10 },
    { twa: 60,  speed: 6.2, sheet: 20 },   // Close Reach
    { twa: 90,  speed: 8.5, sheet: 45 },   // Beam Reach
    { twa: 135, speed: 7.2, sheet: 75 },   // Broad Reach
    { twa: 175, speed: 4.5, sheet: 90 }    // Dead Run
  ];

  // Polar interpolation
  function getPolarSpeedAndSheet(twa) {
    twa = Math.max(ILCA_POLAR[0].twa, Math.min(twa, ILCA_POLAR.at(-1).twa));

    for (let i = 0; i < ILCA_POLAR.length - 1; i++) {
      const a = ILCA_POLAR[i];
      const b = ILCA_POLAR[i + 1];
      if (twa >= a.twa && twa <= b.twa) {
        const t = (twa - a.twa) / (b.twa - a.twa);
        return {
          speed: a.speed + t * (b.speed - a.speed),
          sheet: a.sheet + t * (b.sheet - a.sheet)
        };
      }
    }
    return { speed: 0, sheet: 0 };
  }

  // Controls
  const outhaulElement = document.getElementById('outhaulValue');
  const outhaulVal =
    parseFloat(outhaulElement?.getAttribute('data-outhaul')) || 0;

  // Relative wind geometry
  let relativeWind =
    ((boat.heading + 180 - currentWindShift) % 360) - 180;

  // Clamp relative wind to 0°–180° for TWA
  let absRel = Math.abs(relativeWind);
  if (absRel > 180) absRel = 360 - absRel;

  const onPortTack = relativeWind < 0;
  const inNoGoZone = absRel < 30;
  const isLuffing = boat.sheetAngle > absRel;

  // Tack initiation
  if (
    Math.abs(boat.tillerAngle) >= 9 &&
    inNoGoZone &&
    !boat.tackCommitment
  ) {
    boat.tackCommitment = true;
    boat.targetRelativeWind = onPortTack ? 45 : -45;
  }

  // Constants
  const turnDragFactor  = 150;
  const tackPenaltyBase = 0.25;

  // Outhaul efficiency
  let idealOuthaul = 0;
  if (currentWindSpeed < 8) idealOuthaul = -2;
  else if (currentWindSpeed > 18) idealOuthaul = 2;
  else if (currentWindSpeed > 15) idealOuthaul = 1;
  else if (currentWindSpeed < 10) idealOuthaul = -1;

  const outhaulError = Math.abs(outhaulVal - idealOuthaul);
  const outhaulEfficiency = Math.max(0.8, 1 - outhaulError * 0.05);

  // --- SPEED CALCULATION ---
  let potentialSpeed = 0;
  let idealSheet = 0;

  if (boat.tackCommitment) {
    potentialSpeed = currentWindSpeed * tackPenaltyBase;

    const angleDiff = boat.targetRelativeWind - relativeWind;
    boat.heading += Math.sign(angleDiff) * 2.0;

    if (Math.abs(angleDiff) < 2) {
      boat.tackCommitment = false;
    }

  } else if (inNoGoZone || isLuffing) {
    potentialSpeed = 0;
    boat.boomAngle = -relativeWind;
    if (boat.sailLuffing) boat.sailLuffing.style.display = 'block';

  } else {
    // --- POLAR-BASED SPEED ---
    const polar = getPolarSpeedAndSheet(absRel);
    const windScale = currentWindSpeed / 10;
    potentialSpeed = polar.speed * windScale;
    idealSheet = polar.sheet;

    // --- Sheet efficiency ---
    const sheetError = Math.abs(boat.sheetAngle - idealSheet);
    const trimTolerance = 18;
    let sheetEfficiency = Math.exp(-Math.pow(sheetError / trimTolerance, 2));
    sheetEfficiency = Math.max(0.25, sheetEfficiency);

    // --- Quadratic drag ---
    const dragCoeff = 0.01;
    const drag = dragCoeff * boat.speed * boat.speed;

    potentialSpeed = Math.max(0, potentialSpeed - drag);
    const turnPenalty = 1 - Math.abs(boat.tillerAngle) / turnDragFactor;
    potentialSpeed *= sheetEfficiency * outhaulEfficiency * turnPenalty;

    boat.boomAngle = onPortTack ? boat.sheetAngle : -boat.sheetAngle;

    if (boat.sailLuffing) boat.sailLuffing.style.display = 'none';

    /* --- DEBUG LOG ---
    if (true) {
      console.group("⚓ BEAM REACH DEBUG");
      console.log("absRel (TWA):", absRel.toFixed(2));
      console.log("Polar speed:", polar.speed);
      console.log("Wind scale:", windScale.toFixed(2));
      console.log("Ideal sheet:", idealSheet);
      console.log("Actual sheetAngle:", boat.sheetAngle);
      console.log("Sheet error:", sheetError.toFixed(2));
      console.log("Sheet efficiency:", sheetEfficiency.toFixed(3));
      console.log("Potential speed (pre-inertia):", potentialSpeed.toFixed(3));
      console.log("Current boat speed:", boat.speed.toFixed(3));
      console.groupEnd();
    }
    */
  }

  // Inertia
  const inertiaRate = potentialSpeed > boat.speed ? 0.015 : 0.04;
  boat.speed += (potentialSpeed - boat.speed) * inertiaRate;

  // --- SAIL VISIBILITY & SHAPE ---
  const clewY = 90 + outhaulVal * 2.5;
  const belly = -30 - outhaulVal * 5;
  let pathString = "";

  if (onPortTack) {
    pathString = `M-2,0 L-2,${clewY} Q ${belly},65 2,0 Z`;
    boat.sailStarboardTack.setAttribute('d', pathString);
  } else {
    pathString = `M2,0 L2,${clewY} Q ${-belly},65 2,0 Z`;
    boat.sailPortTack.setAttribute('d', pathString);
  }

  if (!boat.tackCommitment && !inNoGoZone && !isLuffing) {
    if (onPortTack) {
      boat.sailStarboardTack.style.display = 'block';
      boat.sailPortTack.style.display = 'none';
    } else {
      boat.sailPortTack.style.display = 'block';
      boat.sailStarboardTack.style.display = 'none';
    }
    boat.sailLuffing.style.display = 'none';
  } else {
    boat.sailLuffing.style.display = 'block';
    boat.sailPortTack.style.display = 'none';
    boat.sailStarboardTack.style.display = 'none';

    pathString =
      `M 0,0 L 0,${clewY.toFixed(1)}
       Q 20,40 -20,60
       Q 25,70 0,0 Z`;

    boat.sailLuffing.setAttribute('d', pathString);
  }
}
