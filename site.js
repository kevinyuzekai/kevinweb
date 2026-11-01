/* KevinWeb — light theme interactions: hero entrance, scroll reveal,
   sticky header state, pointer tilt, and the pointer lens. Decorative only. */
(function () {
  var root = document.documentElement;
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hover = window.matchMedia && window.matchMedia('(hover: hover)').matches;

  /* the page-transition shutter holds the hero until it starts lifting,
     otherwise the opening animation plays behind the curtain */
  function start() { root.classList.add('ready'); }
  if (RM) {
    start();
  } else if (root.classList.contains('kw-trans-lock')) {
    document.addEventListener('kw:reveal', start, { once: true });
    setTimeout(start, 2800);
  } else {
    requestAnimationFrame(start);
  }

  var hdr = document.querySelector('.site-header');
  function onScroll() {
    var y = window.scrollY;
    if (hdr) hdr.classList.toggle('on', y > 12);
    root.classList.toggle('has-scrolled', y > 80);
    root.style.setProperty('--grid-y', (-y * 0.06).toFixed(1) + 'px');
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
    targets.forEach(function (el) {
      var group = el.parentElement;
      var sibs = group ? group.querySelectorAll(':scope > .reveal') : [];
      var idx = Array.prototype.indexOf.call(sibs, el);
      if (idx > -1 && idx < 6) el.style.setProperty('--d', (idx * 0.09).toFixed(2) + 's');
      io.observe(el);
    });
  } else {
    targets.forEach(function (el) { el.classList.add('in'); });
  }

  if (RM || !hover) return;

  /* pointer tilt on cards and screenshot windows */
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
      });
    });
    card.addEventListener('pointerleave', function () {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--lift', '0px');
    });
  });

  /* the hero leans towards the pointer, and the lens translates what it covers */
  var copy = document.querySelector('.hero-copy');
  if (!copy) return;
  var lens = copy.querySelector('.lens');
  var hraf = 0;
  window.addEventListener('pointermove', function (e) {
    if (hraf) return;
    hraf = requestAnimationFrame(function () {
      hraf = 0;
      var r = copy.getBoundingClientRect();
      var px = (e.clientX - window.innerWidth / 2) / window.innerWidth;
      var py = (e.clientY - r.top) / Math.max(r.height, 1) - 0.5;
      copy.style.setProperty('--tilt-y', (px * 11).toFixed(2) + 'deg');
      copy.style.setProperty('--tilt-x', (-py * 8).toFixed(2) + 'deg');
      copy.style.setProperty('--move-x', (px * 16).toFixed(1) + 'px');
      copy.style.setProperty('--move-y', (py * 10).toFixed(1) + 'px');
      if (!lens) return;
      var inside = e.clientX >= r.left && e.clientX <= r.right &&
        e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) {
        lens.classList.remove('on');
        return;
      }
      lens.style.setProperty('--cx', ((e.clientX - r.left) / r.width * 100).toFixed(2) + '%');
      lens.style.setProperty('--cy', ((e.clientY - r.top) / r.height * 100).toFixed(2) + '%');
      lens.classList.add('on');
    });
  }, { passive: true });

  document.addEventListener('mouseleave', resetHero);
  function resetHero() {
    copy.style.setProperty('--tilt-x', '0deg');
    copy.style.setProperty('--tilt-y', '0deg');
    copy.style.setProperty('--move-x', '0px');
    copy.style.setProperty('--move-y', '0px');
    if (lens) lens.classList.remove('on');
  }
})();
