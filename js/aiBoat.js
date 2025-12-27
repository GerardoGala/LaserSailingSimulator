// js/aiBoat.js  ← FINAL VERSION
console.log("aiBoat.js loaded");

export const aiBoat = {
  el: null,
  x: 550,
  y: 450,
  angle: 45,

  init() {
    this.el = document.getElementById('aiBoat');
    if (!this.el) {
      console.debug("aiBoat SVG not in DOM yet – will retry");
      return false;
    }
    this.el.style.left = this.x + 'px';
    this.el.style.top  = this.y + 'px';
    this.el.style.transform = `translate(-50%,-50%) rotate(${this.angle}deg)`;
    console.log("AI boat ready");
    return true;
  },

  update() {
    if (!this.el) return;

    const t = performance.now();
    const bob = Math.sin(t * 0.0023) * 4;
    this.el.style.top = (450 + bob) + 'px';

    const aiTiller = Math.sin(t * 0.0011) * 25;
    const tiller = this.el.querySelector('#tillerGroup');
    if (tiller) tiller.setAttribute('transform', `translate(0,100) rotate(${aiTiller})`);

    this.angle = 45 + Math.sin(t * 0.0007) * 35;
    this.el.style.transform = `translate(-50%,-50%) rotate(${this.angle}deg)`;
  }
};