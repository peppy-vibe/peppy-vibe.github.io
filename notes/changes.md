# Changes Log — Tech Review Implementation

All items from `notes/tech_review.md` roadmap (P0 / P1 / P2) implemented.

---

## P0 — Critical (security / correctness)

| # | Issue | File(s) | Change |
|---|-------|---------|--------|
| P0-1 | KaTeX fallback XSS — unescaped `expr` in else branch | `advanced-notepad/app.js` | Escape `expr` with `&`/`<`/`>` replacement before injection, matching catch-block pattern |
| P0-2 | QR error message XSS — `innerHTML` with `e.message` | `qr-barcode/app.js` ~L215 | Replaced with DOM API (`textContent` + `createElement`) |
| P0-3 | Batch barcode error XSS — `outerHTML` with `e.message` | `qr-barcode/app.js` ~L726 | Replaced `outerHTML` with `replaceWith()` + `textContent` |
| P0-4 | People Tools inline handler injection — unescaped names in `onchange` | `people-tools/app.js` L478 | Switched to `data-name` attribute + `this.dataset.name` |
| P0-5 | Duplicate `escHtml()` definition | `random-tools/app.js` | Removed first copy (L256); single definition at ~L355 covers all call sites via hoisting |
| P0-6 | Stale service worker cache | `sw.js` L9 | Bumped cache name from `peppy-v5` → `peppy-v6` |

## P1 — High (hardening / best practices)

| # | Issue | File(s) | Change |
|---|-------|---------|--------|
| P1-1 | No Content-Security-Policy | All 10 `index.html` files | Added `<meta http-equiv="Content-Security-Policy">` with `default-src 'self'`, CDN allowlist, `'unsafe-inline'` for inline scripts/styles, `object-src 'none'` |
| P1-2 | Notification permission requested at load time | `clock-tools/app.js` | Removed `Notification.requestPermission()` from `DOMContentLoaded`; added to `timerStart()` and `pomoStart()` (user-gesture triggered) |
| P1-3 | No global error handler | `lib/error-handler.js` (new) + all 10 HTML files + `sw.js` | Created IIFE that catches `window.error` and `unhandledrejection`, logs to console, shows 5-second toast |
| P1-4 | `document.execCommand('paste')` — deprecated | `advanced-notepad/app.js` | Already implemented as Clipboard API primary with `execCommand` fallback — no change needed |
| P1-5 | `hentDecode` innerHTML on detached element — looks risky | `dev-tools/app.js` L559 | Added safety comment documenting the detached-element pattern |

## P2 — Medium (architecture / quality / a11y)

| # | Issue | File(s) | Change |
|---|-------|---------|--------|
| P2-1 | Duplicate PDF utilities across pdf-tools & pdf-editor | `lib/pdf-utils.js` (new), `pdf-tools/app.js`, `pdf-editor/app.js`, both `index.html`, `sw.js` | Extracted 6 shared functions (`readFileAsArrayBuffer`, `downloadBytes`, `stemName`, `hexToRgb`, `parsePageRanges`, `fmtBytes`) into shared module; updated `stemName` interface to accept string; updated all call sites in pdf-tools |
| P2-2 | Unbounded undo stack memory in PDF Editor | `pdf-editor/app.js` | Added 50 MB memory budget (`MAX_UNDO_BYTES`); `pushUndo()` drops oldest snapshots when over budget |
| P2-3 | Zero test coverage | `tests/utils.test.js` (new), `package.json` | Added Vitest with 14 unit tests for `fmtBytes`, `parsePageRanges`, `hexToRgb`, `stemName` |
| P2-4 | Text diff O(n²) guard too generous | `dev-tools/app.js` L597 | Tightened LCS cell limit from 250 000 → 100 000 (~300 lines each) |
| P2-5 | Icon-only buttons missing aria-labels | All 9 tool `index.html` files | Added `aria-label` to fullscreen and theme toggle buttons (18 buttons total) |

---

## New files

| File | Purpose |
|------|---------|
| `lib/error-handler.js` | Global error/rejection handler with toast UI |
| `lib/pdf-utils.js` | Shared PDF utility functions |
| `tests/utils.test.js` | Unit tests for pure utility functions |
| `package.json` | Node project manifest (Vitest dev dep) |
| `notes/tech_review.md` | Full technical review document |
| `notes/changes.md` | This file |
