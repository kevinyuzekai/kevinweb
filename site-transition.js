/* KevinWeb page transition: a branded shutter that slides up on exit and on reveal,
   plus the orbit loader. Loaded from <head> on every page so the curtain exists
   before the first paint. Reduced motion opts out completely. */
(function () {
  if (!window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var root = document.documentElement;
  var MIN = 520;
  var MAX = 2400;
  var LEAVE = 360;
  var OUT = 560;
  var t0 = Date.now();
  var overlay = null;
  var leaving = false;

  function s(ms) { return (ms / 1000) + 's'; }

  var CSS = [
    '.kw-trans{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;background:#141414;opacity:1;visibility:hidden;pointer-events:none;transform:translate3d(0,100%,0);transition:transform ' + s(LEAVE) + ' cubic-bezier(.76,0,.24,1),opacity .28s ease,visibility 0s linear ' + s(LEAVE) + ';will-change:transform}',
    '.kw-trans.on{visibility:visible;pointer-events:auto;transform:translate3d(0,0,0);transition:transform ' + s(LEAVE) + ' cubic-bezier(.76,0,.24,1),opacity .28s ease,visibility 0s}',
    '.kw-trans.out{visibility:visible;pointer-events:auto;transform:translate3d(0,-100%,0);transition:transform ' + s(OUT) + ' cubic-bezier(.76,0,.24,1),opacity .28s ease ' + s(OUT - 140) + ',visibility 0s linear ' + s(OUT) + '}',
    'html.kw-trans-lock,html.kw-trans-lock body{overflow:hidden}',
    '.kw-trans .kw-dots{--s:45px;--sp:2.5s;display:flex;flex-direction:column;align-items:center;justify-content:center;width:var(--s);height:var(--s)}',
    '.kw-trans .kw-dots i{position:relative;display:block;width:100%;height:calc(var(--s) / 6)}',
    '.kw-trans .kw-dots i::before,.kw-trans .kw-dots i::after{content:"";position:absolute;top:0;left:calc(50% - var(--s) / 12);width:calc(100% / 6);height:100%;border-radius:50%;background:#f2f2f2;animation:kwTransOrbit var(--sp) linear infinite}',
    '.kw-trans .kw-dots i:nth-child(1)::after{animation-delay:calc(var(--sp) / -2)}',
    '.kw-trans .kw-dots i:nth-child(2)::before{animation-delay:calc(var(--sp) / -6)}',
    '.kw-trans .kw-dots i:nth-child(2)::after{animation-delay:calc(var(--sp) / -2 - var(--sp) / 6)}',
    '.kw-trans .kw-dots i:nth-child(3)::before{animation-delay:calc(var(--sp) / -6 * 2)}',
    '.kw-trans .kw-dots i:nth-child(3)::after{animation-delay:calc(var(--sp) / -2 - var(--sp) / 6 * 2)}',
    '.kw-trans .kw-dots i:nth-child(4)::before{animation-delay:calc(var(--sp) / -6 * 3)}',
    '.kw-trans .kw-dots i:nth-child(4)::after{animation-delay:calc(var(--sp) / -2 - var(--sp) / 6 * 3)}',
    '.kw-trans .kw-dots i:nth-child(5)::before{animation-delay:calc(var(--sp) / -6 * 4)}',
    '.kw-trans .kw-dots i:nth-child(5)::after{animation-delay:calc(var(--sp) / -2 - var(--sp) / 6 * 4)}',
    '.kw-trans .kw-dots i:nth-child(6)::before{animation-delay:calc(var(--sp) / -6 * 5)}',
    '.kw-trans .kw-dots i:nth-child(6)::after{animation-delay:calc(var(--sp) / -2 - var(--sp) / 6 * 5)}',
    '.kw-trans .kw-trans-word{font-family:ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono","PingFang SC","Noto Sans SC",monospace;font-size:.68rem;line-height:1;letter-spacing:.42em;text-indent:.42em;text-transform:uppercase;color:#c6c6c6}',
    '@keyframes kwTransOrbit{',
    '0%{transform:translateX(calc(var(--s) * .25)) scale(.73684);opacity:.65}',
    '5%{transform:translateX(calc(var(--s) * .235)) scale(.684208);opacity:.58}',
    '10%{transform:translateX(calc(var(--s) * .182)) scale(.631576);opacity:.51}',
    '15%{transform:translateX(calc(var(--s) * .129)) scale(.578944);opacity:.44}',
    '20%{transform:translateX(calc(var(--s) * .076)) scale(.526312);opacity:.37}',
    '25%{transform:translateX(0) scale(.47368);opacity:.3}',
    '30%{transform:translateX(calc(var(--s) * -.076)) scale(.526312);opacity:.37}',
    '35%{transform:translateX(calc(var(--s) * -.129)) scale(.578944);opacity:.44}',
    '40%{transform:translateX(calc(var(--s) * -.182)) scale(.631576);opacity:.51}',
    '45%{transform:translateX(calc(var(--s) * -.235)) scale(.684208);opacity:.58}',
    '50%{transform:translateX(calc(var(--s) * -.25)) scale(.73684);opacity:.65}',
    '55%{transform:translateX(calc(var(--s) * -.235)) scale(.789472);opacity:.72}',
    '60%{transform:translateX(calc(var(--s) * -.182)) scale(.842104);opacity:.79}',
    '65%{transform:translateX(calc(var(--s) * -.129)) scale(.894736);opacity:.86}',
    '70%{transform:translateX(calc(var(--s) * -.076)) scale(.947368);opacity:.93}',
    '75%{transform:translateX(0) scale(1);opacity:1}',
    '80%{transform:translateX(calc(var(--s) * .076)) scale(.947368);opacity:.93}',
    '85%{transform:translateX(calc(var(--s) * .129)) scale(.894736);opacity:.86}',
    '90%{transform:translateX(calc(var(--s) * .182)) scale(.842104);opacity:.79}',
    '95%{transform:translateX(calc(var(--s) * .235)) scale(.789472);opacity:.72}',
    '100%{transform:translateX(calc(var(--s) * .25)) scale(.73684);opacity:.65}',
    '}'
  ].join('');

  function injectStyle() {
    var st = document.createElement('style');
    st.id = 'kw-trans-style';
    st.appendChild(document.createTextNode(CSS));
    (document.head || root).appendChild(st);
  }

  function create(instant) {
    var el = document.createElement('div');
    el.className = 'kw-trans' + (instant ? ' on' : '');
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="kw-dots"><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
      '<div class="kw-trans-word">KevinWeb</div>';
    root.appendChild(el);
    overlay = el;
    return el;
  }

  function reveal() {
    if (!overlay) return;
    var el = overlay;
    var wait = Math.max(0, MIN - (Date.now() - t0));
    setTimeout(function () {
      if (leaving || !el.parentNode) return;
      overlay = null;
      root.classList.remove('kw-trans-lock');
      el.classList.remove('on');
      el.classList.add('out');
      try { document.dispatchEvent(new Event('kw:reveal')); } catch (e) {}
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, OUT + 80);
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
      void el.offsetWidth;
      el.classList.add('on');
    }
    setTimeout(function () { window.location.href = href; }, LEAVE + 20);
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || !isPageLink(a)) return;
    e.preventDefault();
    leave(a.href);
  });

  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    leaving = false;
    root.classList.remove('kw-trans-lock');
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  });

  injectStyle();
  create(true);
  root.classList.add('kw-trans-lock');
  if (document.readyState === 'complete') reveal();
  else window.addEventListener('load', reveal);
  setTimeout(reveal, MAX);
})();
