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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'VIBRATE_ALERT') {
    const { title, options } = event.data;
    self.registration.showNotification(title || '🚨 GetXH Alert', options || {
      body: 'New activity on GetXH',
      vibrate: [600, 150, 600, 150, 1000],
      tag: 'gx-alert',
      renotify: true
    });
  }
});
