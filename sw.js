/**
 * Danny's Garage Hub — Service Worker
 * Version: 1.0.0
 * Strategy: Cache-First for assets, Network-First for Firebase/API
 */

const CACHE_NAME = 'dannys-garage-v1';
const STATIC_CACHE = 'dannys-garage-static-v1';
const DYNAMIC_CACHE = 'dannys-garage-dynamic-v1';

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  './apple-touch-icon.png',
  // Google Fonts — cache on first use via dynamic cache
];

// Domains that should NEVER be cached (live data)
const NETWORK_ONLY_DOMAINS = [
  'firestore.googleapis.com',
  'firebase.googleapis.com',
  'firebasestorage.googleapis.com',
  'identitytoolkit.googleapis.com',
];

// Domains cached with Network-First strategy (fresh but fallback ok)
const NETWORK_FIRST_DOMAINS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// ─── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Danny\'s Garage Hub v1...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      // Use addAll with individual error handling so one missing asset won't break install
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) =>
            console.warn(`[SW] Pre-cache failed for ${url}:`, err)
          )
        )
      );
    }).then(() => {
      console.log('[SW] Install complete');
      // Activate immediately without waiting for old SW to be discarded
      return self.skipWaiting();
    })
  );
});

// ─── ACTIVATE ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete old caches that don't match current versions
            return (
              name !== STATIC_CACHE &&
              name !== DYNAMIC_CACHE &&
              name.startsWith('dannys-garage-')
            );
          })
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Activation complete — claiming clients');
      return self.clients.claim();
    })
  );
});

// ─── FETCH ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Chrome extensions and dev tools
  if (url.protocol === 'chrome-extension:') return;

  // ── Network-Only: Firebase live data ──
  if (NETWORK_ONLY_DOMAINS.some((d) => url.hostname.includes(d))) {
    event.respondWith(fetch(request));
    return;
  }

  // ── Network-First: Google Fonts (fresh preferred, cache fallback) ──
  if (NETWORK_FIRST_DOMAINS.some((d) => url.hostname.includes(d))) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // ── Cache-First: Local static assets (HTML, CSS, JS, images) ──
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // ── Stale-While-Revalidate: External CDN assets (Firebase SDK, etc.) ──
  event.respondWith(staleWhileRevalidate(request));
});

// ─── STRATEGIES ───────────────────────────────────────────────────────────────

/**
 * Cache-First: Return cached version, fall back to network + cache response.
 * Best for: local HTML, CSS, JS, images that don't change often.
 */
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    // Offline fallback for navigation requests
    if (request.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    throw err;
  }
}

/**
 * Network-First: Try network, fall back to cache.
 * Best for: fonts, versioned CDN assets.
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

/**
 * Stale-While-Revalidate: Serve from cache immediately, update in background.
 * Best for: external CDN libs (Firebase SDK, gstatic.com).
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cached); // silently fall back if offline

  return cached || fetchPromise;
}

// ─── BACKGROUND SYNC (optional, for future offline queue) ────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-garage-data') {
    console.log('[SW] Background sync triggered: sync-garage-data');
    // Future: flush queued offline writes to Firestore
  }
});

// ─── PUSH NOTIFICATIONS (optional, for future reminders) ─────────────────────
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Danny\'s Garage Hub';
  const options = {
    body: data.body || 'Ada dokumen yang perlu perhatian!',
    icon: './icon-192x192.png',
    badge: './icon-192x192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || './' },
    actions: [
      { action: 'open', title: 'Buka Aplikasi' },
      { action: 'dismiss', title: 'Nanti' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const targetUrl = event.notification.data?.url || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});

// ─── MESSAGE HANDLER (from main app) ─────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.action === 'skipWaiting') {
    console.log('[SW] Received skipWaiting message');
    self.skipWaiting();
  }

  if (event.data?.action === 'getCacheInfo') {
    caches.keys().then((keys) => {
      event.ports[0]?.postMessage({ caches: keys, version: CACHE_NAME });
    });
  }

  if (event.data?.action === 'clearCache') {
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    ).then(() => {
      event.ports[0]?.postMessage({ success: true });
      console.log('[SW] All caches cleared by app request');
    });
  }
});

console.log('[SW] Danny\'s Garage Hub Service Worker loaded ✓');
