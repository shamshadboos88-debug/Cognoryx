const CACHE_NAME = "cognoryx-v1";
self.addEventListener("install", event => { self.skipWaiting(); });
self.addEventListener("activate", event => { self.clients.claim(); });
self.addEventListener("fetch", event => {
  if (event.request.url.includes("/api/")) return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
