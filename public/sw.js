// Offline support for the installed web app (PWA). Pages: network first, so a new version
// is picked up at once; everything else: cached copy first, refreshed in the background.
// Spielstände liegen NICHT hier, sondern im localStorage des Browsers.
const CACHE = "felice-elias-v1";

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(["./", "./manifest.webmanifest"])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(response => { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put("./", copy)); return response; }).catch(() => caches.match("./")));
    return;
  }
  event.respondWith(caches.open(CACHE).then(cache => cache.match(request).then(cached => {
    const network = fetch(request).then(response => { if (response.ok) cache.put(request, response.clone()); return response; }).catch(() => cached);
    return cached ?? network;
  })));
});
