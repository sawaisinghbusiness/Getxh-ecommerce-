import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
const firebaseConfig = {
  apiKey: "AIzaSyClO8clBVgSHKx8jarNwC38oMtWRK0W8KE",
  authDomain: "getxh.in",
  projectId: "getxh-42588",
  storageBucket: "getxh-42588.firebasestorage.app",
  messagingSenderId: "170770122888",
  appId: "1:170770122888:web:7adcf91077d5695b06b73d"
};
const auth = getAuth(initializeApp(firebaseConfig));
const root = document.getElementById('gx-rewards');
const el = id => document.getElementById(id);
const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value / 100);
let user, next = null, view = 'invites', people = [], generation = 0;
function pagination() { el('load-more').hidden = !next || !['rewards', 'referral'].includes(view); }
root.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
  view = button.dataset.view;
  root.querySelectorAll('[data-view]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  root.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== view; });
  pagination();
}));
async function api(path, body) {
  if (!user) throw new Error('Please sign in again.');
  const response = await fetch('https://backend-for-api-connect-g8ta.onrender.com/referrals' + path, {
    method: body ? 'POST' : 'GET', cache: 'no-store', signal: AbortSignal.timeout(20000),
    headers: { Authorization: 'Bearer ' + await user.getIdToken(), 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Rewards are unavailable. Please try again.');
  return data;
}
function status(message, error = false) { el('status').textContent = message; el('status').classList.toggle('error', error); }
function text(tag, value, className) { const node = document.createElement(tag); node.textContent = value; if (className) node.className = className; return node; }
function renderList(target, rewards) {
  const container = el(target); container.replaceChildren();
  if (!people.length) { container.append(text('p', rewards ? 'No rewards yet. Invite a friend to get started.' : 'Your invited friends will appear here.', 'empty')); return; }
  people.forEach(person => {
    const row = text('div', '', 'person'), details = text('div', '', 'details');
    row.append(text('span', Array.from(person.name || 'User')[0], 'avatar'));
    details.append(text('strong', person.name || 'User'));
    details.append(text('small', person.topUpPaise ? 'Added ' + money(person.topUpPaise) + ' · 5% reward' : 'Waiting for a verified top-up'));
    row.append(details);
    const action = text('div', '', 'action');
    if (rewards && person.unclaimedPaise > 0) {
      action.append(text('b', money(person.unclaimedPaise)));
      const button = text('button', 'Claim', 'claim'); button.type = 'button';
      button.setAttribute('aria-label', 'Claim ' + money(person.unclaimedPaise) + ' from ' + person.name);
      button.addEventListener('click', async () => {
        button.disabled = true; button.textContent = 'Claiming…';
        try {
          const result = await api('/claim', { id: person.id });
          person.claimedPaise = (person.claimedPaise || 0) + result.claimedPaise;
          person.unclaimedPaise = 0;
          await load(false);
          status(money(result.claimedPaise) + ' added to your available balance.');
        } catch (error) { status(error.message, true); button.disabled = false; button.textContent = 'Claim'; el('retry').hidden = false; }
      });
      action.append(button);
    } else {
      if (person.earnedPaise) action.append(text('b', money(person.earnedPaise)));
      action.append(text('span', person.earnedPaise ? (rewards ? 'Claimed' : 'Earned') : 'Pending', 'pending'));
    }
    row.append(action); container.append(row);
  });
}
async function load(append = false) {
  const current = generation;
  el('retry').hidden = true; el('load-more').disabled = true;
  try {
    const data = await api(append && next ? '?after=' + encodeURIComponent(next) : '');
    if (current !== generation) return;
    if (!Array.isArray(data.people) || !Number.isSafeInteger(data.totalEarnedPaise) || !Number.isSafeInteger(data.availablePaise) || !/^[a-f0-9]{24}$/.test(data.code)) throw new Error('Unable to load referral data.');
    people = append ? [...people, ...data.people] : data.people;
    next = data.next;
    el('earned').textContent = money(data.totalEarnedPaise);
    el('available').textContent = money(data.availablePaise);
    const shortfall = Math.max(0, data.minimumPayoutPaise - data.availablePaise);
    el('progress').textContent = shortfall ? money(shortfall) + ' more to reach the ₹100 minimum payout' : 'Minimum payout reached · ₹100';
    el('invite-link').value = location.origin + '/register/?invite=' + data.code;
    el('copy').disabled = false;
    renderList('rewards-list', true); renderList('people-list', false); status(''); pagination();
  } catch (error) { status(error.message || 'Unable to load rewards.', true); el('retry').hidden = false; throw error; }
  finally { el('load-more').disabled = false; }
}
el('retry').addEventListener('click', () => load().catch(() => {}));
el('load-more').addEventListener('click', () => load(true).catch(() => {}));
el('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(el('invite-link').value); el('copy-status').textContent = 'Invite link copied.'; }
  catch { el('invite-link').focus(); el('invite-link').select(); el('copy-status').textContent = 'Select and copy your invite link.'; }
});
onAuthStateChanged(auth, async current => {
  user = current; generation++; people = []; next = null;
  if (!user) { location.replace('/login.html'); return; }
  await window.gxAttachPersonalInvite(user);
  await load().catch(() => {});
});
