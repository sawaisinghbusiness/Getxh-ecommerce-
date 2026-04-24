export default function RecentOrders({ orders, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2].map(i => (
          <div key={i} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 6, width: '60%' }} />
              <div style={{ height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 6, width: '35%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 14 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#334155', display: 'block', marginBottom: 8 }}>receipt_long</span>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>No orders yet</p>
        <p style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>Your recent orders will appear here instantly.</p>
      </div>
    );
  }

  function statusColor(s) {
    if (s === 'Completed') return '#4ade80';
    if (s === 'Failed')    return '#f87171';
    return '#facc15';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {orders.map((o, i) => {
        const sc = statusColor(o.status);
        return (
          <div key={i} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                {o.serviceName || '—'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 11, color: '#64748b' }}>
                <span>Qty: <b style={{ color: '#fff' }}>{(o.quantity || 0).toLocaleString()}</b></span>
                <span>₹<b style={{ color: '#60a5fa' }}>{(o.price || 0).toFixed(2)}</b></span>
                {o.createdAtReadable && <span>{o.createdAtReadable}</span>}
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99, flexShrink: 0, background: `${sc}18`, border: `1px solid ${sc}40`, color: sc }}>
              {o.status || 'Pending'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
