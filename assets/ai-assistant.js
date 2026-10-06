/* AI order assistant (dashboard).
   Shown only to users the admin has given access to (the server decides, see /assistant/access).
   It never places an order: "Fill order" fills the normal order form and the user presses Place Order.
   The chat is kept in this browser while the user is logged in (logout clears localStorage). */
(function () {
  'use strict';
  var API = 'https://backend-for-api-connect-g8ta.onrender.com/assistant';
  var MAX_ITEMS = 60;
  var uid = '';
  var history = [];   // what the server sees: [{role, content}]
  var ui = [];        // what the user sees: [{k:'bot'|'me', t} | {k:'order', p}]
  var busy = false;
  var els = {};

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function inr(n) { return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (_) {} }

  async function call(method, path, body) {
    var user = window.auth && window.auth.currentUser;
    if (!user) throw new Error('Please refresh the page and try again.');
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 80000); // the server can be asleep on the free plan
    try {
      var res = await fetch(API + path, {
        method: method, cache: 'no-store', referrerPolicy: 'no-referrer', credentials: 'omit', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (await user.getIdToken()) },
        body: body ? JSON.stringify(body) : undefined
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
      return data;
    } catch (e) {
      throw new Error(e.name === 'AbortError' ? 'The assistant took too long. Please try again.' : e.message);
    } finally { clearTimeout(timer); }
  }

  // ── saved chat (per user, until logout) ──
  function save() {
    lsSet('gx_ai_chat_' + uid, JSON.stringify({ history: history.slice(-30), ui: ui.slice(-MAX_ITEMS) }));
  }
  function load() {
    try {
      var d = JSON.parse(lsGet('gx_ai_chat_' + uid) || 'null');
      if (d && Array.isArray(d.history) && Array.isArray(d.ui)) { history = d.history; ui = d.ui; }
    } catch (_) { history = []; ui = []; }
  }

  function firstName() {
    var user = window.auth && window.auth.currentUser;
    var raw = (user && user.displayName) || lsGet('getxh_user_name') || (((user && user.email) || '').split('@')[0]) || '';
    var n = String(raw).trim().split(/[\s._-]+/)[0] || '';
    return n ? n.charAt(0).toUpperCase() + n.slice(1) : '';
  }

  // ── UI ──
  function build() {
    var anchor = document.getElementById('newOrderSection');
    if (!anchor || els.card) return;

    var card = document.createElement('div');
    card.className = 'aia-card';
    card.innerHTML =
      '<div class="aia-card-ic"><span class="material-symbols-outlined">auto_awesome</span></div>' +
      '<div class="aia-card-tx"><b>AI Assistant</b><span>Not sure how to order? Tell it what you need.</span></div>' +
      '<button type="button" class="aia-btn">Chat</button>';
    anchor.parentNode.insertBefore(card, anchor);
    card.querySelector('button').addEventListener('click', open);

    var ov = document.createElement('div');
    ov.className = 'aia-ov';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', 'AI Assistant');
    ov.innerHTML =
      '<div class="aia-sheet">' +
        '<div class="aia-head"><span class="material-symbols-outlined" style="color:#60a5fa;font-size:21px">auto_awesome</span><b>AI Assistant</b>' +
        '<button type="button" class="aia-x" id="aiaNew" aria-label="New chat" title="New chat"><span class="material-symbols-outlined">edit_square</span></button>' +
        '<button type="button" class="aia-x" id="aiaClose" aria-label="Close"><span class="material-symbols-outlined">close</span></button></div>' +
        '<div class="aia-msgs" id="aiaMsgs"></div>' +
        '<form class="aia-form" id="aiaForm" autocomplete="off">' +
          '<input class="aia-in" id="aiaIn" maxlength="500" placeholder="Type what you want to order…" autocomplete="off">' +
          '<button type="submit" class="aia-btn aia-send" id="aiaSend" aria-label="Send"><span class="material-symbols-outlined">arrow_upward</span></button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(ov);

    els = { card: card, ov: ov, msgs: ov.querySelector('#aiaMsgs'), form: ov.querySelector('#aiaForm'), input: ov.querySelector('#aiaIn'), send: ov.querySelector('#aiaSend') };
    ov.querySelector('#aiaClose').addEventListener('click', close);
    ov.querySelector('#aiaNew').addEventListener('click', newChat);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.classList.contains('on')) close(); });
    els.form.addEventListener('submit', function (e) { e.preventDefault(); send(els.input.value); });

    render();
  }

  function greeting() {
    var n = firstName();
    return (n ? 'Hi ' + n + ', how' : 'Hi, how') + ' can I help you?';
  }

  function render() {
    els.msgs.innerHTML = '';
    var g = document.createElement('div');
    g.className = 'aia-m bot'; g.textContent = greeting();
    els.msgs.appendChild(g);
    if (!ui.length) {
      var chips = document.createElement('div');
      chips.className = 'aia-chips';
      ['1000 likes, 100 every 5 minutes', '500 followers', 'How do I add money?'].forEach(function (t) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'aia-chip'; b.textContent = t;
        b.addEventListener('click', function () { send(t); });
        chips.appendChild(b);
      });
      els.msgs.appendChild(chips);
    }
    ui.forEach(draw);
    scroll(true);
  }

  function draw(item) {
    if (item.k === 'order') { drawOrder(item.p); return; }
    var d = document.createElement('div');
    d.className = 'aia-m ' + (item.k === 'me' ? 'me' : 'bot');
    d.textContent = item.t;
    els.msgs.appendChild(d);
  }

  function add(item) {
    ui.push(item);
    draw(item);
    save();
    scroll();
  }

  function note(cls, text) { // short-lived message (errors), not saved
    var d = document.createElement('div');
    d.className = 'aia-m ' + cls;
    d.textContent = text;
    els.msgs.appendChild(d);
    scroll();
  }

  function scroll(instant) {
    requestAnimationFrame(function () {
      els.msgs.scrollTo({ top: els.msgs.scrollHeight, behavior: instant ? 'auto' : 'smooth' });
    });
  }

  function open() {
    els.ov.classList.add('on');
    document.body.style.overflow = 'hidden';
    scroll(true);
    if (!window.matchMedia('(pointer: coarse)').matches) setTimeout(function () { els.input.focus(); }, 120);
  }
  function close() {
    els.ov.classList.remove('on');
    document.body.style.overflow = '';
  }

  function newChat() {
    if (busy) return;
    history = []; ui = [];
    lsDel('gx_ai_chat_' + uid);
    render();
    els.input.focus();
  }

  function drawOrder(p) {
    var d = document.createElement('div');
    d.className = 'aia-order';
    var link = p.link.length > 38 ? p.link.slice(0, 38) + '…' : p.link;
    var rows = [['Service', p.serviceName], ['Link', link]];
    if (p.drip) {
      rows.push(['Delivery', p.quantity.toLocaleString('en-IN') + ' every ' + p.interval + ' min × ' + p.runs + ' runs']);
      rows.push(['Total quantity', p.totalQuantity.toLocaleString('en-IN')]);
    } else {
      rows.push(['Quantity', p.quantity.toLocaleString('en-IN')]);
    }
    d.innerHTML = '<h4>Your order</h4>' + rows.map(function (r) { return '<div class="aia-row"><span>' + r[0] + '</span><b>' + esc(r[1]) + '</b></div>'; }).join('') +
      '<div class="aia-row total"><span>Price</span><b>' + inr(p.price) + '</b></div>' +
      '<button type="button" class="aia-btn aia-fill">Fill order</button>';
    d.querySelector('button').addEventListener('click', function () { fill(p); });
    els.msgs.appendChild(d);
  }

  async function send(text) {
    text = String(text || '').trim();
    if (!text || busy) return;
    busy = true; els.send.disabled = true; els.input.value = '';
    var chips = els.msgs.querySelector('.aia-chips'); if (chips) chips.remove();
    history.push({ role: 'user', content: text });
    add({ k: 'me', t: text });
    var typing = document.createElement('div');
    typing.className = 'aia-m bot';
    typing.innerHTML = '<span class="aia-dots"><i></i><i></i><i></i></span>';
    els.msgs.appendChild(typing); scroll();
    try {
      var data = await call('POST', '/chat', { messages: history });
      typing.remove();
      history.push({ role: 'assistant', content: data.reply });
      add({ k: 'bot', t: data.reply });
      if (data.proposal) add({ k: 'order', p: data.proposal });
    } catch (e) {
      typing.remove();
      history.pop();                                  // let the user resend the same message
      ui.pop(); save();                               // and drop it from the saved chat
      var last = els.msgs.querySelectorAll('.aia-m.me'); if (last.length) last[last.length - 1].remove();
      els.input.value = text;
      note('err', e.message);
    } finally {
      busy = false; els.send.disabled = false;
      if (!window.matchMedia('(pointer: coarse)').matches) els.input.focus();
    }
  }

  // ── fill the normal order form ──
  function setVal(id, v) {
    var el = document.getElementById(id);
    if (!el) return;
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function fill(p) {
    try {
      var cat = CATEGORIES.find(function (c) { return c.id === p.category; });
      var svc = cat && (SERVICES[p.category] || []).find(function (s) { return String(s.id) === String(p.serviceId); });
      if (!cat || !svc || svc.status === 'inactive') {
        note('err', 'That service is not available anymore. Please ask me again.');
        return;
      }
      selectCategory(cat);
      selectService(svc);
      setVal('linkInput', p.link);
      setVal('quantityInput', p.quantity);
      if (p.drip) {
        var cb = document.getElementById('dripFeedCheckbox');
        if (cb) {
          cb.checked = true;
          cb.dispatchEvent(new Event('change', { bubbles: true }));
          setVal('dripRuns', p.runs);
          setVal('dripInterval', p.interval);
        }
      }
      if (typeof updateTotalPrice === 'function') updateTotalPrice();
      close();
      var target = document.getElementById('newOrderSection');
      if (target) setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 260);
      if (typeof showToast === 'function') showToast('success', 'Order filled', 'Check the details, accept the terms and press Place Order.');
    } catch (e) {
      note('err', 'I could not fill the form. Please try again.');
    }
  }

  // ── start ──
  // Who has the assistant is decided by the admin and copied into Firestore (a setting document and a flag on the
  // user's own record). The page reads those two documents directly, so the card appears within a moment and
  // follows the admin's switch live. If the copy is missing (older setting), the server is asked once instead.
  // The last answer is remembered, so on later visits the card is there before anything is fetched.
  // The server checks access again on every chat message, so this only decides whether the card is shown.
  function setAccess(on) {
    lsSet('gx_ai_access_' + uid, on ? '1' : '0');
    if (on) { build(); els.card.classList.add('on'); } else if (els.card) { els.card.classList.remove('on'); }
  }

  var askedServer = false;
  async function askServer() {
    if (askedServer) return;
    askedServer = true;
    try { var data = await call('GET', '/access'); setAccess(!!data.enabled); } catch (_) { /* keep what is shown */ }
  }

  function watchAccess() {
    var db = window.db, doc = window._doc, listen = window._onSnapshot;
    if (!db || !doc || !listen) { askServer(); return; }
    var mode = null, flag, haveMode = false, haveUser = false;
    function decide() {
      if (!haveMode || !haveUser) return;
      if (mode === 'everyone') { setAccess(true); return; }
      if (mode === 'off') { setAccess(false); return; }
      if (mode === 'selected' && flag === true) { setAccess(true); return; }
      if (mode === 'selected' && flag === false) { setAccess(false); return; }
      askServer();                                         // no copy yet: the server knows
    }
    listen(doc(db, 'app_config', 'ai_assistant'),
      function (s) { haveMode = true; mode = s.exists() ? s.data().mode : null; decide(); },
      function () { haveMode = true; mode = null; decide(); });
    listen(doc(db, 'Users', uid),
      function (s) { haveUser = true; flag = s.exists() ? s.data().aiAssistant : undefined; decide(); },
      function () { haveUser = true; flag = undefined; decide(); });
  }

  async function init() {
    for (var i = 0; i < 200; i++) {                        // wait up to ~20 s for the login to be ready
      if (window.auth && window.auth.currentUser) break;
      await new Promise(function (r) { setTimeout(r, 100); });
    }
    var user = window.auth && window.auth.currentUser;
    if (!user) return;
    uid = user.uid;
    load();
    if (lsGet('gx_ai_access_' + uid) === '1') { build(); els.card.classList.add('on'); }
    watchAccess();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
