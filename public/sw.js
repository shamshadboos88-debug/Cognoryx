// public/sw.js — COGNORYX Service Worker v4
const CACHE     = 'cognoryx-v4';
const OFFLINE   = '/offline.html';
const PRECACHE  = ['/', '/dashboard', '/offline.html', '/manifest.json', '/icons/icon-192x192.png', '/icons/icon-512x512.png'];

// ── Install ───────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ──────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;

  // Skip external requests
  if (url.origin !== location.origin) return;

  // API — network only
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'Offline — no internet connection.' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503,
        })
      )
    );
    return;
  }

  // Pages & assets — network first, cache fallback
  e.respondWith(
    fetch(request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.destination === 'document') return caches.match(OFFLINE);
        return new Response('Offline', { status: 503 });
      })
  );
});

// ── Push notifications ────────────────────────────────
self.addEventListener('push', e => {
  const d = e.data?.json() ?? {};
  e.waitUntil(
    self.registration.showNotification(d.title || 'COGNORYX', {
      body:    d.body || 'You have a new message.',
      icon:    '/icons/icon-192x192.png',
      badge:   '/icons/icon-192x192.png',
      vibrate: [100, 50, 100],
      data:    { url: d.url || '/dashboard' },
    })
  );
});

// ── Notification click ────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/dashboard';
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
      for (const c of list) {
        if (c.url === url && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── Background sync ───────────────────────────────────
self.addEventListener('sync', e => {
  if (e.tag === 'sync-data') e.waitUntil(Promise.resolve());
});
