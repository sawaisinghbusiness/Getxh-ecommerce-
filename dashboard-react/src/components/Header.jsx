export default function MobileHeader({ onMenuOpen, balance, onNewOrder }) {
  return (
    <header className="mobile-header">
      <button
        onClick={onMenuOpen}
        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>menu</span>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#1d4ed8,#2196f3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#fff' }}>GX</div>
        <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.12em', color: '#fff' }}>GETXH</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: '#475569', fontWeight: 700 }}>BALANCE</div>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#2196f3' }}>₹{(balance || 0).toFixed(2)}</div>
        </div>
      </div>
    </header>
  );
}
