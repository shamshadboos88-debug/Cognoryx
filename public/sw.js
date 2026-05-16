// ═══════════════════════════════════════════════════════
//  COGNORYX Service Worker — public/sw.js
//  Handles: caching, offline, background sync, push
// ═══════════════════════════════════════════════════════

const CACHE_NAME    = 'cognoryx-v3';
const OFFLINE_URL   = '/offline.html';

// Assets to cache immediately on install
const PRECACHE = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ── Install ───────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch strategy ────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin API calls
  if (request.method !== 'GET') return;
  if (url.origin !== location.origin) return;

  // API calls — network only, no cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'You are offline. Please reconnect.' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503,
        })
      )
    );
    return;
  }

  // Pages & assets — network first, fallback to cache, then offline page
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Fallback to offline page for navigation requests
        if (request.destination === 'document') {
          return caches.match(OFFLINE_URL);
        }
        return new Response('Offline', { status: 503 });
      })
  );
});

// ── Push notifications ────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title   = data.title   || 'COGNORYX';
  const options = {
    body:    data.body    || 'You have a new message from COGNORYX AI.',
    icon:    '/icons/icon-192x192.png',
    badge:   '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data:    { url: data.url || '/dashboard' },
    actions: [
      { action: 'open',    title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss'  },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click ────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── Background sync ───────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  // Placeholder for background message sync
  console.log('[SW] Background sync triggered');
}
