// js/mainsheetControl.js
console.log("mainsheetControl.js loading…");

const ready = () => {
  const mainsheet = document.getElementById('mainsheetControl');
  if (!mainsheet) return false;

  const knob = mainsheet.querySelector('#sheetKnob');
  if (!knob) {
    console.error("mainsheetControl: <circle id=\"sheetKnob\"> not found!");
    return false;
  }

  let dragging = false;

  // Mapping: y=360 → 0° (sheeted in), y=40 → 90° (sheeted out)
  const yMin = 40;
  const yMax = 360;

  const update = (clientY) => {
    const rect = mainsheet.getBoundingClientRect();
    const y = clientY - rect.top;
    const clamped = Math.max(yMin, Math.min(yMax, y));

    // Compute angle relative to boat (0 = tight, 90 = eased)
    const mainsheetEase = Math.round(90 * (yMax - clamped) / (yMax - yMin));
    mainsheet.dataset.angle = mainsheetEase;

    // Move knob
    knob.cy.baseVal.value = clamped;

    mainsheet.dispatchEvent(new CustomEvent('sheetchange', { detail: mainsheetEase }));
    console.log("mainsheetEase:", mainsheetEase);
  };

  const start = (e) => {
    dragging = true;
    mainsheet.setPointerCapture(e.pointerId);
    mainsheet.style.cursor = 'grabbing';
    update(e.clientY);
    e.preventDefault();
  };

  const move = (e) => {
    if (dragging) update(e.clientY);
  };

  const stop = () => {
    dragging = false;
    mainsheet.style.cursor = 'grab';
    // Sheet stays where you leave it — like real life
  };

  mainsheet.addEventListener('pointerdown', start);
  mainsheet.addEventListener('pointermove', move);
  mainsheet.addEventListener('pointerup', stop);
  mainsheet.addEventListener('pointercancel', stop);
  mainsheet.addEventListener('pointerleave', stop);

  // Initialize knob at 45°
  const initialAngle = 45;
  const clampedY = yMax - (initialAngle / 90) * (yMax - yMin);
  knob.cy.baseVal.value = clampedY;
  mainsheet.dataset.angle = initialAngle;
  mainsheet.dispatchEvent(new CustomEvent('sheetchange', { detail: initialAngle }));

  console.log("mainsheetControl fully ready – drives anime.js boom perfectly");
  return true;
};

if (!ready()) {
  document.addEventListener('DOMContentLoaded', ready);
}
