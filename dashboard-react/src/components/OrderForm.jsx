import { useState, useEffect, useRef } from 'react';
import { showToast } from './Toast';

const API_BASE = 'https://backend-for-api-connect-1.onrender.com';

function playSuccess() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    [[523, 0, 0.12], [659, 0.13, 0.12], [784, 0.26, 0.18]].forEach(([freq, delay, dur]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.10, t + delay);
      g.gain.exponentialRampToValueAtTime(0.001, t + delay + dur);
      o.start(t + delay); o.stop(t + delay + dur + 0.01);
    });
  } catch (_) {}
}

const STAT_FIELDS = [
  { key: 'startTime', label: 'Start Time', icon: 'schedule' },
  { key: 'speed',     label: 'Speed',      icon: 'bolt' },
  { key: 'refill',    label: 'Refill',     icon: 'refresh' },
  { key: 'cancel',    label: 'Cancel',     icon: 'cancel' },
  { key: 'drop',      label: 'Drop',       icon: 'trending_down' },
  { key: 'quality',   label: 'Quality',    icon: 'verified' },
];

export default function OrderForm({ service, onOrderSuccess }) {
  const [link, setLink]                   = useState('');
  const [qty, setQty]                     = useState('');
  const [customComments, setCustomComments] = useState('');
  const [loading, setLoading]             = useState(false);
  const [totalPrice, setTotalPrice]       = useState('');
  const [qtyError, setQtyError]           = useState('');
  const [ccError, setCcError]             = useState('');
  const [ccCount, setCcCount]             = useState(0);

  const isCustom = service?.name?.toLowerCase().includes('custom');

  // Reset fields when service changes
  useEffect(() => {
    setLink(''); setQty(''); setCustomComments('');
    setTotalPrice(''); setQtyError(''); setCcError(''); setCcCount(0);
  }, [service?.id]);

  // Qty validation
  useEffect(() => {
    if (!service || isCustom) return;
    const n = parseInt(qty);
    if (!qty) { setTotalPrice(''); setQtyError(''); return; }
    if (!n || n < service.min || n > service.max) {
      setQtyError(`Min: ${service.min.toLocaleString()} — Max: ${service.max.toLocaleString()}`);
      setTotalPrice('');
    } else {
      setQtyError('');
      setTotalPrice('₹' + ((n / 1000) * service.price).toFixed(2));
    }
  }, [qty, service]);

  // Custom comments handler
  function handleCustomChange(e) {
    const val = e.target.value;
    setCustomComments(val);
    const lines = val.split('\n').filter(l => l.trim() !== '').length;
    setCcCount(lines);
    setQty(lines > 0 ? String(lines) : '');
    if (lines > 0 && lines < service.min) {
      setCcError(`Minimum ${service.min} comments required (${lines} entered)`);
      setTotalPrice('');
    } else if (lines >= service.min) {
      setCcError('');
      setTotalPrice('₹' + ((lines / 1000) * service.price).toFixed(2));
    } else {
      setCcError(''); setTotalPrice('');
    }
  }

  const isValid = (() => {
    if (!service || !link.trim()) return false;
    if (isCustom) return ccCount >= service.min;
    const n = parseInt(qty);
    return n && n >= service.min && n <= service.max;
  })();

  async function handleOrder(e) {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);
    try {
      const body = { service: service.id, link: link.trim(), quantity: qty };
      if (isCustom) body.comments = customComments;

      const res  = await fetch(`${API_BASE}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.order) {
        playSuccess();
        showToast('success', 'Order Placed!', `Order ID: ${data.order}`);
        localStorage.setItem('lastOrderId', String(data.order));
        onOrderSuccess(service, parseInt(qty), link.trim(), String(data.order));
        setLink(''); setQty(''); setCustomComments('');
        setTotalPrice(''); setCcCount(0);
      } else {
        showToast('error', 'Unable to Place Order', 'Something went wrong. Please try again or contact support.');
      }
    } catch (_) {
      showToast('error', 'Unable to Place Order', 'Service is temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  if (!service) return null;

  return (
    <div className="order-card" style={{ marginTop: 16 }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
        {STAT_FIELDS.map(f => (
          <div key={f.key} className="stat-card">
            <div className="stat-label">{f.label}</div>
            <div className="stat-val">{service[f.key]}</div>
          </div>
        ))}
      </div>

      {/* Details */}
      {service.details?.length > 0 && (
        <ul style={{ listStyle: 'none', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {service.details.map((d, i) => (
            <li key={i} style={{ display: 'flex', gap: 6, fontSize: 12, color: '#94a3b8', lineHeight: 1.45 }}>
              <span style={{ flexShrink: 0, color: '#2196f3' }}>•</span>{d}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleOrder} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Link input */}
        <div>
          <div className="section-label">Link / Username</div>
          <input
            type="url"
            className="field-input"
            placeholder="https://instagram.com/username"
            value={link}
            onChange={e => setLink(e.target.value)}
          />
        </div>

        {/* Custom comments */}
        {isCustom && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div className="section-label" style={{ marginBottom: 0 }}>Custom Comments</div>
              <span style={{ fontSize: 11, color: '#475569' }}>{ccCount} {ccCount === 1 ? 'comment' : 'comments'} entered</span>
            </div>
            <textarea
              className="field-input"
              placeholder={`Enter one comment per line\nMinimum: ${service.min} comments`}
              value={customComments}
              onChange={handleCustomChange}
              rows={5}
            />
            {ccError && <div style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>{ccError}</div>}
          </div>
        )}

        {/* Quantity */}
        <div>
          <div className="section-label">Quantity</div>
          <input
            type="number"
            className="field-input"
            placeholder={`Min: ${service.min.toLocaleString()} — Max: ${service.max.toLocaleString()}`}
            value={qty}
            readOnly={isCustom}
            onChange={e => !isCustom && setQty(e.target.value)}
            min={service.min}
            max={service.max}
          />
          {qtyError && <div style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>{qtyError}</div>}
        </div>

        {/* Total */}
        {totalPrice && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(33,150,243,0.08)', border: '1px solid rgba(33,150,243,0.2)', borderRadius: 10 }}>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Total Price</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#2196f3' }}>{totalPrice}</span>
          </div>
        )}

        {/* Submit */}
        <button type="submit" className="order-btn" disabled={!isValid || loading}>
          {loading ? (
            <>
              <div className="spinner" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>shopping_cart</span>
              <span>ORDER</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
