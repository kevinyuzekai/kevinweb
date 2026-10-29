/* KevinWeb project detail pages — reveal on load / on scroll, plus a light parallax on screenshots.
   Everything here is optional polish: the page is readable and navigable with this file missing. */
(function () {
  var root = document.documentElement;
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready() { root.classList.add('pd-ready'); }

  if (RM) {
    root.classList.add('pd-ready');
  } else if (root.classList.contains('kw-trans-lock')) {
    /* the page-transition shutter holds the hero until it starts lifting */
    document.addEventListener('kw:reveal', ready, { once: true });
    setTimeout(ready, 2800);
  } else {
    ready();
  }

  var targets = document.querySelectorAll('.rv, .pd-sec, .pd-gallery .pd-fig');
  if (!('IntersectionObserver' in window) || RM) {
    [].forEach.call(targets, function (n) { n.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.14 });
    [].forEach.call(targets, function (n) { io.observe(n); });
  }

  if (RM) return;

  /* pointer-follow tilt + warm light inside the screenshot grid */
  var gallery = document.querySelector('.pd-gallery');
  if (gallery && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
    var fig = null;
    gallery.addEventListener('pointermove', function (e) {
      var f = e.target.closest ? e.target.closest('.pd-fig') : null;
      if (!f) return;
      fig = f;
      var r = f.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      f.style.setProperty('--ry', (px * 5).toFixed(2) + 'deg');
      f.style.setProperty('--rx', (-py * 4).toFixed(2) + 'deg');
      f.style.setProperty('--mx', ((px + 0.5) * 100).toFixed(1) + '%');
      f.style.setProperty('--my', ((py + 0.5) * 100).toFixed(1) + '%');
    }, { passive: true });
    gallery.addEventListener('pointerleave', function () {
      if (!fig) return;
      fig.style.removeProperty('--rx');
      fig.style.removeProperty('--ry');
      fig = null;
    });
  }

  var shots = [].slice.call(document.querySelectorAll('.pd-fig .shot'));
  if (!shots.length) return;

  var ticking = false;
  function paint() {
    ticking = false;
    if (window.innerWidth < 900) return;
    var vh = window.innerHeight;
    for (var i = 0; i < shots.length; i++) {
      var el = shots[i], r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      var k = (r.top + r.height / 2) / vh - 0.5;
      el.style.transform = 'translate3d(0,' + (k * -22).toFixed(1) + 'px,0)';
    }
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(paint);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  paint();
})();
