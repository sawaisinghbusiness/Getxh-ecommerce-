(() => {
  const key = 'gx_personal_invite';
  const code = new URLSearchParams(location.search).get('invite');
  try {
    if (code && /^[a-f0-9]{24}$/.test(code)) sessionStorage.setItem(key, JSON.stringify({ code, at: Date.now() }));
  } catch (_) {}
  window.gxAttachPersonalInvite = async user => {
    let pending;
    try { pending = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch (_) { return; }
    if (!pending || !user) return;
    if (Date.now() - pending.at > 86400000 || (pending.uid && pending.uid !== user.uid)) {
      sessionStorage.removeItem(key); return;
    }
    sessionStorage.setItem(key, JSON.stringify({ ...pending, uid: user.uid }));
    try {
      const response = await fetch('https://backend-for-api-connect-g8ta.onrender.com/referrals/attach', {
        method: 'POST', signal: AbortSignal.timeout(12000),
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await user.getIdToken() },
        body: JSON.stringify({ code: pending.code })
      });
      if (response.ok || [400, 403, 409].includes(response.status)) sessionStorage.removeItem(key);
    } catch (_) { /* Keep the invite for the dashboard retry. */ }
  };
})();
