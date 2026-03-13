/* ═══════════════════════════════════════════
   Peppy Vibe Tools — Service Worker
   Caches all app assets on first load so the
   tools work fully offline on repeat visits.
═══════════════════════════════════════════ */
'use strict';

const CACHE = 'peppy-v2';

const PRECACHE = [
  './manifest.json',
  /* Portal */
  './',
  './index.html',
  /* Vendor */
  './vendor/qrcode.min.js',
  './vendor/JsBarcode.all.min.js',
  './vendor/js-yaml.min.js',
  './vendor/marked.min.js',
  './vendor/katex/katex.min.css',
  './vendor/katex/katex.min.js',
  './vendor/katex/fonts/KaTeX_Main-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Main-Bold.woff2',
  './vendor/katex/fonts/KaTeX_Main-Italic.woff2',
  './vendor/katex/fonts/KaTeX_Math-Italic.woff2',
  './vendor/katex/fonts/KaTeX_AMS-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size1-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size2-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size3-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size4-Regular.woff2',
  './vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Script-Regular.woff2',
  /* Advanced Notepad */
  './advanced-notepad/',
  './advanced-notepad/index.html',
  './advanced-notepad/style.css',
  './advanced-notepad/app.js',
  /* Table Generator */
  './table-generator/',
  './table-generator/index.html',
  './table-generator/style.css',
  './table-generator/app.js',
  /* Dev Tools */
  './dev-tools/',
  './dev-tools/index.html',
  './dev-tools/style.css',
  './dev-tools/app.js',
  /* Random Tools */
  './random-tools/',
  './random-tools/index.html',
  './random-tools/style.css',
  './random-tools/app.js',
  /* People Tools */
  './people-tools/',
  './people-tools/index.html',
  './people-tools/style.css',
  './people-tools/app.js',
  /* QR & Barcode Tools */
  './qr-barcode/',
  './qr-barcode/index.html',
  './qr-barcode/style.css',
  './qr-barcode/app.js',
  /* PDF Tools */
  './pdf-tools/',
  './pdf-tools/index.html',
  './pdf-tools/style.css',
  './pdf-tools/app.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => {
      self.clients.claim();
      // Notify all open tabs that a new version is available
      return self.clients.matchAll({ type: 'window' }).then(clients =>
        clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }))
      );
    })
  );
});

/* Cache-first strategy: serve from cache, fall back to network */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
