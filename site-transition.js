/* Site-wide page transition: five perspective louvers that sweep up and flip in.
   Enabled only when the visitor allows motion; every phase is transform/opacity. */
(function () {
  if (!window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var root = document.documentElement;
  var PANES = 5;
  var LEAVE_DUR = 420, LEAVE_GAP = 52;      /* out-going: cover the old page */
  var OUT_DUR = 540, OUT_GAP = 46;          /* in-coming: lift off the new page */
  var NAV_AT = 560;
  var MIN = 430, MAX = 2200;

  var t0 = Date.now(), overlay = null, leaving = false;

  var CSS = [
    '.kw-trans{position:fixed;inset:0;z-index:9999;overflow:hidden;perspective:1200px;pointer-events:auto;visibility:hidden}',
    '.kw-trans.on,.kw-trans.out{visibility:visible}',
    '.kw-trans-pane{position:absolute;top:-1px;bottom:-1px;background:#141414;box-shadow:inset 0 2px 0 rgba(201,180,138,.5);transform-origin:50% 100%;backface-visibility:hidden;will-change:transform;transform:translate3d(0,101%,0) rotateX(16deg);transition:transform var(--pdur,420ms) cubic-bezier(.7,0,.28,1) var(--pdel,0ms)}',
    '.kw-trans.flat .kw-trans-pane{transition:none;transform:translate3d(0,0,0) rotateX(0)}',
    '.kw-trans.on .kw-trans-pane{transform:translate3d(0,0,0) rotateX(0)}',
    '.kw-trans.out .kw-trans-pane{transform:translate3d(0,-101%,0) rotateX(-13deg)}',
    '.kw-trans.out .kw-trans-pane:nth-child(odd){transform:translate3d(-2.5%,-101%,0) rotateX(-13deg)}',
    '.kw-trans.out .kw-trans-pane:nth-child(even){transform:translate3d(2.5%,-101%,0) rotateX(-13deg)}',
    'html.kw-trans-lock,html.kw-trans-lock body{overflow:hidden}',
    '.kw-trans-cent{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;opacity:0;transition:opacity 240ms ease}',
    '.kw-trans.on .kw-trans-cent{opacity:1;transition-delay:calc(var(--pdur,380ms) * .55)}',
    '.kw-trans.out .kw-trans-cent{opacity:0;transition-duration:160ms;transition-delay:0ms}',
    '.kw-dots{--s:54px;--sp:2.5s;position:relative;width:var(--s);height:var(--s);animation:kwPaneSpin 7s linear infinite}',
    '.kw-dots i{position:absolute;inset:0;transform:rotate(calc(360deg / 6 * var(--i)))}',
    '.kw-dots i::before{content:"";position:absolute;top:0;left:50%;width:calc(var(--s) * .21);height:calc(var(--s) * .21);margin-left:calc(var(--s) * -.105);border-radius:50%;background:#f2f2f2;animation:kwPaneOrbit var(--sp) linear infinite;animation-delay:calc(var(--sp) / -6 * var(--i))}',
    '.kw-trans-word{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;letter-spacing:.42em;text-indent:.42em;text-transform:uppercase;color:#c6c6c6}',
    '@keyframes kwPaneSpin{to{transform:rotate(360deg)}}',
    '@keyframes kwPaneOrbit{0%{transform:scale(.5);opacity:.18}12%{transform:scale(1);opacity:1}100%{transform:scale(.5);opacity:.18}}',
    '@media (prefers-reduced-motion: reduce){.kw-trans-pane{transition:none}.kw-dots,.kw-dots i::before{animation:none}}'
  ].join('');

  function injectStyle() {
    var st = document.createElement('style');
    st.id = 'kw-trans-style';
    st.appendChild(document.createTextNode(CSS));
    (document.head || root).appendChild(st);
  }

  function create(instant) {
    var el = document.createElement('div');
    el.className = 'kw-trans';
    el.setAttribute('aria-hidden', 'true');

    for (var i = 0; i < PANES; i++) {
      var p = document.createElement('div');
      p.className = 'kw-trans-pane';
      p.style.left = (i * 20) + '%';
      p.style.width = '20.6%';
      el.appendChild(p);
    }

    var cent = document.createElement('div');
    cent.className = 'kw-trans-cent';
    var dots = document.createElement('div');
    dots.className = 'kw-dots';
    for (var d = 0; d < 6; d++) {
      var s = document.createElement('i');
      s.style.setProperty('--i', d);
      dots.appendChild(s);
    }
    var word = document.createElement('div');
    word.className = 'kw-trans-word';
    word.textContent = 'KevinWeb';
    cent.appendChild(dots);
    cent.appendChild(word);
    el.appendChild(cent);

    root.appendChild(el);
    overlay = el;

    if (instant) {
      el.classList.add('flat', 'on');
      void el.offsetWidth;
      el.classList.remove('flat'); /* keep .on so the panes stay down without animating */
    }
    return el;
  }

  function setWave(el, dur, gap) {
    var panes = el.querySelectorAll('.kw-trans-pane');
    for (var i = 0; i < panes.length; i++) {
      panes[i].style.setProperty('--pdur', dur + 'ms');
      panes[i].style.setProperty('--pdel', (i * gap) + 'ms');
    }
  }

  function reveal() {
    var el = overlay;
    if (!el) return;
    var wait = Math.max(0, MIN - (Date.now() - t0));
    setTimeout(function () {
      if (leaving || !el.parentNode) return;
      overlay = null;
      setWave(el, OUT_DUR, OUT_GAP);
      el.classList.remove('on');
      el.classList.add('out');
      root.classList.remove('kw-trans-lock');
      try { document.dispatchEvent(new Event('kw:reveal')); } catch (e) {}
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, OUT_DUR + OUT_GAP * (PANES - 1) + 140);
    }, wait);
  }

  function sameDoc(url) {
    var a = url.pathname.replace(/\/index\.html?$/i, '/');
    var b = location.pathname.replace(/\/index\.html?$/i, '/');
    return a === b && url.search === location.search;
  }

  function isPageLink(a) {
    if (a.target && a.target !== '_self') return false;
    if (a.hasAttribute('download')) return false;
    var rel = (a.getAttribute('rel') || '').toLowerCase();
    if (/(^|\s)external(\s|$)/.test(rel)) return false;
    var url;
    try { url = new URL(a.getAttribute('href'), location.href); } catch (e) { return false; }
    if (url.protocol !== location.protocol || url.host !== location.host) return false;
    if (sameDoc(url)) return false;
    if (!/\.html?$/i.test(url.pathname) && url.pathname.charAt(url.pathname.length - 1) !== '/') return false;
    return true;
  }

  function leave(href) {
    if (leaving) return;
    leaving = true;
    root.classList.add('kw-trans-lock');
    if (!overlay) {
      var el = create();
      setWave(el, LEAVE_DUR, LEAVE_GAP);
      void el.offsetWidth;
      el.classList.add('on');
    }
    setTimeout(function () { window.location.href = href; }, NAV_AT);
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || !isPageLink(a)) return;
    e.preventDefault();
    leave(a.getAttribute('href'));
  });

  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    leaving = false;
    root.classList.remove('kw-trans-lock');
    var stale = document.querySelectorAll('.kw-trans');
    for (var i = 0; i < stale.length; i++) {
      if (stale[i].parentNode) stale[i].parentNode.removeChild(stale[i]);
    }
    overlay = null;
  });

  injectStyle();
  create(true);
  root.classList.add('kw-trans-lock');

  if (document.readyState === 'complete') reveal();
  else window.addEventListener('load', reveal);
  setTimeout(reveal, MAX);
})();
