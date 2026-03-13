# Peppy Tools Portal V.0.2.0

A collection of seven powerful, fully client-side browser tools. No server required — works offline and can be hosted on GitHub Pages for free.

---

## What's New in V.0.2.0

* **Security:** Fixed XSS vulnerabilities in QR scanner (scan results, scan history, batch barcodes) and People Tools (name chips, history, attendance table) using DOM-safe helpers (`escHtml`, `_safeScanNode`)
* **PWA:** Added `manifest.json` — the portal can now be installed as a Progressive Web App on desktop and mobile
* **Home page:** Redesigned with hero section, live search/filter, stats bar, per-card tags and feature badges, recent-tools tracker, privacy banner, and SW update notification
* **Service Worker:** Cache bumped to `peppy-v2`; broadcasts `SW_UPDATED` message to clients after a new version activates
* **GitHub Pages:** Added `.nojekyll` to prevent Jekyll processing

---

## Live Demo

Host the folder on GitHub Pages or open `index.html` locally in any modern browser.

---

## Project Structure

```
/
├── index.html                    # Portal landing page
├── manifest.json                 # PWA manifest
├── .nojekyll                     # Prevents GitHub Pages Jekyll processing
├── README.md
├── requirements.md
├── sw.js                         # Service Worker (offline cache)
├── advanced-notepad/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── table-generator/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── dev-tools/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── random-tools/
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
├── pdf-tools/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── vendor/
    ├── qrcode.min.js
    ├── JsBarcode.all.min.js
    ├── js-yaml.min.js
    ├── marked.min.js
    └── katex/
```

---

## Running Locally

1. Clone or download this repository.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).
3. No build step, no dependencies to install — everything is plain HTML/CSS/JS.

> **Note:** The File > Open / Save features use the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) fallback (`<input type="file">` + Blob download). All file access is local and nothing is sent to a server.

---

## Deploying to GitHub Pages

1. Push the repository to GitHub.
2. Go to **Settings → Pages**.
3. Set **Source** to `main` branch, root folder `/`.
4. Visit `https://<your-username>.github.io/<repo-name>/`.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| All pages | Vanilla HTML5 / CSS3 / ES2020 JS |
| Markdown rendering | [marked.js v9](https://cdn.jsdelivr.net/npm/marked@9/) |
| LaTeX rendering | [KaTeX v0.16](https://cdn.jsdelivr.net/npm/katex@0.16/) |
| QR code generation | [qrcodejs](https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js) |
| Barcode generation | [JsBarcode](https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.6/JsBarcode.all.min.js) |
| YAML parsing | [js-yaml v4](https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js) |
| PDF manipulation | [pdf-lib v1.17](https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js) |
| PDF rendering | [PDF.js v3.11](https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js) |
| Fonts / Icons | System fonts, Unicode symbols |
| Hosting | GitHub Pages (static) |

---

## PWA / Offline Support

The portal ships with a Service Worker (`sw.js`) and a `manifest.json`:

- All pages and vendor assets are pre-cached on first visit.
- A "New version available" banner appears automatically when a new service worker installs.
- The portal meets PWA installability criteria — browsers will offer an "Install App" prompt.
- Cache name: `peppy-v2` (bump this string in `sw.js` to force a cache refresh on deploy).

---

## Theme System

All pages share a unified dark / light theme:

- Persisted in `localStorage` under key `stp-theme` (`"dark"` | `"light"`).
- Applied via `data-theme` attribute on `<html>` before first paint (no flash).
- Toggle button in every app header.
- Default theme: **dark**.

---

## Peppy Advanced Notepad

### Features

| Feature | Details |
|---------|---------|
| File operations | New, Open (local), Save, Save As |
| Edit | Undo/Redo, Cut/Copy/Paste, Select All, Delete |
| Find & Replace | Regex-safe search, match case, whole word |
| Word Wrap | Toggle on/off |
| Line Numbers | Toggle gutter |
| Font & Size | 7 font families, sizes 10–72px |
| Zoom | Ctrl+`+` / Ctrl+`-` / Ctrl+`0`, shown in status bar |
| Markdown Preview | Full-screen preview (Ctrl+P) |
| **Split Preview** | Side-by-side editor + live Markdown/LaTeX (Ctrl+Shift+P) |
| LaTeX rendering | Inline `$…$` and display `$$…$$` via KaTeX |
| Word Count | Live word count in status bar |
| Auto-save Draft | Content auto-saved to localStorage, restored on reload |
| Insert Date/Time | Ctrl+Shift+D inserts current date/time at cursor |
| Tab as Spaces | Tab key inserts 2 spaces |
| Scroll Sync | Preview scroll follows editor in split mode |
| Dark / Light Theme | Toggle in header, persisted to localStorage |

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
| Table sizing | Add/remove rows & columns; direct row/col count inputs |
| Merge & Split | Merge selected cells; split merged cell |
| Header rows/cols | Toggle `<th>` for first row, first column, or both |
| Table styling | Border width/color, background, width, alignment, cell padding |
| Cell styling | Text/background color, font size, weight, style, h-align, v-align, padding |
| Export | HTML, Markdown, LaTeX, CSV; copy HTML to clipboard |
| Import | Paste raw HTML or CSV |
| Spreadsheet paste | TSV paste from Excel / Google Sheets fills cells automatically |
| **Right-click menu** | Insert/delete row/col, **Copy Cell**, **Paste Cell** |
| **Undo / Redo** | Ctrl+Z / Ctrl+Y restores up to 50 table state snapshots |
| **Zoom** | A− / A+ / ⊙ controls in toolbar; scales table font only |
| **Status bar** | Shows table dimensions (rows × columns) and current zoom |
| **Keyboard nav** | Tab / Shift+Tab moves between cells; Enter / Shift+Enter moves down/up |
| Dark / Light Theme | Toggle in header, persisted to localStorage |

### Right-Click Context Menu

| Option | Action |
|--------|--------|
| ↑ Insert Row Above | Insert new row above right-clicked cell |
| ↓ Insert Row Below | Insert new row below right-clicked cell |
| ← Insert Column Left | Insert new column left of right-clicked cell |
| → Insert Column Right | Insert new column right of right-clicked cell |
| ✕ Delete Row | Delete the row containing right-clicked cell |
| ✕ Delete Column | Delete the column containing right-clicked cell |
| 📋 Copy Cell | Copy right-clicked cell text to internal clipboard + system clipboard |
| 📄 Paste Cell | Paste clipboard text into all selected cells |

---

## Peppy Dev Tools

### Features

| Feature | Details |
|---------|----------|
| Encoding & Security | Base64, URL Encoder, Hash Generator, Password Generator, UUID Generator, JWT Decoder, HTML Entities |
| Text Tools | Diff, Sorter, Dedup Lines, Random String, Lorem Ipsum, Text Statistics |
| JSON / Data | JSON Formatter, JSON Viewer, JSON Validator, JSON→CSV, JSON→YAML, YAML→JSON, XML Formatter, XML→JSON |
| Colors | Color Converter, Color Picker, Contrast Checker, Palette Generator |
| Timestamps | Unix Converter, Date Calculator, Date Formatter, World Clocks |
| Regex | Pattern Tester, Find & Replace, Reference Cheatsheet |
| **Grouped sidebar** | 6 collapsible groups, 32 tools total, single-page navigation |
| **Top group nav** | Icon bar jumps to any group and highlights the active one |
| Dark / Light Theme | Toggle in header, persisted to localStorage |

---

## Peppy Random Tools

### Features

| Feature | Details |
|---------|---------|
| Wheel Spinner | Customizable spin wheel with sound, confetti and winner reveal |
| Yes/No Generator | Animated coin-flip style binary decision |
| Option Picker | Pick randomly from a user-defined list |
| Number Generator | Min/max range, exclude list, multiple picks |
| Dice Roller | 1–10 dice, any face count (d4 → d100), roll history |
| Coin Flipper | Heads/tails with streak tracking |
| Card Drawer | Standard 52-card deck, draw multiple, reshuffle |
| Day Generator | Random day of the week or date in range |
| Time Generator | Random time within a configurable window |
| Winner Picker | Pick one or more winners with medal display |
| **History** | All tools track results with timestamps |
| Dark / Light Theme | Toggle in header, persisted to localStorage |

---

## Peppy People & Group Tools

### Features

| Feature | Details |
|---------|---------|
| Person Picker | Slot-machine animation, no-repeat pool, history |
| Host Picker | Round-robin rotation with cycle tracking |
| Attendance | Roll call with Present/Absent toggles, CSV export |
| Speaker Selector | Ordered queue or random, round-robin tracking |
| Winner Picker | Medal display, configurable count, allow-duplicates option |
| Team Generator | Configurable team count & editable team names, export |
| Pair Generator | Even/odd handling (trio fallback), export |
| Group Creator | By group count or by group size |
| Seating Chart | Configurable columns, row labels, show-empty seats option |
| Name Shuffler | Randomize order; updates result list in-place |
| Secret Santa | Derangement algorithm with exclusions; blur/reveal per person; export |
| **Saved Lists** | Sidebar to save, rename, load and delete named name lists via localStorage |
| **Bulk Add / Import** | Add names via comma prompt or import a `.txt`/`.csv` file |
| Dark / Light Theme | Toggle in header, persisted to localStorage |

---

## Peppy QR & Barcode Tools

### Features

| Feature | Details |
|---------|---------|
| QR Generator | 7 input types: URL, plain text, WiFi, vCard, Email, SMS, Phone |
| QR options | Size slider, error correction level (L/M/Q/H), dark/light color pickers |
| Logo overlay | Upload a logo PNG/SVG to embed centered in the QR code |
| QR export | Download as PNG or copy to clipboard |
| Batch QR | Generate and zip-download multiple QR codes from a line-separated list |
| QR Scanner | Scan QR codes via device camera; URL results open as links; scan history |
| Barcode Generator | 15+ formats: CODE128, CODE39/93, EAN-13/8/5/2, UPC, ITF-14, MSI variants, Pharmacode, Codabar |
| Barcode options | Width/height sliders, line/background colors, display-value, flat bars, font size |
| Barcode export | SVG download or PNG (canvas render) |
| Batch Barcodes | Generate and download barcodes for a list of values |
| Dark / Light Theme | Toggle in header, persisted to localStorage |

---

## Peppy PDF Tools

### Features

| Feature | Details |
|---------|----------|
| **Merge / Combine PDF** | Combine multiple PDFs in drag-reorderable order into a single file |
| **Split PDF** | Split into individual pages or custom page ranges |
| **Extract Pages** | Extract a subset of pages (ranges supported) into a new PDF |
| **Delete Pages** | Remove specific pages or ranges; download the remainder |
| **Rotate PDF Pages** | Rotate all, odd, even, or custom pages by 90° / 180° / 270° |
| **Rearrange Pages** | Drag thumbnail previews or enter a custom numeric order |
| **Add Watermark** | Diagonal text watermark with configurable text, size, opacity, color, and angle |
| **Add Page Numbers** | Stamp page numbers at 6 positions with configurable format and color |
| **Convert Images to PDF** | JPG, PNG, GIF, BMP, WEBP → PDF; fit-image or A4/Letter/A3/A5 page sizes |
| **PDF Viewer** | In-browser viewer with page navigation and zoom slider |
| **Compress PDF** | Strip metadata and re-serialize with object streams to reduce file size |
| **Crop PDF Pages** | Set per-page crop box margins (in points) for all or custom pages |
| **Resize PDF Pages** | Rescale pages to A4, Letter, Legal, A3, A5, or custom dimensions |
| **Flatten PDF** | Flatten interactive AcroForm fields into static page content |
| **Remove PDF Metadata** | Strip title, author, subject, keywords, creator, producer, and XMP stream |
| **Add Password** | AES-256 encryption with user password (to open) and owner password |
| **Remove Password** | Decrypt a password-protected PDF using the known password |
| **Lock PDF (Read-Only)** | Apply permission flags to disallow print, copy, edit, and annotation |
| **Redact PDF** | Draw redaction boxes on a rendered page preview; permanently applied on save |
| **Remove Hidden Data** | Strip metadata, XMP stream, embedded JS, annotation data, and embedded files |
| **Grouped sidebar** | 5 collapsible groups with icon top-nav for quick access |
| Dark / Light Theme | Toggle in header, persisted to localStorage |

### Libraries Used

| Library | Purpose |
|---------|---------|
| [pdf-lib v1.17](https://pdf-lib.js.org/) | Create, modify, merge, split, encrypt, watermark, rotate pages, add text |
| [PDF.js v3.11](https://mozilla.github.io/pdf.js/) | Render PDF pages to `<canvas>` for thumbnail thumbnails, viewer, and redaction |

---

## Browser Support

Tested on:
- Chrome 120+
- Edge 120+
- Firefox 121+
- Safari 17+

All features use standard Web Platform APIs with no polyfills needed.

> **Note:** QR scanning uses the `BarcodeDetector` API (Chrome/Edge 83+) with a [jsQR](https://github.com/cozmo/jsQR) fallback for other browsers.

---

## License

MIT — free to use, modify, and distribute.

