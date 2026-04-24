import { useEffect, useRef, useState } from 'react';

let _addToast = null;

export function showToast(type, title, msg) {
  if (_addToast) _addToast({ type, title, msg, id: Date.now() + Math.random() });
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _addToast = (t) => setToasts(prev => [...prev, t]);
    return () => { _addToast = null; };
  }, []);

  function remove(id) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onRemove={() => remove(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ type, title, msg, onRemove }) {
  const ref = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (ref.current) ref.current.classList.add('hide');
      setTimeout(onRemove, 350);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const icons = { success: 'check_circle', error: 'cancel', warn: 'warning' };

  return (
    <div ref={ref} className={`toast toast-${type}`}>
      <div className="toast-icon">
        <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
          {icons[type] || 'info'}
        </span>
      </div>
      <div className="toast-body">
        <div className="toast-title">{title}</div>
        {msg && <div className="toast-msg">{msg}</div>}
        <div className="toast-bar" />
      </div>
    </div>
  );
}
