import { useState, useRef, useEffect } from 'react';
import { CATEGORIES, getCategoryIcon } from '../data/services';

function WelcomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" style={{ borderRadius: 4, flexShrink: 0 }}>
      <defs>
        <linearGradient id="woGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%"   stopColor="#f09433" />
          <stop offset="33%"  stopColor="#e6683c" />
          <stop offset="66%"  stopColor="#cc2366" />
          <stop offset="100%" stopColor="#bc1888" />
        </linearGradient>
      </defs>
      <rect width="20" height="20" rx="5" fill="url(#woGrad)" />
      <text x="10" y="14.5" textAnchor="middle" fontSize="11" fill="white">★</text>
    </svg>
  );
}

function CatIcon({ catId }) {
  if (catId === 'welcome-offer') return <WelcomeIcon />;
  const src = getCategoryIcon(catId);
  return <img src={src} alt="" style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0 }} />;
}

export default function CategoryDropdown({ selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedCat = CATEGORIES.find(c => c.id === selected);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="dropdown-btn" onClick={() => setOpen(v => !v)}>
        {selectedCat ? (
          <>
            <CatIcon catId={selectedCat.id} />
            <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {selectedCat.label}
            </span>
          </>
        ) : (
          <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>
            — Select a category —
          </span>
        )}
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#475569', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>expand_more</span>
      </button>

      {open && (
        <div className="dropdown-list">
          {CATEGORIES.map(cat => (
            <div
              key={cat.id}
              className={`cat-item${selected === cat.id ? ' selected' : ''}`}
              onClick={() => { onSelect(cat); setOpen(false); }}
            >
              <CatIcon catId={cat.id} />
              {cat.subtitle ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span>{cat.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>{cat.subtitle}</span>
                </div>
              ) : (
                <span>{cat.label}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
