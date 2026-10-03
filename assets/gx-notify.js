/*!
 * GETXH notification card
 *
 * One card, used everywhere a user is told something: funds added or deducted, a service or
 * offer added or removed, and the messages the admin sends from the "Updates" page.
 *
 *   gxNotify({ kind, title, message, amount, cta:{label,url}, duration, onClose })
 *
 *   kind      info | offer | service_new | service_removed | credit | debit | warning | success
 *   duration  milliseconds on screen (default 3000); 0 = stays until the user closes it
 *   amount    a number, shown large with a + (credit) or − (debit) sign
 *   cta       an optional button; https links open in a new tab, "/path" links in the same tab
 *
 * The card slides in from the top, drains a thin timer bar, pauses while the pointer is on it,
 * and closes with the X, a swipe up, the Escape key or when the time is up. Cards wait in a queue
 * and appear one after another. Every piece of text is inserted as text, never as HTML.
 */
(function () {
  'use strict';
  if (window.gxNotify) return;

  // fg = icon / amount colour, bg = soft icon background. Muted, print-like tones on a white card.
  var KINDS = {
    info:            { tag: 'Update',         fg: '#1d4ed8', bg: '#eff4ff', icon: 'info' },
    offer:           { tag: 'Special offer',  fg: '#be185d', bg: '#fdf0f6', icon: 'gift' },
    service_new:     { tag: 'New service',    fg: '#047857', bg: '#ecf8f3', icon: 'plus' },
    service_removed: { tag: 'Service update', fg: '#b45309', bg: '#fdf5ea', icon: 'minus' },
    credit:          { tag: 'Funds added',    fg: '#15803d', bg: '#edf8f0', icon: 'up' },
    debit:           { tag: 'Funds deducted', fg: '#b91c1c', bg: '#fdf0f0', icon: 'down' },
    warning:         { tag: 'Important',      fg: '#b91c1c', bg: '#fdf0f0', icon: 'alert' },
    success:         { tag: 'Done',           fg: '#15803d', bg: '#edf8f0', icon: 'check' }
  };

  // Trusted, constant SVG markup (never built from user input).
  var ICONS = {
    info:  '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    gift:  '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    plus:  '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="M12 8v8"/><path d="M8 12h8"/>',
    minus: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
    up:    '<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>',
    down:  '<path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/>',
    alert: '<path d="M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
    close: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
    arrow: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>'
  };

  var CSS = [
    '.gxn-host{position:fixed;top:max(16px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);width:min(400px,calc(100vw - 24px));z-index:2147483000;pointer-events:none;font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}',
    '.gxn-card{--fg:#1d4ed8;--bg:#eff4ff;position:relative;display:flex;align-items:flex-start;gap:12px;padding:14px 40px 14px 14px;border-radius:12px;overflow:hidden;pointer-events:auto;',
    'background:#fff;color:#0f172a;border:1px solid rgba(15,23,42,.08);box-shadow:0 1px 2px rgba(15,23,42,.06),0 10px 28px -6px rgba(2,6,23,.38);',
    'transform:translateY(-12px);opacity:0}',
    '.gxn-card.in{animation:gxnIn .24s cubic-bezier(.2,.8,.2,1) forwards}',
    '.gxn-card.out{animation:gxnOut .18s ease-in forwards}',
    '.gxn-icon{flex:0 0 auto;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--fg);background:var(--bg)}',
    '.gxn-icon svg{width:17px;height:17px}',
    '.gxn-body{min-width:0;flex:1}',
    '.gxn-tag{font-size:12px;font-weight:500;line-height:16px;color:#64748b}',
    '.gxn-row{display:flex;align-items:baseline;gap:10px;margin-top:1px}',
    '.gxn-title{flex:1;min-width:0;font-size:14px;font-weight:600;line-height:20px;color:#0f172a;word-break:break-word}',
    '.gxn-amount{flex:0 0 auto;font-size:14px;font-weight:600;line-height:20px;color:var(--fg);font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.gxn-msg{margin-top:2px;font-size:13px;line-height:19px;color:#475569;word-break:break-word;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
    '.gxn-cta{display:inline-flex;align-items:center;gap:4px;margin-top:8px;font-size:13px;font-weight:600;line-height:18px;color:var(--fg);text-decoration:none}',
    '.gxn-cta:hover{text-decoration:underline;text-underline-offset:2px}',
    '.gxn-cta svg{width:14px;height:14px}',
    '.gxn-close{position:absolute;top:10px;right:10px;width:24px;height:24px;border:0;border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#94a3b8;background:transparent;transition:background .15s,color .15s}',
    '.gxn-close:hover{background:#f1f5f9;color:#334155}',
    '.gxn-close:focus-visible,.gxn-cta:focus-visible{outline:2px solid #2563eb;outline-offset:2px}',
    '.gxn-close svg{width:14px;height:14px}',
    '.gxn-bar{position:absolute;left:0;right:0;bottom:0;height:2px;background:transparent}',
    '.gxn-bar i{display:block;height:100%;width:100%;transform-origin:left center;background:#e2e8f0;animation:gxnBar linear forwards}',
    '.gxn-card.paused .gxn-bar i{animation-play-state:paused}',
    '.gxn-card.gxn-static{transform:none;opacity:1;animation:none}',
    '.gxn-card.gxn-static .gxn-bar{display:none}',
    '@keyframes gxnIn{from{transform:translateY(-12px);opacity:0}to{transform:translateY(0);opacity:1}}',
    '@keyframes gxnOut{from{transform:translateY(0);opacity:1}to{transform:translateY(-8px);opacity:0}}',
    '@keyframes gxnBar{from{transform:scaleX(1)}to{transform:scaleX(0)}}',
    '@keyframes gxnFade{from{opacity:0}to{opacity:1}}',
    '@keyframes gxnFadeOut{from{opacity:1}to{opacity:0}}',
    '@media (prefers-reduced-motion:reduce){.gxn-card.in{transform:none;animation:gxnFade .15s forwards}.gxn-card.out{animation:gxnFadeOut .15s forwards}}'
  ].join('');

  function injectCss() {
    if (document.getElementById('gxn-css')) return;
    var s = document.createElement('style');
    s.id = 'gxn-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function clip(value, max) {
    var s = value === undefined || value === null ? '' : String(value);
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  }
  function money(n) {
    return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  // https links and same-site "/path" links only.
  function safeUrl(u) {
    if (typeof u !== 'string') return '';
    u = u.trim();
    if (!u || u.length > 500) return '';
    if (u.charAt(0) === '/' && u.charAt(1) !== '/') return u;
    try {
      var x = new URL(u);
      return x.protocol === 'https:' && !x.username && !x.password ? x.toString() : '';
    } catch (e) { return ''; }
  }
  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function icon(name) {
    var holder = document.createElement('span');
    holder.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
    return holder.firstChild;
  }

  function normalize(opts) {
    opts = opts || {};
    var kind = KINDS[opts.kind] ? opts.kind : 'info';
    var k = KINDS[kind];
    var d = Number(opts.duration);
    var o = {
      kind: kind,
      tag: clip(opts.tag || k.tag, 28),
      title: clip(opts.title, 120),
      message: clip(opts.message, 400),
      amount: opts.amount === undefined || opts.amount === null || opts.amount === '' || isNaN(Number(opts.amount)) ? null : Number(opts.amount),
      duration: opts.duration === undefined || opts.duration === null || isNaN(d) ? 3000 : Math.max(0, Math.min(60000, d)),
      onClose: typeof opts.onClose === 'function' ? opts.onClose : null,
      cta: null
    };
    var url = opts.cta && safeUrl(opts.cta.url);
    if (url) o.cta = { label: clip(opts.cta.label || 'Open', 28), url: url };
    return o;
  }

  // Builds the card element. `staticMode` is for previews: no timer, no animation.
  function build(o, staticMode) {
    var k = KINDS[o.kind];
    var card = node('div', 'gxn-card' + (staticMode ? ' gxn-static' : ''));
    card.setAttribute('role', o.kind === 'warning' ? 'alert' : 'status');
    card.style.setProperty('--fg', k.fg);
    card.style.setProperty('--bg', k.bg);

    var ic = node('div', 'gxn-icon');
    ic.appendChild(icon(k.icon));
    var body = node('div', 'gxn-body');
    body.appendChild(node('div', 'gxn-tag', o.tag));
    var row = node('div', 'gxn-row');
    if (o.title) row.appendChild(node('div', 'gxn-title', o.title));
    if (o.amount !== null) {
      var sign = o.kind === 'debit' ? '−' : o.kind === 'credit' ? '+' : '';
      row.appendChild(node('div', 'gxn-amount', sign + money(Math.abs(o.amount))));
    }
    if (row.firstChild) body.appendChild(row);
    if (o.message) body.appendChild(node('div', 'gxn-msg', o.message));
    if (o.cta) {
      var a = node('a', 'gxn-cta');
      a.href = o.cta.url;
      if (o.cta.url.charAt(0) !== '/') { a.target = '_blank'; a.rel = 'noopener noreferrer nofollow'; }
      a.appendChild(document.createTextNode(o.cta.label));
      a.appendChild(icon('arrow'));
      body.appendChild(a);
    }
    var close = node('button', 'gxn-close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close notification');
    close.appendChild(icon('close'));

    card.appendChild(ic);
    card.appendChild(body);
    card.appendChild(close);
    if (o.duration > 0 || staticMode) {
      var bar = node('div', 'gxn-bar');
      var fill = document.createElement('i');
      if (!staticMode) fill.style.animationDuration = o.duration + 'ms';
      bar.appendChild(fill);
      card.appendChild(bar);
    }
    return { card: card, close: close };
  }

  // ── queue + lifecycle ──
  var queue = [];
  var current = null;
  var host = null;
  var counter = 0;

  function getHost() {
    if (host && host.parentNode) return host;
    host = node('div', 'gxn-host');
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
    return host;
  }

  function pump() {
    if (current || !queue.length) return;
    if (!document.body) { document.addEventListener('DOMContentLoaded', pump, { once: true }); return; }
    injectCss();
    show(queue.shift());
  }

  function show(o) {
    var built = build(o, false);
    var card = built.card;
    var timer = null;
    var remaining = o.duration;
    var startedAt = 0;
    var finished = false;
    var cur = { id: o.id, close: finish };
    current = cur;

    function arm() {
      if (o.duration <= 0) return;
      startedAt = Date.now();
      timer = setTimeout(function () { finish('timeout'); }, remaining);
    }
    function pause() {
      if (finished || o.duration <= 0 || timer === null) return;
      clearTimeout(timer); timer = null;
      remaining = Math.max(400, remaining - (Date.now() - startedAt));
      card.classList.add('paused');
    }
    function resume() {
      if (finished || o.duration <= 0 || timer !== null) return;
      card.classList.remove('paused');
      arm();
    }
    function finish(reason) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      card.classList.remove('in');
      card.classList.add('out');
      var done = false;
      var remove = function () {
        if (done) return;
        done = true;
        if (card.parentNode) card.parentNode.removeChild(card);
        current = null;
        if (o.onClose) { try { o.onClose(reason); } catch (e) { console.warn('gxNotify onClose error:', e); } }
        setTimeout(pump, 120);
      };
      card.addEventListener('animationend', function (e) { if (e.target === card) remove(); });
      setTimeout(remove, 300);
    }
    function onKey(e) { if (e.key === 'Escape') finish('escape'); }

    built.close.addEventListener('click', function () { finish('close'); });
    card.addEventListener('pointerenter', pause);
    card.addEventListener('pointerleave', resume);
    card.addEventListener('focusin', pause);
    card.addEventListener('focusout', resume);
    var y0 = null;
    card.addEventListener('pointerdown', function (e) { y0 = e.clientY; });
    card.addEventListener('pointermove', function (e) { if (y0 !== null && e.clientY - y0 < -36) { y0 = null; finish('swipe'); } });
    card.addEventListener('pointerup', function () { y0 = null; });
    document.addEventListener('keydown', onKey);

    getHost().appendChild(card);
    requestAnimationFrame(function () { card.classList.add('in'); });
    arm();
  }

  function gxNotify(opts) {
    var o = normalize(opts);
    if (!o.title && !o.message && o.amount === null) return 0;
    o.id = ++counter;
    queue.push(o);
    if (queue.length > 10) queue.splice(0, queue.length - 10);
    pump();
    return o.id;
  }
  // A non-animated card for previews (the admin "Updates" page).
  gxNotify.createCard = function (opts) { injectCss(); return build(normalize(opts), true).card; };
  gxNotify.closeAll = function () { queue.length = 0; if (current) current.close('closeAll'); };
  gxNotify.kinds = Object.keys(KINDS);
  window.gxNotify = gxNotify;
})();
