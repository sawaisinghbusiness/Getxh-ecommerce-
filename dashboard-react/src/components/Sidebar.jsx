import { useState } from 'react';
import { signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';

const NAV = [
  { icon: 'dashboard',     label: 'Dashboard',  href: null,          active: true },
  { icon: 'receipt_long',  label: 'My Orders',  href: '../Getxh-ecommerce--main/orders.html' },
  { icon: 'support_agent', label: 'Support',    href: null },
];

function SidebarContent({ user, balance, totalOrders, onClose }) {
  const [showAccount, setShowAccount] = useState(false);
  const [showPassForm, setShowPassForm] = useState(false);
  const [currPass, setCurrPass]   = useState('');
  const [newPass, setNewPass]     = useState('');
  const [passMsg, setPassMsg]     = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const email       = user?.email || '';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const isAdmin = email.trim().toLowerCase() === 'agency@getxh.in';

  async function handleLogout() {
    try { await signOut(auth); } catch (_) {}
    localStorage.clear();
    window.location.href = '../Getxh-ecommerce--main/index.html';
  }

  async function handleChangePass(e) {
    e.preventDefault();
    if (!currPass || !newPass) { setPassMsg('Fill both fields.'); return; }
    setPassLoading(true); setPassMsg('');
    try {
      const cred = EmailAuthProvider.credential(email, currPass);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPass);
      setPassMsg('✓ Password changed!');
      setCurrPass(''); setNewPass('');
      setTimeout(() => { setShowPassForm(false); setPassMsg(''); }, 2000);
    } catch (err) {
      let m = 'Something went wrong.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') m = 'Current password is wrong.';
      if (err.code === 'auth/weak-password') m = 'New password must be at least 6 chars.';
      setPassMsg(m);
    } finally { setPassLoading(false); }
  }

  return (
    <>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-badge">GX</div>
        <span className="sidebar-brand-name">GETXH</span>
      </div>

      {/* User chip */}
      <div
        onClick={() => setShowAccount(true)}
        style={{ margin: '12px 10px', padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
      >
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#1d4ed8,#2196f3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: '#fff', flexShrink: 0 }}>
          {avatarLetter}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
          <div style={{ fontSize: 10, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#475569' }}>chevron_right</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map(n => (
          <a
            key={n.label}
            href={n.href || undefined}
            className={`sidebar-item${n.active ? ' active' : ''}`}
            onClick={n.href ? undefined : e => { e.preventDefault(); if (onClose) onClose(); }}
          >
            <span className="material-symbols-outlined">{n.icon}</span>
            {n.label}
          </a>
        ))}
        {isAdmin && (
          <a href="../Getxh-ecommerce--main/admin.html" className="sidebar-item">
            <span className="material-symbols-outlined">admin_panel_settings</span>
            Admin
          </a>
        )}
      </nav>

      {/* Stats */}
      <div style={{ padding: '0 10px 10px' }}>
        <div style={{ background: 'rgba(33,150,243,0.08)', border: '1px solid rgba(33,150,243,0.18)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Balance</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#2196f3' }}>₹{(balance || 0).toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Orders</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{(totalOrders || 0).toLocaleString()}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Account popup */}
      {showAccount && (
        <div className="account-popup visible" onClick={e => { if (e.target === e.currentTarget) setShowAccount(false); }}>
          <div className="account-popup-sheet">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 40, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.15)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#1d4ed8,#2196f3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, color: '#fff' }}>{avatarLetter}</div>
              <div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: 16 }}>{displayName}</div>
                <div style={{ color: '#64748b', fontSize: 12 }}>{email}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'rgba(33,150,243,0.08)', border: '1px solid rgba(33,150,243,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>BALANCE</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#2196f3' }}>₹{(balance || 0).toFixed(2)}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>ORDERS</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{(totalOrders || 0).toLocaleString()}</div>
              </div>
            </div>
            <button
              onClick={() => setShowPassForm(v => !v)}
              style={{ width: '100%', padding: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#e2e8f0', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}
            >
              Change Password
            </button>
            {showPassForm && (
              <form onSubmit={handleChangePass} style={{ marginBottom: 8 }}>
                <input type="password" placeholder="Current password" value={currPass} onChange={e => setCurrPass(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 13, marginBottom: 8, outline: 'none', fontFamily: 'Inter,sans-serif' }} />
                <input type="password" placeholder="New password (min 6 chars)" value={newPass} onChange={e => setNewPass(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 13, marginBottom: 8, outline: 'none', fontFamily: 'Inter,sans-serif' }} />
                {passMsg && <div style={{ fontSize: 12, color: passMsg.startsWith('✓') ? '#4ade80' : '#f87171', marginBottom: 6 }}>{passMsg}</div>}
                <button type="submit" disabled={passLoading}
                  style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg,#1d4ed8,#2196f3)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: passLoading ? 'not-allowed' : 'pointer' }}>
                  {passLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}
            <button onClick={handleLogout}
              style={{ width: '100%', padding: '11px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 12, color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function DesktopSidebar({ user, balance, totalOrders }) {
  return (
    <aside className="sidebar">
      <SidebarContent user={user} balance={balance} totalOrders={totalOrders} />
    </aside>
  );
}

export function MobileSideMenu({ user, balance, totalOrders, open, onClose }) {
  return (
    <>
      <div className={`menu-overlay${open ? ' visible' : ''}`} onClick={onClose} />
      <div className={`side-menu${open ? ' open' : ''}`}>
        <SidebarContent user={user} balance={balance} totalOrders={totalOrders} onClose={onClose} />
      </div>
    </>
  );
}
