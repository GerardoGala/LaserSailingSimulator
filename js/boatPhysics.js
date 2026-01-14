// --- EXECUTE ONCE: Memory Allocation ---
// 1. Static Reference Data
const ILCA_POLAR = [
    { twa: 30,  speed: 4.8, sheet: 3  },
    { twa: 45,  speed: 5.2, sheet: 10 },
    { twa: 60,  speed: 6.2, sheet: 20 },
    { twa: 90,  speed: 8.5, sheet: 45 },
    { twa: 135, speed: 7.2, sheet: 75 },
    { twa: 175, speed: 4.5, sheet: 90 }
];

// 2. Persistent DOM References
// We cache these once to avoid calling querySelector 60 times per second.
const speedEl = document.querySelector('[data-windSpeed]');
const dirEl   = document.querySelector('[data-windDirection]');
const outhaulElement = document.getElementById('outhaulValue');

// 3. Helper Functions
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

// --- CALCULATE ALWAYS: Physics Engine ---
export function runPhysics(boat) {
    // 1. Read values from UI/Data Attributes
    const currentWindSpeed = speedEl ? parseFloat(speedEl.textContent) || 10 : 10;
    const currentWindShift = dirEl ? parseFloat(dirEl.textContent.replace('°', '').replace('+', '')) || 0 : 0;
    
    // Read the -2 to +2 tuning values
    const outhaulVal = parseFloat(outhaulElement?.getAttribute('data-outhaul')) || 0;
    const vangVal = parseFloat(document.getElementById('vangValue')?.getAttribute('data-vang')) || 0;
    const downhaulVal = parseFloat(document.getElementById('downhaulValue')?.getAttribute('data-downhaul')) || 0;

    // 2. Relative wind geometry
    let relativeWind = ((boat.heading + 180 - currentWindShift) % 360) - 180;
    let absRel = Math.abs(relativeWind);
    if (absRel > 180) absRel = 360 - absRel;

    const onPortTack = relativeWind < 0;
    const inNoGoZone = absRel < 30;
    const isLuffing = boat.sheetAngle > absRel;

    // 3. Tack logic
    if (Math.abs(boat.tillerAngle) >= 9 && inNoGoZone && !boat.tackCommitment) {
        boat.tackCommitment = true;
        boat.targetRelativeWind = onPortTack ? 45 : -45;
    }

    // 4. TUNING EFFICIENCY (8-14 Knot Logic)
    // 8-9 knots: Ideal is +2 (Loose/Power)
    // 13-14 knots: Ideal is -2 (Tight/Flat)
    let idealTune = 0;
    if (currentWindSpeed <= 9) idealTune = 2;
    else if (currentWindSpeed <= 11) idealTune = 1;
    else if (currentWindSpeed <= 12) idealTune = 0;
    else if (currentWindSpeed <= 13) idealTune = -1;
    else idealTune = -2;

    const vErr = Math.abs(vangVal - idealTune);
    const dErr = Math.abs(downhaulVal - idealTune);
    const oErr = Math.abs(outhaulVal - idealTune);
    
    // Calculate combined tuning efficiency (max penalty ~25% if all wrong)
    const tuneEfficiency = Math.max(0.75, 1 - (vErr + dErr + oErr) * 0.03);

    // 5. SPEED CALCULATION
    const turnDragFactor = 150;
    const tackPenaltyBase = 0.25;
    let potentialSpeed = 0;
    let idealSheet = 0;

    if (boat.tackCommitment) {
        potentialSpeed = currentWindSpeed * tackPenaltyBase;
        const angleDiff = boat.targetRelativeWind - relativeWind;
        boat.heading += Math.sign(angleDiff) * 2.0;
        if (Math.abs(angleDiff) < 2) boat.tackCommitment = false;
    } else if (inNoGoZone || isLuffing) {
        potentialSpeed = 0;
        boat.boomAngle = -relativeWind;
        if (boat.sailLuffing) boat.sailLuffing.style.display = 'block';
    } else {
        // Polar Speed
        const polar = getPolarSpeedAndSheet(absRel);
        const windScale = currentWindSpeed / 10;
        potentialSpeed = polar.speed * windScale;
        idealSheet = polar.sheet;

        // Sheet efficiency
        const sheetError = Math.abs(boat.sheetAngle - idealSheet);
        const trimTolerance = 18;
        let sheetEfficiency = Math.exp(-Math.pow(sheetError / trimTolerance, 2));
        sheetEfficiency = Math.max(0.25, sheetEfficiency);

        // Drag and Penalties
        const dragCoeff = 0.01;
        const drag = dragCoeff * boat.speed * boat.speed;
        potentialSpeed = Math.max(0, potentialSpeed - drag);
        
        const turnPenalty = 1 - Math.abs(boat.tillerAngle) / turnDragFactor;
        
        // APPLY ALL EFFICIENCIES
        potentialSpeed *= sheetEfficiency * turnPenalty * tuneEfficiency;

        boat.boomAngle = onPortTack ? boat.sheetAngle : -boat.sheetAngle;
        if (boat.sailLuffing) boat.sailLuffing.style.display = 'none';
    }

    // 6. Inertia
    const inertiaRate = potentialSpeed > boat.speed ? 0.015 : 0.04;
    boat.speed += (potentialSpeed - boat.speed) * inertiaRate;

    // 7. VISUAL SAIL SHAPE MORPHING
    // Outhaul affects length (clewY), Vang/Downhaul affect the "Belly" (depth)
    const clewY = 90 + outhaulVal * 3; 
    // A tight Vang (-2) reduces the belly, making the sail look flatter
    const bellyBase = -30;
    const tuningFlattening = (vangVal * 4) + (downhaulVal * 2);
    const currentBelly = bellyBase - (outhaulVal * 4) + tuningFlattening;

    let pathString = "";
    if (onPortTack) {
        pathString = `M-2,0 L-2,${clewY} Q ${currentBelly},65 2,0 Z`;
        boat.sailStarboardTack.setAttribute('d', pathString);
    } else {
        pathString = `M2,0 L2,${clewY} Q ${-currentBelly},65 2,0 Z`;
        boat.sailPortTack.setAttribute('d', pathString);
    }

    // 8. Visibility Toggle
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
        pathString = `M 0,0 L 0,${clewY.toFixed(1)} Q 20,40 -20,60 Q 25,70 0,0 Z`;
        boat.sailLuffing.setAttribute('d', pathString);
    }
}