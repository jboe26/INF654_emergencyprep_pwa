const CACHE_NAME = "emergency-prep-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/styles.css",
  "https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
];

// Install event: cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event: serve cached assets when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
