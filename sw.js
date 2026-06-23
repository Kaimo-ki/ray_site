const CACHE_NAME = "ray-web-v8";
const ASSETS = [
  "/ray_site/",
  "/ray_site/index.html",
  "/ray_site/styles.css",
  "/ray_site/script.js",
  "/ray_site/config.js",
  "/ray_site/manifest.webmanifest",
  "/ray_site/offline.html",
  "/ray_site/assets/ray-avatar.png",
  "/ray_site/assets/icon-192.png",
  "/ray_site/assets/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => (
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => (
      cached || fetch(event.request).catch(() => caches.match("/ray_site/offline.html"))
    ))
  );
});
