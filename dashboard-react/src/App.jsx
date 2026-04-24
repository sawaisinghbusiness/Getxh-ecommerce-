import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, collection, query, orderBy, limit, addDoc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from './firebase/firebase';
import { CATEGORIES, SERVICES } from './data/services';

import { DesktopSidebar, MobileSideMenu } from './components/Sidebar';
import MobileHeader from './components/Header';
import CategoryDropdown from './components/CategoryDropdown';
import ServiceList from './components/ServiceList';
import OrderForm from './components/OrderForm';
import TrackingCard from './components/TrackingCard';
import RecentOrders from './components/RecentOrders';
import ToastContainer from './components/Toast';

export default function App() {
  const [user, setUser]               = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [balance, setBalance]         = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [selCat, setSelCat]   = useState(CATEGORIES[0]);
  const [selSvc, setSelSvc]   = useState(null);
  const [lastOrderId, setLastOrderId] = useState(() => localStorage.getItem('lastOrderId') || null);

  const [menuOpen, setMenuOpen] = useState(false);

  // Auto-select first service when category changes
  useEffect(() => {
    if (selCat) {
      const first = (SERVICES[selCat.id] || [])[0];
      if (first) setSelSvc(first);
    }
  }, [selCat?.id]);

  // Firebase auth guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthChecked(true);
      if (!u) {
        window.location.href = '../Getxh-ecommerce--main/index.html';
        return;
      }
      setUser(u);
    });
    return unsub;
  }, []);

  // Real-time user stats
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'Users', user.uid), (snap) => {
      const data = snap.exists() ? snap.data() : {};
      setBalance(Number(data.Balance || 0));
      setTotalOrders(Number(data.TotalOrders || 0));
    });
    return unsub;
  }, [user?.uid]);

  // Real-time recent orders
  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    const q = query(
      collection(db, 'orders', user.uid, 'user_orders'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrdersLoading(false);
      if (snap.empty) { setRecentOrders([]); return; }
      setRecentOrders(snap.docs.map(d => d.data()));
    });
    return unsub;
  }, [user?.uid]);

  // Save order to Firestore after successful API call
  async function handleOrderSuccess(svc, qty, link, apiOrderId) {
    setLastOrderId(apiOrderId);
    if (!user) return;
    try {
      const now = new Date();
      const orderPrice = parseFloat(((qty / 1000) * svc.price).toFixed(2));
      const pad2 = n => String(n).padStart(2, '0');
      const readable = `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
      await addDoc(collection(db, 'orders', user.uid, 'user_orders'), {
        orderId: String(Date.now()).slice(-7),
        apiOrderId: apiOrderId ? String(apiOrderId) : null,
        serviceName: svc.name,
        category: svc.id,
        quantity: qty,
        price: orderPrice,
        link: link,
        status: 'Pending',
        createdAt: now,
        createdAtReadable: readable,
      });

      // Increment total orders in Users doc
      await updateDoc(doc(db, 'Users', user.uid), { TotalOrders: increment(1) });
    } catch (_) {}

    // Scroll to tracking card
    setTimeout(() => {
      document.getElementById('trackingSection')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
  }

  function handleServiceSelect(svc, cat) {
    if (cat) setSelCat(cat);
    setSelSvc(svc);
  }

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <>
      <ToastContainer />

      {/* Desktop sidebar */}
      <DesktopSidebar user={user} balance={balance} totalOrders={totalOrders} />

      {/* Mobile header */}
      <MobileHeader onMenuOpen={() => setMenuOpen(true)} balance={balance} />

      {/* Mobile slide menu */}
      <MobileSideMenu
        user={user} balance={balance} totalOrders={totalOrders}
        open={menuOpen} onClose={() => setMenuOpen(false)}
      />

      {/* Main */}
      <main className="main-content">

        {/* Welcome card */}
        <div className="welcome-card">
          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg,#1d4ed8,#2196f3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, color: '#fff', flexShrink: 0 }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Welcome back</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{displayName}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="stat-chip">
              <span style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Balance</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#2196f3' }}>₹{balance.toFixed(2)}</span>
            </div>
            <div className="stat-chip">
              <span style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Orders</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{totalOrders.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* New Order Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ color: '#2196f3', fontSize: 20 }}>add_shopping_cart</span>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>New Order</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Category */}
            <div>
              <div className="section-label">Category</div>
              <CategoryDropdown selected={selCat?.id} onSelect={cat => setSelCat(cat)} />
            </div>

            {/* Services + search */}
            <div>
              <div className="section-label">Service</div>
              <ServiceList catId={selCat?.id} selected={selSvc} onSelect={handleServiceSelect} />
            </div>

            {/* Order form (stat cards + inputs + button) */}
            {selSvc && (
              <OrderForm
                key={selSvc.id}
                service={selSvc}
                onOrderSuccess={handleOrderSuccess}
              />
            )}
          </div>
        </div>

        {/* Live tracking card */}
        {lastOrderId && (
          <div id="trackingSection">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ color: '#2196f3', fontSize: 20 }}>radar</span>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Last Order Status</h2>
            </div>
            <TrackingCard orderId={lastOrderId} />
          </div>
        )}

        {/* Recent orders */}
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ color: '#2196f3', fontSize: 20 }}>history</span>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Recent Orders</h2>
            </div>
            <a href="../Getxh-ecommerce--main/orders.html" style={{ fontSize: 12, color: '#2196f3', fontWeight: 700, textDecoration: 'none' }}>View all →</a>
          </div>
          <RecentOrders orders={recentOrders} loading={ordersLoading} />
        </div>

      </main>
    </>
  );
}
