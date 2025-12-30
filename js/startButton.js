// js/startButton.js
import { raceTimer } from './raceTimer.js';
import { game } from './game.js';

console.log("startButton.js loaded");

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startButton');

  if (!startBtn) {
    console.error("Start button not found!");
    return;
  }

  startBtn.onclick = () => {
    console.log("Start button clicked");

    // 1. Hide the start button but keep the overlay div visible
    startBtn.style.display = 'none';

    // 2. Show and start the race timer
    raceTimer.start();

    // 3. Start the game logic
    game.start();
  };
});
