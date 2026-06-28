# Peppy Tools — v0.5.2

Nine fully client-side browser tools bundled as a Progressive Web App. No server required — everything runs in the browser, works offline, and can be hosted on GitHub Pages.

---

## Tools

| Tool | Description |
|------|-------------|
| Advanced Notepad | Full-featured plain-text / Markdown / LaTeX editor |
| Table Generator | Visual HTML table builder with rich export options |
| Dev Tools | 34 utilities for encoding, formatting, text, JSON/YAML, colors, regex, timestamps |
| Random Tools | 11 randomisation utilities — wheel spinner, dice, cards, and more |
| People & Group Tools | 11 people-management utilities — picker, teams, seating, Secret Santa |
| QR & Barcode Tools | QR generator, scanner, batch QR, 15+ barcode formats |
| Easy PDF Tools | 20 non-destructive PDF operations with no upload required |
| PDF Mini Editor BETA | Full PDF editing workspace — reorder, annotate, redact, export |
| Clock Tools | Stopwatch, countdown, world clocks, Pomodoro, alarm |

---

## Quick Start

1. Clone or download this repository.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).
3. No build step, no server, no install — everything is plain HTML / CSS / JS.

### Running Unit Tests

```bash
npm install
npm test          # runs Vitest (26 tests)
```

---

## Deploying to GitHub Pages

1. Push the repository to GitHub.
2. Go to **Settings → Pages**.
3. Set **Source** to the `main` branch, root folder `/`.
4. Visit `https://<your-username>.github.io/<repo-name>/`.

---

## Project Structure

```
/
├── index.html                    # Portal landing page
├── manifest.json                 # PWA manifest
├── sw.js                         # Service Worker (offline cache — peppy-v7)
├── package.json                  # Node manifest (Vitest dev dependency)
├── advanced-notepad/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── clock-tools/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── dev-tools/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── pdf-editor/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── pdf-tools/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── people-tools/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── qr-barcode/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── random-tools/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── table-generator/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── lib/
│   ├── shared-utils.js           # Shared HTML-escaping utilities (escHtml)
│   ├── shared-ui.js              # Shared UI — theme toggle, fullscreen, sidebar
│   ├── pdf-utils.js              # Shared PDF utility functions + PAGE_SIZES
│   ├── error-handler.js          # Global error / rejection handler with toast
│   ├── bootstrap/
│   │   └── css/bootstrap.min.css
│   │   └── js/bootstrap.bundle.min.js
│   └── bootstrap-icons/
│       └── bootstrap-icons.min.css
├── tests/
│   └── utils.test.js             # Vitest unit tests
└── notes/
    ├── tech_review.md
    └── changes.md
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Core | Vanilla HTML5 / CSS3 / ES2020 — no framework |
| CSS framework | [Bootstrap 5](https://getbootstrap.com/) (local copy) |
| Icons | [Bootstrap Icons](https://icons.getbootstrap.com/) (local copy) |
| Markdown rendering | [marked.js v9](https://cdn.jsdelivr.net/npm/marked@9/marked.min.js) |
| LaTeX rendering | [KaTeX v0.16](https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.js) |
| QR code generation | [qrcodejs v1.0.0](https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js) |
| Barcode generation | [JsBarcode v3](https://cdn.jsdelivr.net/npm/jsbarcode@3/dist/JsBarcode.all.min.js) |
| YAML parsing / serialisation | [js-yaml v4](https://cdn.jsdelivr.net/npm/js-yaml@4/dist/js-yaml.min.js) |
| PDF manipulation | [@cantoo/pdf-lib v2.6.2](https://cdn.jsdelivr.net/npm/@cantoo/pdf-lib@2.6.2/dist/pdf-lib.min.js) — AES-256 encryption |
| PDF rendering | [PDF.js v3.11.174](https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js) |
| CDN | [jsDelivr](https://www.jsdelivr.com/) — all CDN resources have SRI hashes |
| Testing | [Vitest v4](https://vitest.dev/) |
| Hosting | GitHub Pages (static) |

---

## PWA / Offline Support

- Local assets and CDN dependencies are pre-cached on first visit via `sw.js`.
- A "New version available" banner appears when a new service worker installs.
- The portal meets PWA installability criteria — browsers offer an "Install App" prompt.
- Cache key: `peppy-v7` (bump in `sw.js` to force a cache refresh on deploy).

---

## Theme System

All pages share a unified dark / light theme:

- Persisted in `localStorage` under key `stp-theme` (`"dark"` | `"light"`).
- Applied via `data-theme` on `<html>` before first paint — no flash of unstyled content.
- Toggle button in every tool header.
- Default: **dark**.

---

## Security

- All CDN `<script>` and `<link>` tags carry `integrity="sha384-…"` + `crossorigin="anonymous"` (SRI).
- User-supplied content is always passed through `escHtml()` before being set as `innerHTML`.
- Randomisation (shuffle, dice, pickers) uses `crypto.getRandomValues()` — not `Math.random()`.
- Global error handler (`lib/error-handler.js`) catches uncaught errors and unhandled promise rejections, logs to console, and shows a 5-second toast.

---

## Peppy Advanced Notepad

### Features

| Feature | Details |
|---------|---------|
| File operations | New, Open (local), Save, Save As |
| Edit | Undo / Redo, Cut / Copy / Paste, Select All, Delete |
| Find & Replace | Regex-safe search, match case, whole word |
| Word Wrap | Toggle on / off |
| Line Numbers | Toggle gutter |
| Font & Size | 7 font families, sizes 10–72 px |
| Zoom | Ctrl+`+` / Ctrl+`-` / Ctrl+`0`, shown in status bar |
| Markdown Preview | Full-screen preview (Ctrl+P) |
| Split Preview | Side-by-side editor + live Markdown / LaTeX (Ctrl+Shift+P) |
| LaTeX rendering | Inline `$…$` and display `$$…$$` via KaTeX |
| Word Count | Live word count in status bar |
| Auto-save Draft | Content auto-saved to localStorage, restored on reload |
| Auto-save indicator | Status bar flashes "Saved" on each auto-save |
| Insert Date/Time | Ctrl+Shift+D inserts current date/time at cursor |
| Tab as Spaces | Tab key inserts 2 spaces |
| Scroll Sync | Preview scroll follows editor in split mode |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+N | New file |
| Ctrl+O | Open file |
| Ctrl+S | Save |
| Ctrl+Shift+S | Save As |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+F | Find |
| Ctrl+H | Find & Replace |
| Ctrl+P | Toggle Markdown Preview |
| Ctrl+Shift+P | Toggle Split Preview |
| Ctrl+Shift+D | Insert current Date/Time |
| Ctrl++ | Zoom In |
| Ctrl+- | Zoom Out |
| Ctrl+0 | Reset Zoom |
| Tab | Insert 2 spaces |
| Escape | Close dialogs |

---

## Peppy Table Generator

### Features

| Feature | Details |
|---------|---------|
| Table sizing | Add / remove rows & columns; direct row / col count inputs |
| Merge & Split | Merge selected cells; split merged cell |
| Header rows / cols | Toggle `<th>` for first row, first column, or both |
| Table styling | Border width / color, background, width, alignment, cell padding |
| Cell styling | Text / background color, font size, weight, style, h-align, v-align, padding |
| Export | HTML, Markdown, LaTeX, CSV; copy HTML to clipboard (Clipboard API, `execCommand` fallback) |
| Import | Paste raw HTML or CSV |
| Spreadsheet paste | TSV paste from Excel / Google Sheets fills cells automatically |
| Right-click menu | Insert / delete row/col, Copy Cell, Paste Cell |
| Undo / Redo | Ctrl+Z / Ctrl+Y restores up to 50 table state snapshots |
| Reset Table | Reset button with confirmation, clears to 3 × 3 defaults |
| Zoom | A− / A+ / ⊙ controls in toolbar; scales table font only |
| Status bar | Shows table dimensions (rows × columns) and current zoom |
| Keyboard nav | Tab / Shift+Tab moves between cells; Enter / Shift+Enter moves down / up |

---

## Peppy Dev Tools

### Features

| Category | Tools |
|----------|-------|
| Encoding & Security | Base64, URL Encoder, Hash Generator, Password Generator, UUID Generator, JWT Decoder, HTML Entities |
| Text | Diff, Sorter, Dedup Lines, Random String, Lorem Ipsum, Text Statistics |
| JSON / Data | JSON Formatter, JSON Viewer, JSON Validator, JSON→CSV, JSON→YAML (via js-yaml), YAML→JSON, XML Formatter, XML→JSON |
| Colors | Color Converter, Color Picker, Contrast Checker, Palette Generator |
| Timestamps | Unix Converter, Date Calculator, Date Formatter |
| Regex | Pattern Tester, Find & Replace, Reference Cheatsheet |

34 tools total across 7 collapsible sidebar groups.

---

## Peppy Random Tools

### Features

| Feature | Details |
|---------|---------|
| Wheel Spinner | Customizable spin wheel with sound, confetti, and winner reveal; rebuild on theme change |
| Wheel History | Tracks last 20 spin results |
| Yes / No Generator | Animated coin-flip style binary decision |
| Option Picker | Pick randomly from a user-defined list |
| Number Generator | Min / max range, exclude list, multiple picks |
| Dice Roller | 1–10 dice, any face count (d4 → d100), roll history |
| Coin Flipper | Heads / tails with streak tracking |
| Card Drawer | Standard 52-card deck, draw multiple, reshuffle |
| Day Generator | Random day of the week or date in range |
| Time Generator | Random time within a configurable window |
| Winner Picker | Pick one or more winners with medal display |

All randomisation uses `crypto.getRandomValues()`.

---

## Peppy People & Group Tools

### Features

| Feature | Details |
|---------|---------|
| Person Picker | Slot-machine animation, no-repeat pool, history |
| Host Picker | Round-robin rotation with cycle tracking |
| Attendance | Roll call with Present / Absent toggles, CSV export |
| Speaker Selector | Ordered queue or random, round-robin tracking |
| Winner Picker | Medal display, configurable count, allow-duplicates option |
| Team Generator | Configurable team count & editable team names, export |
| Pair Generator | Even / odd handling (trio fallback), export |
| Group Creator | By group count or by group size |
| Seating Chart | Configurable columns, row labels, show-empty seats option |
| Name Shuffler | Randomize order; updates result list in-place |
| Secret Santa | Derangement algorithm with exclusions; blur / reveal per person; export |
| Saved Lists | Sidebar to save, rename, load and delete named name lists via localStorage |
| Bulk Add / Import | Add names via comma prompt or import a `.txt` / `.csv` file |
| Copy Results | 📋 Copy button on all generator outputs |

---

## Peppy QR & Barcode Tools

### Features

| Feature | Details |
|---------|---------|
| QR Generator | 7 input types: URL, plain text, WiFi, vCard, Email, SMS, Phone |
| QR options | Size slider, error correction level (L / M / Q / H), dark / light color pickers |
| QR size presets | Small (128 px) / Medium (256 px) / Large (512 px) one-click buttons |
| Logo overlay | Upload a logo PNG / SVG to embed centered in the QR code |
| QR export | Download as PNG or copy to clipboard |
| Batch QR | Generate and zip-download multiple QR codes from a line-separated list |
| QR Scanner | Scan QR codes via device camera; URL results open as links; scan history |
| Barcode Generator | 15+ formats: CODE128, CODE39/93, EAN-13/8/5/2, UPC, ITF-14, MSI variants, Pharmacode, Codabar |
| Barcode options | Width / height sliders, line / background colors, display-value, flat bars, font size |
| Barcode export | SVG download or PNG (canvas render) |
| Batch Barcodes | Generate and download barcodes for a list of values |
| Auto-generate toggle | Enable / disable auto-generation on input; manual Generate button when disabled |

---

## Peppy Easy PDF Tools

20 PDF operations — all processing is done locally in the browser; no file ever leaves the device.

| Tool | Details |
|------|---------|
| Merge / Combine | Combine multiple PDFs in drag-reorderable order |
| Split PDF | Into individual pages or custom page ranges |
| Extract Pages | Extract a page range into a new PDF |
| Delete Pages | Remove specific pages or ranges |
| Rotate Pages | All / odd / even / custom pages by 90° / 180° / 270° |
| Rearrange Pages | Drag thumbnails or enter a custom numeric order |
| Add Watermark | Text, size, opacity, color, angle, and position (5 spots) |
| Add Page Numbers | Stamp at 6 positions with configurable format and color |
| Convert Images to PDF | JPG, PNG, GIF, BMP, WEBP → PDF; fit-image or preset page sizes |
| PDF Viewer | In-browser viewer with page navigation and zoom |
| Compress PDF | Strip metadata and re-serialize with object streams |
| Crop Pages | Per-page crop box margins in points |
| Resize Pages | Rescale to A4, Letter, Legal, A3, A5, or custom dimensions |
| Flatten PDF | Flatten AcroForm fields into static content |
| Remove Metadata | Strip title, author, subject, keywords, creator, producer, XMP |
| Add Password | AES-256 encryption with user and owner passwords and permission flags |
| Remove Password | Decrypt a password-protected PDF using the known password |
| Lock PDF (Read-Only) | Permission flags: disallow print, copy, edit, annotations |
| Redact PDF | Draw redaction boxes on a rendered preview; permanently burned in on save |
| Remove Hidden Data | Strip metadata, XMP, embedded JS, annotation data, embedded files |

### Libraries Used

| Library | Purpose |
|---------|---------|
| [@cantoo/pdf-lib v2.6.2](https://cdn.jsdelivr.net/npm/@cantoo/pdf-lib@2.6.2) | Create, modify, merge, encrypt, watermark, rotate, stamp pages |
| [PDF.js v3.11.174](https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174) | Render pages to `<canvas>` for viewer, thumbnails, and redaction |

---

## Peppy PDF Mini Editor BETA

Full PDF editing workspace — process everything locally; nothing leaves the browser.

### Features

| Feature | Details |
|---------|---------|
| Open / Merge | Unified import dialog — PDFs and JPEG/PNG images in any order; drag-drop to reorder before merging |
| Encrypted PDF | Auto-detected on open; password-unlock dialog appears automatically |
| Add More Pages | Append PDFs or images to an already-open document |
| Drag-to-Rearrange | Drag thumbnails to reorder pages in Grid view |
| Delete Pages | Removes selected pages (Grid) or current page (Reader) |
| Rotate Pages | CW / CCW in toolbar; context-aware for Grid / Reader view |
| Add Watermark | Text, size, opacity, color, angle, and position (5 spots). Apply to all / selected / page range |
| Add Page Numbers | 4 formats × 6 positions, configurable size, color, and start number |
| Crop Pages | Top / bottom / left / right margins in points. All / selected / range |
| Resize Pages | A4, Letter, Legal, A3, A5, or custom. All / selected / range |
| Text Annotation | Size, color, position (7 placements). All / selected / range |
| Redact | Draw black rectangles in Reader view; Ctrl+Z removes last rect; Apply Redact burns them permanently |
| Document Info | View / edit metadata; Remove Metadata and Remove Hidden Data actions |
| Export | Modes: **All**, **Pages** (range), **Split PDF** (every page or custom ranges). Options: Compress, Flatten, Optimized. Built-in password protection (AES-256, user/owner passwords, permission checkboxes) applied per output file |
| Compress PDF | Re-serialize with object streams; shows before / after file size |
| Undo / Redo | Up to 20 snapshots for all destructive operations |
| Dual View | Grid (thumbnail overview) ↔ Reader (single-page, 25–400% zoom) |
| Select All / Deselect | Bulk page selection in Grid view |
| Thumbnail Zoom | 50%–250% |
| Global Drag & Drop | Drop PDFs or images anywhere on the page |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo (or remove last drawn redact rect) |
| Ctrl+Y / Ctrl+Shift+Z | Redo |

### Libraries Used

| Library | Purpose |
|---------|---------|
| [@cantoo/pdf-lib v2.6.2](https://cdn.jsdelivr.net/npm/@cantoo/pdf-lib@2.6.2) | PDF creation, modification, encryption, watermark, page operations |
| [PDF.js v3.11.174](https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174) | Render pages to `<canvas>` for interactive thumbnails and Reader view |

---

## Peppy Clock Tools

### Features

| Feature | Details |
|---------|---------|
| Stopwatch | Start / stop / reset with lap tracking; displays h:mm:ss.cs |
| Countdown Timer | Set h/m/s manually or use presets (1/5/10/15/30/60 min); progress bar, audio beep, browser notification |
| World Clocks | 30+ time zones in a live-updating grid; add / remove cities |
| Pomodoro Timer | Configurable work / short-break / long-break durations and round count; auto-advances phases; beep + notification on phase change |
| Alarm Clock | Set alarm time; pulsing three-pulse audio alert via Web Audio API; snooze / dismiss controls |

> Browser notifications are only requested when a timer or alarm is started (user-gesture triggered, not at page load).

---

## Browser Support

| Browser | Minimum version |
|---------|----------------|
| Chrome | 120 |
| Edge | 120 |
| Firefox | 121 |
| Safari | 17 |

All features use standard Web Platform APIs with no polyfills.

> QR scanning uses the `BarcodeDetector` API (Chrome/Edge 83+) with a [jsQR](https://github.com/cozmo/jsQR) fallback for other browsers.

