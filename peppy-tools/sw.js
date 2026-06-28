/* ═══════════════════════════════════════════
   Peppy Vibe Tools — Service Worker
   Caches all app assets + CDN dependencies
   on first load so tools work fully offline.
═══════════════════════════════════════════ */
'use strict';

const CACHE = 'peppy-v7';

/* ── CDN dependencies (jsDelivr) ── */
const CDN_DEPS = [
  /* marked v9 — Markdown parser */
  'https://cdn.jsdelivr.net/npm/marked@9/marked.min.js',
  /* KaTeX v0.16 — LaTeX math rendering */
  'https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.css',
  'https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.js',
  /* qrcodejs — QR code generation */
  'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js',
  /* JsBarcode v3 — Barcode generation */
  'https://cdn.jsdelivr.net/npm/jsbarcode@3/dist/JsBarcode.all.min.js',
  /* js-yaml v4 — YAML parsing */
  'https://cdn.jsdelivr.net/npm/js-yaml@4/dist/js-yaml.min.js',
  /* pdf-lib v1.17.1 — PDF creation & modification */
  'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
  /* PDF.js v3.11.174 — PDF rendering */
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
];

/* ── Local app assets ── */
const APP_ASSETS = [
  './manifest.json',
  /* Portal */
  './',
  './index.html',
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
  /* PDF Mini Editor */
  './pdf-editor/',
  './pdf-editor/index.html',
  './pdf-editor/style.css',
  './pdf-editor/app.js',
  /* Clock Tools */
  './clock-tools/',
  './clock-tools/index.html',
  './clock-tools/style.css',
  './clock-tools/app.js',
  /* Bootstrap & Bootstrap Icons (local) */
  './lib/bootstrap/css/bootstrap.min.css',
  './lib/bootstrap/js/bootstrap.bundle.min.js',
  './lib/bootstrap-icons/bootstrap-icons.min.css',
  './lib/bootstrap-icons/fonts/bootstrap-icons.woff2',
  './lib/bootstrap-icons/fonts/bootstrap-icons.woff',
  /* Global error handler */
  './lib/error-handler.js',
  /* Shared PDF utilities */
  './lib/pdf-utils.js',
  /* Shared HTML-escape utility */
  './lib/shared-utils.js',
  /* Shared UI boilerplate */
  './lib/shared-ui.js',
  /* Internationalisation (i18n) */
  './lib/i18n.js',
];

const PRECACHE = APP_ASSETS.concat(CDN_DEPS);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(async cache => {
      // Local assets must all succeed
      await cache.addAll(APP_ASSETS);
      // CDN deps are best-effort — don't block install if one fails
      await Promise.allSettled(
        CDN_DEPS.map(url =>
          fetch(url, { mode: 'cors' })
            .then(r => r.ok ? cache.put(url, r) : undefined)
            .catch(() => {})
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => {
      self.clients.claim();
      return self.clients.matchAll({ type: 'window' }).then(clients =>
        clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }))
      );
    })
  );
});

/* Cache-first strategy: serve from cache, fall back to network.
   CDN resources (cross-origin) are also cached on first successful fetch. */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request, { mode: 'cors' }).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
