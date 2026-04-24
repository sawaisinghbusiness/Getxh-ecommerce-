import { useState, useRef, useEffect } from 'react';
import { SERVICES, CATEGORIES } from '../data/services';

export default function ServiceList({ catId, selected, onSelect }) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState('');
  const [globalQ, setGlobalQ] = useState('');
  const [globalResults, setGlobalResults] = useState([]);
  const [showGlobal, setShowGlobal] = useState(false);
  const listRef   = useRef(null);
  const searchRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (listRef.current && !listRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close global search on outside click
  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowGlobal(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const services = (SERVICES[catId] || []).filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleGlobalSearch(q) {
    setGlobalQ(q);
    if (!q) { setGlobalResults([]); setShowGlobal(false); return; }
    const results = [];
    CATEGORIES.forEach(cat => {
      (SERVICES[cat.id] || []).forEach(svc => {
        if (svc.name.toLowerCase().includes(q.toLowerCase()) || cat.label.toLowerCase().includes(q.toLowerCase())) {
          results.push({ cat, svc });
        }
      });
    });
    setGlobalResults(results);
    setShowGlobal(true);
  }

  function handleGlobalSelect(cat, svc) {
    setGlobalQ(''); setShowGlobal(false);
    onSelect(svc, cat);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Global search */}
      <div style={{ position: 'relative' }} ref={searchRef}>
        <div style={{ position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#475569', pointerEvents: 'none' }}>search</span>
          <input
            type="text"
            className="field-input"
            placeholder="Search any service..."
            value={globalQ}
            onChange={e => handleGlobalSearch(e.target.value)}
            style={{ paddingLeft: 40, paddingRight: globalQ ? 36 : 14 }}
          />
          {globalQ && (
            <button onClick={() => { setGlobalQ(''); setShowGlobal(false); }}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            </button>
          )}
        </div>
        {showGlobal && (
          <div className="dropdown-list" style={{ maxHeight: 280 }}>
            {globalResults.length === 0 ? (
              <div className="search-no-result">No services found for "<b style={{ color: '#fff' }}>{globalQ}</b>"</div>
            ) : globalResults.map(({ cat, svc }) => (
              <div key={`${cat.id}-${svc.id}`} className="search-result-item" onClick={() => handleGlobalSelect(cat, svc)}>
                <div className="svc-num-badge">{svc.id}</div>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{svc.name}</span>
                <span className="search-cat-badge">{cat.label.split(' - ')[1] || cat.label}</span>
                <span style={{ color: '#2196f3', fontWeight: 800, fontSize: 12, flexShrink: 0, marginLeft: 4 }}>₹{svc.price.toFixed(2)}/1K</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service dropdown */}
      {catId && (
        <div style={{ position: 'relative' }} ref={listRef}>
          <button className="dropdown-btn" onClick={() => setOpen(v => !v)} disabled={!catId}>
            {selected ? (
              <>
                <div className="svc-num-badge">{selected.id}</div>
                <span style={{ flex: 1, textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name}</span>
                <span style={{ color: '#2196f3', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>₹{selected.price.toFixed(2)}/1K</span>
              </>
            ) : (
              <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>— Select a service —</span>
            )}
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#475569', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>expand_more</span>
          </button>

          {open && (
            <div className="dropdown-list">
              {/* Search within category */}
              <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <input
                  type="text"
                  placeholder="Filter services..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'Inter,sans-serif' }}
                  autoFocus
                />
              </div>
              {services.length === 0 ? (
                <div className="search-no-result">No services match.</div>
              ) : services.map(svc => (
                <div
                  key={svc.id}
                  className={`svc-item${selected?.id === svc.id ? ' selected' : ''}`}
                  onClick={() => { onSelect(svc, null); setOpen(false); setSearch(''); }}
                >
                  <div className="svc-num-badge">{svc.id}</div>
                  <span style={{ flex: 1 }}>{svc.name}</span>
                  <span style={{ color: '#2196f3', fontWeight: 800, fontSize: 12, flexShrink: 0, marginLeft: 8 }}>₹{svc.price.toFixed(2)}/1K</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
