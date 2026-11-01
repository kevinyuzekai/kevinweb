/* KevinWeb — liquid glass specular light.
   Tracks the pointer over glass surfaces and moves their highlight.
   Purely decorative: the page is complete without this file. */
(function () {
  if (!window.matchMedia) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover)').matches) return;

  var SEL = '.btn, .hero-meta, .platforms, .ap-card, .pd-meta, .pd-list li';
  var target = null, px = 0, py = 0, raf = 0;

  function paint() {
    raf = 0;
    if (!target) return;
    var r = target.getBoundingClientRect();
    target.style.setProperty('--gx', ((px - r.left) / r.width * 100).toFixed(1) + '%');
    target.style.setProperty('--gy', ((py - r.top) / r.height * 100).toFixed(1) + '%');
  }

  document.addEventListener('pointermove', function (e) {
    var el = e.target && e.target.closest ? e.target.closest(SEL) : null;
    if (!el) return;
    target = el;
    px = e.clientX;
    py = e.clientY;
    if (!raf) raf = requestAnimationFrame(paint);
  }, { passive: true });
})();
