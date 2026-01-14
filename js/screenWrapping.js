// --- EXECUTE ONCE: Configuration ---
const STEP = 0.2;
const WORLD_WIDTH = 600;
const WORLD_HEIGHT = 500;

/**
 * Handles the screen wrapping logic and knotline updates.
 * @param {Object} boat - The player boat instance
 */
export function updateScreen(boat) {
    // Vertical Wrapping (Top/Bottom)
    if (boat.y < 0) { 
        boat.y = WORLD_HEIGHT; 
        boat.updateVerticalKnotlines(STEP); 
    } 
    else if (boat.y > WORLD_HEIGHT) { 
        boat.y = 0; 
        boat.updateVerticalKnotlines(-STEP); 
    }

    // Horizontal Wrapping (Left/Right)
    if (boat.x > WORLD_WIDTH) { 
        boat.x = 0; 
        boat.updateHorizontalKnotlines(STEP); 
    } 
    else if (boat.x < 0) { 
        boat.x = WORLD_WIDTH; 
        boat.updateHorizontalKnotlines(-STEP); 
    }
}