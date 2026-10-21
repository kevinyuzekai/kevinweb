/* KevinWeb gravity letters — self-written (no library). Tap/click drops a letter, hold to pour,
   mouse can drag letters. Field is cleared on any page change (pagehide, bfcache restore,
   hashchange, popstate, language switch). */
(function () {
  var field = document.getElementById('kw-grav'); if (!field) return;
  var cv = field.querySelector('canvas'), ctx = cv.getContext('2d');
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var POOL = 'KEVINWEBABCDEFGHJLMNOPRSTUXYZ', COLORS = ['#f2f2f2', '#c9b48a', '#8f7a52', '#e8e2d6'];
  var MAX = 90, G = 2200, b = [], W = 0, H = 0, dpr = 1, raf = 0, visible = false, last = 0, pour = 0, pt = null, drag = null, intro = [];
  function size() {
    var r = field.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    b.forEach(function (o) { o.x = Math.min(Math.max(o.x, o.r), W - o.r); o.y = Math.min(o.y, H - o.r); o.px = o.x; o.py = o.y; });
    if (RM) draw();
  }
  function add(x, y, ch) {
    var s = (W < 500 ? 30 : 42) * (0.85 + Math.random() * 0.35), r = s * 0.5;
    var o = { ch: ch || POOL[(Math.random() * POOL.length) | 0], r: r, s: s, x: Math.min(Math.max(x, r), W - r), y: y, a: (Math.random() - .5) * .6, va: 0,
      c: COLORS[(Math.random() * COLORS.length) | 0], fade: 1, dying: false };
    o.px = o.x + (Math.random() - .5) * 2; o.py = o.y - 2;
    if (RM) { o.y = H - r - (b.length % 5) * r * 2; o.px = o.x; o.py = o.y; }
    b.push(o);
    var live = b.filter(function (q) { return !q.dying; });
    if (live.length > MAX) live[0].dying = true;
    if (RM) draw(); else start();
  }
  function clear() { b.length = 0; pour = 0; drag = null; intro.forEach(clearTimeout); intro = []; if (ctx) ctx.clearRect(0, 0, W, H); }
  function step(dt) {
    var i, j, o, q;
    for (i = 0; i < b.length; i++) {
      o = b[i]; if (o === drag) continue;
      var vx = (o.x - o.px) * 0.995, vy = (o.y - o.py) * 0.995;
      o.px = o.x; o.py = o.y; o.x += vx; o.y += vy + G * dt * dt;
      o.a += o.va; o.va *= 0.96;
    }
    for (var it = 0; it < 4; it++) {
      for (i = 0; i < b.length; i++) {
        o = b[i];
        for (j = i + 1; j < b.length; j++) {
          q = b[j]; var dx = q.x - o.x, dy = q.y - o.y, m = o.r + q.r, d2 = dx * dx + dy * dy;
          if (d2 > 0 && d2 < m * m) {
            var d = Math.sqrt(d2), k = (m - d) / d * 0.5, wo = o === drag ? 0 : 1, wq = q === drag ? 0 : 1, t = wo + wq || 1;
            o.x -= dx * k * wo * 2 / t; o.y -= dy * k * wo * 2 / t; q.x += dx * k * wq * 2 / t; q.y += dy * k * wq * 2 / t;
            var sp = (dx * (q.py - o.py) - dy * (q.px - o.px)) / (d * 400); o.va += sp; q.va -= sp;
          }
        }
        if (o.y > H - o.r) { var v = o.y - o.py; o.y = H - o.r; o.py = o.y + v * 0.35; o.va += (o.x - o.px) / (o.r * 8); o.px = o.x - (o.x - o.px) * 0.8; }
        if (o.x < o.r) { o.x = o.r; o.px = o.x + (o.x - o.px) * 0.4; }
        if (o.x > W - o.r) { o.x = W - o.r; o.px = o.x + (o.x - o.px) * 0.4; }
      }
    }
    for (i = b.length - 1; i >= 0; i--) if (b[i].dying && (b[i].fade -= dt * 2.5) <= 0) b.splice(i, 1);
  }
  function draw() {
    ctx.clearRect(0, 0, W, H); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (var i = 0; i < b.length; i++) {
      var o = b[i]; ctx.save(); ctx.globalAlpha = Math.max(0, o.fade); ctx.translate(o.x, o.y); ctx.rotate(o.a);
      ctx.fillStyle = o.c; ctx.font = '700 ' + o.s.toFixed(1) + 'px Futura,"Avenir Next","Helvetica Neue",Arial,sans-serif';
      ctx.fillText(o.ch, 0, o.s * 0.04); ctx.restore();
    }
  }
  function frame(t) {
    raf = 0; if (!visible || document.hidden) return;
    var dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
    if (pour && pt && (pour += dt) > 0.32) { add(pt.x + (Math.random() - .5) * 10, pt.y, null); pour = 0.25; }
    var n = Math.max(1, Math.round(dt * 60)); for (var i = 0; i < n; i++) step(1 / 60);
    draw(); raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf && visible && !document.hidden && !RM) { last = 0; raf = requestAnimationFrame(frame); } }
  function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function hit(p) { for (var i = b.length - 1; i >= 0; i--) { var o = b[i], dx = p.x - o.x, dy = p.y - o.y; if (dx * dx + dy * dy < o.r * o.r * 1.4) return o; } return null; }
  var down = null;
  cv.addEventListener('pointerdown', function (e) {
    var p = pos(e); down = { x: e.clientX, y: e.clientY, t: e.pointerType, moved: false };
    if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
      var o = hit(p); if (o && !RM) { drag = o; cv.setPointerCapture(e.pointerId); return; }
      pt = p; pour = 0.01; add(p.x, p.y, null); start();
    }
  });
  cv.addEventListener('pointermove', function (e) {
    var p = pos(e);
    if (down && Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 8) down.moved = true;
    if (drag) { drag.px = drag.x; drag.py = drag.y; drag.x = p.x; drag.y = p.y; } else if (pour) pt = p;
  });
  function up(e) {
    if (drag) { drag = null; } /* released letter keeps its last velocity (px/py) */
    pour = 0;
    if (down && down.t === 'touch' && !down.moved && e.type === 'pointerup') { add(pos(e).x, pos(e).y, null); }
    down = null;
  }
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  /* touch: pan-y on the canvas keeps vertical page scroll; scrolling fires pointercancel so no letter is dropped */
  function seed() {
    clear(); var w = 'KEVINWEB', x0 = W / 2 - (w.length - 1) * 22;
    w.split('').forEach(function (c, i) { intro.push(setTimeout(function () { add(x0 + i * 44, -40 - i * 6, c); }, RM ? 0 : i * 110)); });
  }
  var seeded = false;
  new IntersectionObserver(function (es) {
    visible = es[0].isIntersecting;
    if (visible && !seeded) { seeded = true; size(); seed(); }
    if (visible) start();
  }, { threshold: 0.15 }).observe(field);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
  addEventListener('resize', function () { size(); });
  /* page change => nothing carries over */
  function reset() { clear(); seeded = false; }
  addEventListener('pagehide', reset);
  addEventListener('pageshow', function (e) { if (e.persisted) { reset(); visible = false; } });
  addEventListener('hashchange', reset); addEventListener('popstate', reset);
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href]'); if (a && !a.target && a.getAttribute('href')[0] !== '#') reset(); }, true);
  var lang = document.documentElement.lang;
  new MutationObserver(function () { if (document.documentElement.lang !== lang) { lang = document.documentElement.lang; reset(); if (visible) { seeded = true; seed(); } } })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  window.__kwGrav = { count: function () { return b.length; } };
})();
