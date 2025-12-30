// js/main.js


// ===================================================================
// MODULE IMPORTS – Why they are split into two groups
// ===================================================================
//
// 1. SIDE-EFFECT IMPORTS
//    These files are imported ONLY to run their code immediately.
//    They set up event listeners, drag handlers, welcome screen logic, etc.
//    They do NOT export anything we need to use directly here.
//    We import them with just the path (no { }) because we only want the
//    "side effects" of running the file — nothing is assigned to a variable.
//
//    If we removed these lines, the controls would stop working and the
//    welcome screen wouldn't appear, even though no variable is "used".
//
import './startButton.js';      // Handles click on the big "Start!" button
import './tillerControl.js';    // updates data-angle
import './sheetControl.js';     // updates data-angle
import './fineTuneControls.js'; // updates data-angle

// 2. PURE MODULES
//    These files export specific objects or functions that we actually use
//    in this file (or elsewhere). We import the named exports with { }
//    so we can reference them (e.g., playerBoat.update(), raceTimer.start()).
//    These do NOT run major setup code on import — they just provide data/tools.
//
import { environment } from './environment.js';
import { aiBoat } from './aiBoat.js';
import { playerBoat } from './playerBoat.js';
import { raceTimer } from './raceTimer.js';
import { game } from './game.js';

// Debug helper
window.debug = { environment, playerBoat, aiBoat, raceTimer, game, };

document.addEventListener('DOMContentLoaded', () => {
  const gameScreen    = document.getElementById('gameScreen');
  const okButton      = document.getElementById('okButton');
  const startButton   = document.getElementById('startButton');

  // Initialize environment SVG (background)
  const envSvg = document.getElementById('environment');
  environment.init(envSvg);

  // Start environment animation loop **once**
  function envLoop() {
    environment.draw();
    requestAnimationFrame(envLoop);
  }
  requestAnimationFrame(envLoop);



  // START Button: The actual "Engine Start" and 3-minute Countdown
  startButton.addEventListener('click', () => {
    console.log("Start button clicked! Beginning 3-minute mosey...");
    
    startButton.style.display = 'none';

    // 1. Initialize Boat Physics & SVG positions
    playerBoat.init();
    aiBoat.init();

    // 2. Start the Pre-Race Logic
    // This begins the 3-minute period for sail adjustment
    raceTimer.start(); // Assuming this handles the 180s countdown we discussed
    game.start();

    // 3. Start Boat Animation Loop (Physics now active)
    function boatLoop() {
      playerBoat.update();
      aiBoat.update();
      requestAnimationFrame(boatLoop);
    }
    requestAnimationFrame(boatLoop);
  });
});
