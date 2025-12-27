// js/startButton.js
console.log("startButton.js loaded");

// Assuming 'raceTimer' is either imported here or defined globally (like 'game' seems to be)
// If raceTimer is not global, you MUST add: import { raceTimer } from './raceTimer.js';
// For now, I'll assume it's globally available or defined elsewhere, as your original code suggests.

import { game } from './game.js';

// --- REMOVED REDUNDANT addEventListener HERE ---
// document.getElementById('startButton').addEventListener('click', () => { ... });

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded – startButton.js is running");

  // Grab the button
  const startBtn = document.getElementById('startButton');
  
  // Assuming raceTimer is defined globally or imported correctly
  // const raceTimer = window.raceTimer; // Example if global

  // Safety check
  if (!startBtn) {
    console.error("startButton not found! Check the ID in HTML");
    return;
  }



// Attach the single, correct click handler
// Attach the single, correct click handler
startBtn.onclick = () => {
    console.log("'Start Racing!' button clicked → RACE STARTS NOW!");

    // ==========================================================
    // 1. FIX: SHOW THE TIMER CONTAINER (The one with the 'hide' class)
    // ==========================================================
    const raceTimerContainer = document.getElementById('raceTimer'); 

    if (raceTimerContainer) {
        // FIX: Remove the 'hide' class to make the whole styled container visible.
        raceTimerContainer.classList.remove('hide');
    } else {
        console.error("CRITICAL: The #raceTimer container element was not found in the DOM!");
    }
    // ==========================================================
    
    // 2. START THE RACE LOGIC
    // NOTE: For clarity, we assume the raceTimerContainer DOM element 
    //       or an associated JS object has the .start() method.
    if (typeof raceTimerContainer.start === 'function') {
      raceTimerContainer.start(); // This triggers the countdown logic (raceTimer.js:12)
    } else {
      console.warn("Timer component's .start() function not found. Countdown will not update.");
    }
    
    game.start();      // starts boats, wind, animation loop

    
    // 3. HIDE THE START BUTTON LOGIC (This part was already correct)
    // Smooth hide using the 'hide' class we defined in CSS
    startBtn.classList.add('hide');

    // Fully remove the button after the fade-out (0.6s transition time)
    setTimeout(() => {
      startBtn.remove();
    }, 600);
};


});

console.log("end of startButton.js");