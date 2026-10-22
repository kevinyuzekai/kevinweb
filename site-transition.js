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
    '.kw-dots{--uib-size:45px;--uib-color:#f2f2f2;--uib-speed:2.5s;display:flex;flex-direction:column;align-items:center;justify-content:center;height:var(--uib-size);width:var(--uib-size)}',
    '.kw-dots .slice{position:relative;height:calc(var(--uib-size) / 6);width:100%}',
    '.kw-dots .slice::before,.kw-dots .slice::after{--uib-a:calc(var(--uib-speed) / -2);--uib-b:calc(var(--uib-speed) / -6);content:"";position:absolute;top:0;left:calc(50% - var(--uib-size) / 12);height:100%;width:calc(100% / 6);border-radius:50%;background-color:var(--uib-color);flex-shrink:0;animation:kwOrbit var(--uib-speed) linear infinite}',
    '.kw-dots .slice:nth-child(1)::after{animation-delay:var(--uib-a)}',
    '.kw-dots .slice:nth-child(2)::before{animation-delay:var(--uib-b)}',
    '.kw-dots .slice:nth-child(2)::after{animation-delay:calc(var(--uib-a) + var(--uib-b))}',
    '.kw-dots .slice:nth-child(3)::before{animation-delay:calc(var(--uib-b) * 2)}',
    '.kw-dots .slice:nth-child(3)::after{animation-delay:calc(var(--uib-a) + var(--uib-b) * 2)}',
    '.kw-dots .slice:nth-child(4)::before{animation-delay:calc(var(--uib-b) * 3)}',
    '.kw-dots .slice:nth-child(4)::after{animation-delay:calc(var(--uib-a) + var(--uib-b) * 3)}',
    '.kw-dots .slice:nth-child(5)::before{animation-delay:calc(var(--uib-b) * 4)}',
    '.kw-dots .slice:nth-child(5)::after{animation-delay:calc(var(--uib-a) + var(--uib-b) * 4)}',
    '.kw-dots .slice:nth-child(6)::before{animation-delay:calc(var(--uib-b) * 5)}',
    '.kw-dots .slice:nth-child(6)::after{animation-delay:calc(var(--uib-a) + var(--uib-b) * 5)}',
    '.kw-trans-word{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;letter-spacing:.42em;text-indent:.42em;text-transform:uppercase;color:#c6c6c6}',
    '@keyframes kwOrbit{',
    '0%{transform:translateX(calc(var(--uib-size) * .25)) scale(.73684);opacity:.65}',
    '5%{transform:translateX(calc(var(--uib-size) * .235)) scale(.684208);opacity:.58}',
    '10%{transform:translateX(calc(var(--uib-size) * .182)) scale(.631576);opacity:.51}',
    '15%{transform:translateX(calc(var(--uib-size) * .129)) scale(.578944);opacity:.44}',
    '20%{transform:translateX(calc(var(--uib-size) * .076)) scale(.526312);opacity:.37}',
    '25%{transform:translateX(0) scale(.47368);opacity:.3}',
    '30%{transform:translateX(calc(var(--uib-size) * -.076)) scale(.526312);opacity:.37}',
    '35%{transform:translateX(calc(var(--uib-size) * -.129)) scale(.578944);opacity:.44}',
    '40%{transform:translateX(calc(var(--uib-size) * -.182)) scale(.631576);opacity:.51}',
    '45%{transform:translateX(calc(var(--uib-size) * -.235)) scale(.684208);opacity:.58}',
    '50%{transform:translateX(calc(var(--uib-size) * -.25)) scale(.73684);opacity:.65}',
    '55%{transform:translateX(calc(var(--uib-size) * -.235)) scale(.789472);opacity:.72}',
    '60%{transform:translateX(calc(var(--uib-size) * -.182)) scale(.842104);opacity:.79}',
    '65%{transform:translateX(calc(var(--uib-size) * -.129)) scale(.894736);opacity:.86}',
    '70%{transform:translateX(calc(var(--uib-size) * -.076)) scale(.947368);opacity:.93}',
    '75%{transform:translateX(0) scale(1);opacity:1}',
    '80%{transform:translateX(calc(var(--uib-size) * .076)) scale(.947368);opacity:.93}',
    '85%{transform:translateX(calc(var(--uib-size) * .129)) scale(.894736);opacity:.86}',
    '90%{transform:translateX(calc(var(--uib-size) * .182)) scale(.842104);opacity:.79}',
    '95%{transform:translateX(calc(var(--uib-size) * .235)) scale(.789472);opacity:.72}',
    '100%{transform:translateX(calc(var(--uib-size) * .25)) scale(.73684);opacity:.65}',
    '}',
    '@media (prefers-reduced-motion: reduce){.kw-trans-pane{transition:none}.kw-dots .slice::before,.kw-dots .slice::after{animation:none;opacity:.7;transform:scale(.73684)}}'
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
      var s = document.createElement('div');
      s.className = 'slice';
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
