// js/main.js

// ===================================================================
// MODULE IMPORTS
// ===================================================================

// 1. SIDE-EFFECT IMPORTS (setup event listeners, controls, etc.)
import './startButton.js';
import './tillerControl.js';
import './sheetControl.js';
import './fineTuneControls.js';

// 2. PURE MODULES (export objects/functions we use here)
import { sea } from './sea.js';
import { wind } from './wind.js';
import { aiBoat } from './aiBoat.js';
import { playerBoat } from './playerBoat.js';
import { raceTimer } from './raceTimer.js';
import { game } from './game.js';

// Debug helper
window.debug = { sea, playerBoat, aiBoat, raceTimer, game, wind };

document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('startButton');

  // NEW: The sea background is now a <g> inside the main world SVG
  // Your sea.js should draw waves into this group instead of a separate #sea SVG
  const seaBackground = document.getElementById('sea-background');
  sea.init(seaBackground);

  // Start environment animation loop (waves, wind effects)
  function envLoop() {
    sea.draw();
    requestAnimationFrame(envLoop);
  }
  requestAnimationFrame(envLoop);

  // START Button: Begin the race
  startButton.addEventListener('click', () => {
    console.log("Start button clicked! Beginning 3-minute mosey...");

    startButton.style.display = 'none';

    // 1. Initialize boat physics and positions in the new world coordinates
    playerBoat.init();
    aiBoat.init();
    wind.init();

    // 2. Start race timer and game logic
    raceTimer.start();
    game.start();

    // 3. Start boat physics/animation loop
    function boatLoop() {
      playerBoat.update();
      aiBoat.update();
      requestAnimationFrame(boatLoop);
    }
    requestAnimationFrame(boatLoop);
  });
});