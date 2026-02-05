const CACHE_NAME = "cse-tracker-v1";
const OFFLINE_URL = "/offline";

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  "/",
  "/login",
  "/offline",
  "/demo.png",
  "/favicon.ico",
];

// Install event - precache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Precaching assets");
      return cache.addAll(PRECACHE_ASSETS);
    }),
  );
  // Force the waiting service worker to become active
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          }),
      );
    }),
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - network first with cache fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip API requests - always fetch from network
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // For navigation requests (HTML pages)
  if (request.mode === "navigate") {
    // Skip caching for authenticated routes to prevent sensitive data persistence
    const authenticatedPaths = [
      "/dashboard",
      "/portfolio",
      "/transactions",
      "/settings",
      "/rules",
      "/alerts",
      "/goals",
      "/simulator",
      "/profile",
    ];
    const isAuthenticatedRoute = authenticatedPaths.some((path) =>
      url.pathname.startsWith(path),
    );

    if (isAuthenticatedRoute) {
      // Always fetch from network for authenticated routes, fallback to offline page
      event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
      return;
    }

    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses for non-authenticated pages
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline, try cache first, then offline page
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match(OFFLINE_URL);
          });
        }),
    );
    return;
  }

  // For static assets - stale-while-revalidate strategy
  // Optimize Next.js static assets (Cache First - Immutable)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Return cached response immediately if available
        if (cachedResponse) {
          return cachedResponse;
        }
        // Otherwise fetch from network and cache
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      }),
    );
    return;
  }

  // For other static assets - stale-while-revalidate strategy
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      }),
    );
    return;
  }

  // Default: network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(request)),
  );
});
