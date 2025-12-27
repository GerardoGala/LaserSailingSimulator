// js/fineTuneControls.js

let vangDisplay, downhaulDisplay, outhaulDisplay;

function initFineTuneControls() {
    vangDisplay = document.getElementById("vangValue");
    downhaulDisplay = document.getElementById("downhaulValue");
    outhaulDisplay = document.getElementById("outhaulValue");
}

window.updateControl = function(type, change) {
    let display;
    if (type === 'vang') display = vangDisplay;
    else if (type === 'downhaul') display = downhaulDisplay;
    else if (type === 'outhaul') display = outhaulDisplay;

    if (!display) return;

    let current = parseInt(display.getAttribute(`data-${type}`) || "0");
    
    // Clamp between -2 (Tight) and +2 (Loose)
    let newValue = Math.max(-2, Math.min(2, current + change));

    display.setAttribute(`data-${type}`, newValue);
    display.textContent = newValue === 0 ? "0" : (newValue > 0 ? `+${newValue}` : newValue);

    // Visual Cue: Negative (Tight/Red), Positive (Loose/Blue)
    display.style.fill = newValue < 0 ? "#dc143c" : (newValue > 0 ? "#007bff" : "#333");
};

document.addEventListener('DOMContentLoaded', initFineTuneControls);