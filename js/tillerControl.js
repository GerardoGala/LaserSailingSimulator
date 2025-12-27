// js/tillerControl.js
console.log("tillerControl.js loading (Standardized Attribute Logic)…");

/**
 * Helper to update the tiller attribute and boat object simultaneously
 */
function updateTillerAttr(angle) {
    const tiller = document.getElementById('tillerControl');
    if (tiller) {
        tiller.setAttribute('data-angle', angle.toString());
    }
    if (window.playerBoat) {
        window.playerBoat.tillerAngle = angle;
    }
}

// Helper to shift heading
const shiftHeading = (delta) => {
    const boat = window.playerBoat;
    
    if (boat) {
        boat.heading = (boat.heading + delta + 360) % 360;
        
        // Reset the tiller to center (0) using our new attribute standard
        updateTillerAttr(0);

        console.log(`Course changed by ${delta}°. New Heading: ${Math.round(boat.heading)}°`);
    } else {
        console.error("Critical: playerBoat object not found in window!");
    }
};

// Explicitly attach to window
window.snapHeading = function(val) { shiftHeading(val); };
window.adjustHeading = function(val) { shiftHeading(val); };

window.executeTack = function() {
    const boat = window.playerBoat;
    const windDir = window.currentWind || 0; 
    const targetAngle = 45; 

    if (boat) {
        let relativeWind = (windDir - boat.heading + 360) % 360;

        if (relativeWind < 180) {
            // From Starboard to Port
            boat.heading = (windDir + targetAngle) % 360;
        } else {
            // From Port to Starboard
            boat.heading = (windDir - targetAngle + 360) % 360;
        }

        // Center tiller after maneuver
        updateTillerAttr(0);

        console.log(`Tacked to optimal heading: ${Math.round(boat.heading)}°`);
    }
};

window.executeGybe = function() {
    const boat = window.playerBoat;
    const windDir = window.currentWind || 0;

    if (boat) {
        let relativeWind = (windDir - boat.heading + 360) % 360;
        // Gybe by shifting 90 degrees relative to course
        if (relativeWind < 180) {
            shiftHeading(-90);
        } else {
            shiftHeading(90);
        }
    }
};

// Initial state setup
document.addEventListener('DOMContentLoaded', () => {
    updateTillerAttr(0);
});