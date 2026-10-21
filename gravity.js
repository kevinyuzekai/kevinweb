/* KevinWeb gravity letters — self-written verlet solver, no library.
   Click/tap anywhere (not on links/buttons/inputs) drops one letter at that point; letters fall to the
   bottom of the viewport and pile up. Mouse/pen can drag & fling a letter (JS hit-test, overlay itself is
   pointer-events:none). Cleared on pagehide, bfcache restore, hashchange, popstate, link navigation, language switch. */
(function () {
  var cv = document.createElement('canvas'); cv.className = 'kw-grav-layer'; cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  var ctx = cv.getContext('2d');
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var POOL = 'KEVINWEBABCDEFGHJLMNOPRSTUXYZ', COLORS = ['#f2f2f2', '#c9b48a', '#8f7a52', '#e8e2d6'];
  var MAX = 80, G = 2200, b = [], W = 0, H = 0, dpr = 1, raf = 0, last = 0, drag = null, dragMoved = false, quiet = 0;
  var SKIP = 'a,button,input,select,textarea,label,summary,[role=button],[contenteditable],ms-store-badge,.kw-lang';
  function size() {
    dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    b.forEach(function (o) { o.x = Math.min(Math.max(o.x, o.r), W - o.r); o.y = Math.min(o.y, H - o.r); o.px = o.x; o.py = o.y; });
    draw(); start();
  }
  function add(x, y) {
    if (!W) size();
    var s = (W < 600 ? 30 : 40) * (0.85 + Math.random() * 0.35), r = s * 0.5;
    var o = { ch: POOL[(Math.random() * POOL.length) | 0], r: r, s: s, x: Math.min(Math.max(x, r), W - r), y: Math.min(y, H - r),
      a: (Math.random() - .5) * .6, va: 0, c: COLORS[(Math.random() * COLORS.length) | 0], fade: 1, dying: false };
    o.px = o.x + (Math.random() - .5) * 2; o.py = o.y - 2;
    b.push(o);
    var live = b.filter(function (q) { return !q.dying; }); if (live.length > MAX) live[0].dying = true;
    if (RM) { for (var i = 0; i < 240; i++) step(1 / 60); b.forEach(function (q) { q.px = q.x; q.py = q.y; q.va = 0; }); }
    draw(); start();
  }
  function clear() { b.length = 0; drag = null; if (ctx) ctx.clearRect(0, 0, W, H); }
  function step(dt) {
    var i, j, o, q;
    for (i = 0; i < b.length; i++) {
      o = b[i]; if (o === drag) continue;
      var vx = (o.x - o.px) * 0.995, vy = (o.y - o.py) * 0.995;
      o.px = o.x; o.py = o.y; o.x += vx; o.y += vy + G * dt * dt; o.a += RM ? 0 : o.va; o.va *= 0.96;
    }
    for (var it = 0; it < 4; it++) for (i = 0; i < b.length; i++) {
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
  function energy() { var e = 0; for (var i = 0; i < b.length; i++) { var o = b[i]; e += Math.abs(o.x - o.px) + Math.abs(o.y - o.py) + Math.abs(o.va) * 10 + (o.dying ? 9 : 0); } return e; }
  function frame(t) {
    raf = 0; if (document.hidden || !b.length) return;
    var dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
    var n = Math.max(1, Math.round(dt * 60)); for (var i = 0; i < n; i++) step(1 / 60);
    draw();
    quiet = (!drag && energy() < 0.05 * b.length + 0.01) ? quiet + 1 : 0;
    if (quiet < 30) raf = requestAnimationFrame(frame); /* idle when the pile has settled */
  }
  function start() { quiet = 0; if (!raf && !document.hidden && b.length && !RM) { last = 0; raf = requestAnimationFrame(frame); } }
  function hit(x, y) { for (var i = b.length - 1; i >= 0; i--) { var o = b[i], dx = x - o.x, dy = y - o.y; if (!o.dying && dx * dx + dy * dy < o.r * o.r) return o; } return null; }
  /* touch taps: iOS Safari doesn't fire "click" on non-interactive elements, so detect the tap ourselves.
     A scroll gesture moves the finger / fires pointercancel, so it never drops a letter. */
  var tdown = null, lastTouch = 0;
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') { tdown = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId }; return; }
    if (RM || e.button !== 0) return;
    var o = hit(e.clientX, e.clientY); if (!o) return;
    drag = o; dragMoved = false; e.preventDefault(); start(); /* no text selection while dragging */
  });
  addEventListener('pointermove', function (e) {
    if (!drag) return; dragMoved = true; drag.px = drag.x; drag.py = drag.y;
    drag.x = Math.min(Math.max(e.clientX, drag.r), W - drag.r); drag.y = Math.min(e.clientY, H - drag.r);
  });
  function release() { if (drag) { drag = null; start(); } }
  addEventListener('pointerup', function (e) {
    release();
    if (e.pointerType !== 'touch' || !tdown || tdown.id !== e.pointerId) return;
    var d = tdown; tdown = null;
    if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 10 || Date.now() - d.t > 600) return;
    var t = e.target; if (t && t.closest && t.closest(SKIP)) return;
    lastTouch = Date.now(); add(e.clientX, e.clientY);
  });
  addEventListener('pointercancel', function () { tdown = null; release(); });
  /* "click" fires for mouse clicks, trackpad taps and touch taps, but never after a scroll gesture */
  document.addEventListener('click', function (e) {
    if (dragMoved) { dragMoved = false; return; }
    if (Date.now() - lastTouch < 800 || e.pointerType === 'touch') return; /* already handled on pointerup */
    if (e.button !== 0 || e.defaultPrevented) return;
    var t = e.target; if (t && t.closest && t.closest(SKIP)) return;
    if (getSelection && String(getSelection()).length) return;
    add(e.clientX, e.clientY);
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
  addEventListener('resize', size);
  function reset() { clear(); }
  addEventListener('pagehide', reset);
  addEventListener('pageshow', function (e) { if (e.persisted) reset(); });
  addEventListener('hashchange', reset); addEventListener('popstate', reset);
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href]'); if (a && !a.target && a.getAttribute('href')[0] !== '#') reset(); }, true);
  var lang = document.documentElement.lang;
  new MutationObserver(function () { if (document.documentElement.lang !== lang) { lang = document.documentElement.lang; reset(); } })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  size();
  window.__kwGrav = { count: function () { return b.length; } };
})();
