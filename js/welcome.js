/* global anime */
// js/welcome.js
console.log("welcome.js loaded");

document.addEventListener('DOMContentLoaded', () => {
  const welcomeScreen = document.getElementById('welcomeScreen');
  const gameScreen    = document.getElementById('gameScreen');
  const okBtn         = document.getElementById('okButton');
  const checkbox      = document.getElementById('hideWelcome');

  const initChapterAnimations = () => {
    if (typeof anime === 'undefined') {
      console.warn("Anime.js not loaded yet.");
      return;
    }

    const radioButtons = document.querySelectorAll('input[name="chapters"]');
    // Track the currently active radio to allow toggling
    let lastChecked = document.querySelector('input[name="chapters"]:checked');
    
    
    radioButtons.forEach((radio) => {
      radio.addEventListener('click', function() {
        const allTexts = document.querySelectorAll('.chapter-text');
        const selectedText = this.parentElement.querySelector('.chapter-text');

        // IF we click the one that's already open: CLOSE IT
        if (lastChecked === this) {
          this.checked = false;
          lastChecked = null;

          anime({
            targets: selectedText,
            height: 0,
            opacity: 0,
            paddingTop: 0,
            paddingBottom: 0,
            duration: 400,
            easing: 'easeInOutQuad'
          });
          return;
        }

        lastChecked = this;

        // Close all others
        anime({
          targets: Array.from(allTexts).filter(t => t !== selectedText),
          height: 0,
          opacity: 0,
          paddingTop: 0,
          paddingBottom: 0,
          duration: 400,
          easing: 'easeInOutQuad'
        });

        // Open selected to its NATURAL height (no more 250px cap)
        anime({
          targets: selectedText,
          height: function(el) {
            return el.scrollHeight + 30; // 30 is for the top/bottom padding
          },
          opacity: 1,
          paddingTop: 15,
          paddingBottom: 15,
          duration: 600,
          easing: 'easeOutQuart'
        });
      });
    });

    // Initial state
    if (lastChecked) {
      const text = lastChecked.parentElement.querySelector('.chapter-text');
      text.style.height = '250px';
      text.style.opacity = '1';
      text.style.padding = '15px';
    }
  };

  const launchGame = async () => {
    welcomeScreen.classList.add('hidden');
    gameScreen.style.display = 'block';
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    console.log("Game launched");
  };

  if (localStorage.getItem('hideWelcome') === 'true') {
    launchGame();
  } else {
    welcomeScreen.classList.remove('hidden');
    gameScreen.style.display = 'none';
    
    initChapterAnimations();

    okBtn.onclick = () => {
      if (checkbox && checkbox.checked) {
        localStorage.setItem('hideWelcome', 'true');
      }
      launchGame();
    };
  }
});

window.resetWelcome = () => {
  localStorage.removeItem('hideWelcome');
  const welcome = document.getElementById('welcomeScreen');
  const game = document.getElementById('gameScreen');
  if (welcome) welcome.classList.remove('hidden');
  if (game) game.style.display = 'none';
  console.log("Welcome screen reset");
};