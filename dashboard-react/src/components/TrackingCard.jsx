import { useState, useEffect, useRef } from 'react';

const API_BASE = 'https://backend-for-api-connect-1.onrender.com';

function statusClass(s) {
  if (s === 'completed')  return 'status-completed';
  if (s === 'inprogress') return 'status-inprogress';
  if (s === 'partial')    return 'status-partial';
  return 'status-pending';
}

function progressWidth(s) {
  if (s === 'completed')  return '100%';
  if (s === 'partial')    return '85%';
  if (s === 'inprogress') return '60%';
  return '20%';
}

export default function TrackingCard({ orderId }) {
  const [status, setStatus]   = useState('Pending');
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  async function fetchStatus(id) {
    try {
      const res  = await fetch(`${API_BASE}/status/${id}`);
      const data = await res.json();
      const s = (data.status || 'Pending');
      setStatus(s);
      setLoading(false);
      if (s.toLowerCase() === 'completed') {
        clearInterval(intervalRef.current);
      }
    } catch (_) {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    fetchStatus(orderId);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => fetchStatus(orderId), 5000);
    return () => clearInterval(intervalRef.current);
  }, [orderId]);

  if (!orderId) return null;

  const s = status.toLowerCase();

  return (
    <div className="tracking-card" style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="pulse-dot" />
          <span style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>Live Tracking</span>
        </div>
        <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>
          Order #{orderId}
        </span>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Status</span>
          {loading ? (
            <span style={{ fontSize: 11, color: '#475569' }}>Checking...</span>
          ) : (
            <span className={`status-badge ${statusClass(s)}`}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
              {status}
            </span>
          )}
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: loading ? '10%' : progressWidth(s) }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <a
          href="../Getxh-ecommerce--main/orders.html"
          style={{ flex: 1, padding: '9px', textAlign: 'center', background: 'rgba(33,150,243,0.12)', border: '1px solid rgba(33,150,243,0.25)', borderRadius: 10, color: '#2196f3', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>receipt_long</span>
          View All Orders
        </a>
      </div>
    </div>
  );
}
