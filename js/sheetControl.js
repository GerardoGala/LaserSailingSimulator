// js/sheetControl.js
console.log("sheetControl.js loading (Pro-Tuned with Tape Marks)…");

const MAX_SHEET = 90; // Running / Dead Downwind
const MIN_SHEET = 20; // The "Secret" Tape Mark for Optimal Upwind

window.executeSheet90 = function() {
    updateSheetState(MAX_SHEET);
};

window.executeSheet20 = function() {
    updateSheetState(MIN_SHEET);
};

window.adjustSheet = function(amount) {
    const el = document.getElementById('sheetControl');
    if (!el) return;

    let current = parseInt(el.getAttribute('data-angle') || '20', 10);
    let newValue = current + amount;

    // Respecting the "Tape Mark" business rule
    if (newValue > MAX_SHEET) newValue = MAX_SHEET;
    if (newValue < MIN_SHEET) newValue = MIN_SHEET;

    updateSheetState(newValue);
};

function updateSheetState(angle) {
    const el = document.getElementById('sheetControl');
    if (el) {
        el.setAttribute('data-angle', angle.toString());
    }
    
    // Sync with the physics engine
    if (window.playerBoat) {
        window.playerBoat.sheetAngle = angle;
    }

    // Visual sail variables
    window.sailPortTack = angle;
    window.sailStarboardTack = -angle;

    // Optional: Log it for debugging the "Pro" settings
    // console.log(`Trim set to tape mark: ${angle}°`);
}