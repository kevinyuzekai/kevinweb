/* KevinWeb — light theme interactions: display reveal, scroll reveal,
   sticky bar state, pointer tilt, hero 3-D follow. Decorative only. */
(function () {
  var root = document.documentElement;
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hover = window.matchMedia && window.matchMedia('(hover: hover)').matches;

  /* the page-transition shutter holds the page until it starts lifting,
     otherwise the opening animation plays behind the curtain */
  function start() {
    root.classList.add('ready');
    setupReveal();
  }
  if (RM) {
    start();
  } else if (root.classList.contains('kw-trans-lock')) {
    document.addEventListener('kw:reveal', start, { once: true });
    setTimeout(start, 2800);
  } else {
    requestAnimationFrame(start);
  }

  var bar = document.querySelector('.bar');
  function onScroll() {
    var y = window.scrollY;
    if (bar) bar.classList.toggle('on', y > 12);
    root.classList.toggle('has-scrolled', y > 80);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function setupReveal() {
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
        if (idx > -1 && idx < 6) el.style.setProperty('--d', (idx * 0.08).toFixed(2) + 's');
        io.observe(el);
      });
    } else {
      targets.forEach(function (el) { el.classList.add('in'); });
    }
  }

  if (RM || !hover) return;

  /* pointer tilt on cards */
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

  /* the hero copy leans towards the pointer, like pidanai's stage */
  var copy = document.querySelector('.hero-copy');
  if (!copy) return;
  var hraf = 0;
  window.addEventListener('pointermove', function (e) {
    if (hraf) return;
    hraf = requestAnimationFrame(function () {
      hraf = 0;
      var r = copy.getBoundingClientRect();
      var px = (e.clientX - window.innerWidth / 2) / window.innerWidth;
      var py = (e.clientY - r.top) / Math.max(r.height, 1) - 0.5;
      copy.style.setProperty('--hy', (px * 5).toFixed(2) + 'deg');
      copy.style.setProperty('--hx', (-py * 4).toFixed(2) + 'deg');
      copy.style.setProperty('--hdx', (px * 10).toFixed(1) + 'px');
      copy.style.setProperty('--hdy', (py * 6).toFixed(1) + 'px');
    });
  }, { passive: true });

  document.addEventListener('mouseleave', resetHero);
  function resetHero() {
    copy.style.setProperty('--hx', '0deg');
    copy.style.setProperty('--hy', '0deg');
    copy.style.setProperty('--hdx', '0px');
    copy.style.setProperty('--hdy', '0px');
  }
})();
