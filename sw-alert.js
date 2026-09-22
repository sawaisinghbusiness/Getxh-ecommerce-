// Service Worker for Real Phone Hardware Vibration & System Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/admin/');
      }
    })
  );
});

// Real-time message from foreground/background tabs
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'VIBRATE_ALERT') {
    const { title, options } = event.data;
    self.registration.showNotification(title || '🚨 GetXH Alert', options || {
      body: 'New activity on GetXH',
      icon: '/GETXH WEB NEW LOGO.png',
      badge: '/GETXH WEB NEW LOGO.png',
      vibrate: [600, 150, 600, 150, 1000],
      tag: 'gx-alert-' + Date.now(),
      renotify: true,
      requireInteraction: true
    });
  }
});

// Push notification listener (FCM / Web Push support)
self.addEventListener('push', (event) => {
  let payload = { title: '🚨 GetXH Alert', body: 'New order or payment received!' };
  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch (_) {
    if (event.data) payload.body = event.data.text();
  }

  const options = {
    body: payload.body || 'New order or payment received on GetXH',
    icon: '/GETXH WEB NEW LOGO.png',
    badge: '/GETXH WEB NEW LOGO.png',
    vibrate: [600, 150, 600, 150, 1000],
    tag: payload.tag || ('gx-push-' + Date.now()),
    renotify: true,
    requireInteraction: true,
    data: { url: '/admin/' }
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || '🚨 GetXH Alert', options)
  );
});
