/* KevinWeb — light theme interactions: display reveal, scroll reveal,
   sticky bar state, pointer tilt. Decorative only. */
(function () {
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  requestAnimationFrame(function () {
    document.documentElement.classList.add('ready');
  });

  var bar = document.querySelector('.bar');
  function onScroll() {
    if (!bar) return;
    bar.classList.toggle('on', window.scrollY > 12);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var targets = document.querySelectorAll('.reveal');
  if (!RM && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.15 });
    targets.forEach(function (el, i) {
      var group = el.parentElement;
      var sibs = group ? group.querySelectorAll(':scope > .reveal') : [];
      var idx = Array.prototype.indexOf.call(sibs, el);
      if (idx > -1 && idx < 4) el.style.setProperty('--d', (idx * 0.08).toFixed(2) + 's');
      io.observe(el);
    });
  } else {
    targets.forEach(function (el) { el.classList.add('in'); });
  }

  if (RM || !window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;

  Array.prototype.forEach.call(document.querySelectorAll('[data-tilt]'), function (card) {
    var raf = 0;
    card.addEventListener('pointermove', function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', ((px - 0.5) * 7).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - py) * 6).toFixed(2) + 'deg');
        card.style.setProperty('--lift', '-2px');
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
    });
    card.addEventListener('pointerleave', function () {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--lift', '0px');
    });
  });
})();
