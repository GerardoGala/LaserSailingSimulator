// js/game.js
console.log("game.js loaded (module script) — Frame-based edition");

let playerBoat = null;
let aiBoat = null;
let raceTimer = null;
let sea = null;

let lastLoggedHeading = null;

// Global flag for OCS check
let startSignalFired = false;

// Current race leg — this drives frame advance direction
let currentLeg = 'upwind'; // 'upwind' or 'downwind'

export async function startGame() {
  console.log("startGame() called → lazy-loading all modules...");

  try {
    const [
      playerMod,
      aiMod,
      timerMod,
      envMod
    ] = await Promise.all([
      import('./playerBoat.js'),
      import('./aiBoat.js'),
      import('./raceTimer.js'),
      import('./sea.js')
    ].map(p => p.catch(() => ({}))));

    playerBoat     = playerMod.playerBoat     || playerMod.default || {};
    aiBoat         = aiMod.aiBoat             || aiMod.default || {};
    raceTimer      = timerMod.raceTimer       || timerMod.default || {};
    sea    = envMod.sea       || envMod.default || {};

    console.log("All game modules loaded successfully!");

    await import('./tillerControl.js');
    await import('./mainsheetControl.js');

    // Expose race starter
    window.beginRace = () => {
      console.log("Start Racing! button clicked → race begins!");
      document.getElementById('startButtonDiv').style.display = 'none';

      // Reset state
      startSignalFired = false;
      currentLeg = 'upwind';
      sea.currentLeg = 'upwind'; // sync with sea if needed
      sea.currentFrameCenter = 0;
      sea.boatRelativeY = 0;
      sea.updateKnotLinesDisplay();

      raceTimer.start();
      requestAnimationFrame(mainLoop);
    };

    const startBtn = document.getElementById('startButton');
    if (startBtn) {
      startBtn.addEventListener('click', window.beginRace, { once: true });
    }

  } catch (err) {
    console.error("Critical failure in lazy loading:", err);
  }
}

// Main animation loop
function mainLoop(timestamp) {
  const deltaTime = timestamp - (mainLoop.lastTime || timestamp);
  mainLoop.lastTime = timestamp;

  // 1. Update player (controls → heading, sheet → speed, physics)
  playerBoat.update?.(timestamp, deltaTime);

  // 2. Update AI
  aiBoat.update?.(timestamp, deltaTime);


  // 5. Debug logging (heading changes)
  if (lastLoggedHeading === null || Math.abs(playerBoat.heading - lastLoggedHeading) > 0.1) {
    console.log(`Heading: ${playerBoat.heading.toabsolute(1)}°`);
    lastLoggedHeading = playerBoat.heading;
  }

  // 6. OCS check at T=0:00
  if (!startSignalFired && raceTimer.getElapsed?.() >= 0) {
    startSignalFired = true;
  }

  // 7. Check for finish (downwind leg crossing 0.00 downward)
  if (currentLeg === 'downwind' && sea.currentFrameCenter <= 0 &&
      sea.boatRelativeY <= 0) {
    console.log("🏁 FINISHED! Player crossed the finish line!");
    // TODO: trigger finish animation, sound, results screen
    // For now, just stop the loop or show message
    return; // or set a finished flag
  }

  requestAnimationFrame(mainLoop);
}
mainLoop.lastTime = 0;

// ──────────────────────────────────────────────────────────────
// Public exports
// ──────────────────────────────────────────────────────────────
export const game = {
  start: startGame,

  // Manual leg switch for testing (call from console)
  switchToDownwind() {
    currentLeg = 'downwind';
    sea.currentLeg = 'downwind';
    console.log("🌀 Switched to DOWNWIND leg — numbers now count down!");
  },

  switchToUpwind() {
    currentLeg = 'upwind';
    sea.currentLeg = 'upwind';
    console.log("⬆️ Switched to UPWIND leg");
  }
};

console.log("game.js ready — waiting for Start Racing!");