# Peppy Tools Portal V.0.4.1

A collection of nine powerful, fully client-side browser tools. No server required — works offline and can be hosted on GitHub Pages for free.

---

## What's New in V.0.4.1 (Bug-Fix Release)

### All Tools — Sidebar clean-up
* Removed the `sidebar-top-nav` icon-button strip from all tools that had it (Clock Tools, Random Tools, Dev Tools, PDF Tools, QR & Barcode). The strip was redundant and hard to use — all groups remain navigable directly via the sidebar group headers.

### PDF Mini Editor BETA — Bug Fixes
* **Password dialog z-index** — the unlock prompt for encrypted PDFs now correctly appears on top of the Open/Merge dialog instead of behind it.
* **Export with password now works** — switched to `@cantoo/pdf-lib` (a drop-in fork of pdf-lib that adds `userPassword` / `ownerPassword` / `permissions` encryption in `save()`). Exported PDFs are now properly password-protected.
* **Grid view race condition fixed** — added a render-sequence guard to `renderWorkspace()`. Only the most recent render completes; stale renders abort mid-flight. The grid is now cleared eagerly (before the async PDF.js load) so users see an immediate refresh rather than stale thumbnails.

### Peppy Table Generator — Bug Fix
* Removed the ⚙ Settings button from the top bar — it did nothing on desktop where the settings panel is always visible. On mobile the settings panel now stacks below the table in the normal document flow (always accessible, no slide-in needed).

### Peppy Clock Tools — Bug Fixes
* **Alarm sound extended** — `playBeep()` now plays a three-pulse ascending sequence (~1.5 s) instead of a single 300 ms blip.
* **Pomodoro settings now apply immediately** — changing Work / Short Break / Long Break / Rounds updates the timer display right away when the timer is not running.

---

## What's New in V.0.4.0

### Unified Top-Bar Across All Apps
* Every app now shares the same compact top-bar with icon-only Fullscreen (⛶) and Theme (☀/☾) buttons — consistent look and feel portal-wide.
* Fullscreen toggle added to **QR & Barcode Tools** and **Easy PDF Tools** (previously missing).

### Clock Tools (NEW)
* 5 time utilities — Stopwatch (with lap tracking), Countdown Timer (with larger input font and presets), World Clocks (30+ zones), Pomodoro Timer (work/break/long-break cycles with round tracking), and Alarm Clock (with audio notification via Web Audio API).

### PDF Mini Editor BETA — Major Overhaul

#### Navigation & Layout
* **Undo / Redo** moved to the main workspace toolbar — always visible and accessible from any view.
* **Unified Zoom** — one set of zoom buttons in the toolbar controls both Grid and Reader views.
* **Grid Nav bar** — Select All, Deselect, and page count info moved below the toolbar, visible only in Grid view.
* **Manual Go-To-Page** — type a page number directly in the Reader nav to jump instantly.

#### Grid & Reader Views
* **Dual View** — Switch between multi-page thumbnail Grid and single-page Reader view via a segmented toggle in the toolbar.
* **Reader View** — Single-page rendering with page navigation and adjustable zoom (25%–400%).
* **Delete, Rotate CW, Rotate CCW** in Reader nav — apply directly to the currently displayed page.

#### Import — Encrypted PDF Handling
* **Password-Protected PDFs** — when opening any PDF that is encrypted, the app automatically detects the password protection and shows an unlock dialog. Enter the password to decrypt and load the file; the decrypted content is then added to the editor as a normal (unencrypted) document.

#### Import
* **Merge PDFs** now opens a dedicated pop-up with a drag-and-drop drop zone and an ordered file list. Use ▲/▼ arrows to reorder files before merging. Add files from multiple selections. Encrypted files in the merge list are unlocked the same way.
* **Add Pages** button renamed to **Add PDFs**.

#### Document Info
* **Remove Metadata** and **Remove Hidden Data** consolidated into the Document Info pop-up as quick-action buttons.

#### Export — Unified Single Panel
* **Export** (replaces "Export / Split / Extract") — a single collapsible panel replaces the previous four-tab dialog. The new panel provides one consistent workflow for all output scenarios:
  * **File Name** — set the output filename; used as a prefix when splitting into multiple files.
  * **All** — export the entire document as a single PDF.
  * **Pages** — export a specific page range (e.g. `1, 3-5, 8`) as a single PDF.
  * **Split PDF** — split the document into multiple files; sub-options:
    * Split every page into separate files.
    * Custom ranges (e.g. `1-3, 4, 5-7`).
  * **Options** — Compress (smaller file), Flatten form fields, Optimized (object streams) — apply to every export mode.
  * **Protect PDF** — optional password protection applied to the output file(s); when Split PDF is active, every output file is encrypted. Includes user password, owner password, and per-permission checkboxes (restrict print / copy / edit / annotations; lock read-only).
* **Remove Password** standalone button removed — decryption is now handled automatically on import (see above).

#### Redact Mode
* Draw black rectangles over sensitive content in Reader view; redactions are permanently burned into the PDF.

#### Text / Page Tools
* Text Annotation, Watermark, Page Numbers, Crop, Resize — all preserved from previous version.

### Dev Tools — World Clock Removed
* World Clocks utility removed from Dev Tools (still available in Clock Tools). Tool count now 33.

### Random Tools — Bug Fixes
* Wheel Spinner reset now clears spin history; Option Picker clear button properly rebuilds internal DOM; added Shuffle and Sort buttons for wheel options.

### QR & Barcode — Auto-Generate Toggle
* Checkbox to enable/disable auto-generation on input. When disabled, a manual Generate button appears. Removed QR Generation History section.

### Portal & Infrastructure
* 9 tool cards, updated stats, version bump to V.0.4.0.
* Service Worker cache bumped to `peppy-v4` with clock-tools and pdf-editor assets.
* Manifest updated with shortcuts for PDF Mini Editor BETA and Clock Tools.

---

## What Was New in V.0.2.0

* **Security:** Fixed XSS vulnerabilities in QR scanner (scan results, scan history, batch barcodes) and People Tools (name chips, history, attendance table) using DOM-safe helpers (`escHtml`, `_safeScanNode`)
* **PWA:** Added `manifest.json` — the portal can now be installed as a Progressive Web App on desktop and mobile
* **Home page:** Redesigned with hero section, live search/filter, stats bar, per-card tags and feature badges, recent-tools tracker, privacy banner, and SW update notification
* **Service Worker:** Cache bumped to `peppy-v2`
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
├── bug_report.md                 # Bug audit report
├── implementation.md             # Feature implementation plan
├── sw.js                         # Service Worker (offline cache, peppy-v4)
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
├── pdf-editor/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── clock-tools/
    ├── index.html
    ├── style.css
    └── app.js
```

---

## Running Locally

1. Clone or download this repository.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).
3. No build step, no dependencies to install — everything is plain HTML/CSS/JS.
4. All tools are fully responsive — desktop-first with mobile hamburger menus at < 768 px.

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
| CDN | [jsDelivr](https://www.jsdelivr.com/) — all external libraries loaded via CDN |
| Markdown rendering | [marked.js v9](https://cdn.jsdelivr.net/npm/marked@9/marked.min.js) |
| LaTeX rendering | [KaTeX v0.16](https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.js) |
| QR code generation | [qrcodejs v1.0.0](https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js) |
| Barcode generation | [JsBarcode v3](https://cdn.jsdelivr.net/npm/jsbarcode@3/dist/JsBarcode.all.min.js) |
| YAML parsing | [js-yaml v4](https://cdn.jsdelivr.net/npm/js-yaml@4/dist/js-yaml.min.js) |
| PDF manipulation | [@cantoo/pdf-lib v1.0.1](https://cdn.jsdelivr.net/npm/@cantoo/pdf-lib@1.0.1/dist/pdf-lib.min.js) |
| PDF rendering | [PDF.js v3.11.174](https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js) |
| Fonts / Icons | System fonts, Unicode symbols |
| Hosting | GitHub Pages (static) |

---

## PWA / Offline Support

The portal ships with a Service Worker (`sw.js`) and a `manifest.json`:

- Local app assets are always pre-cached on first visit.
- CDN dependencies are cached best-effort — if jsDelivr is unreachable, local assets still work offline.
- A "New version available" banner appears automatically when a new service worker installs.
- The portal meets PWA installability criteria — browsers will offer an "Install App" prompt.
- Cache name: `peppy-v4` (bump this string in `sw.js` to force a cache refresh on deploy).

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
| **Auto-save indicator** | Status bar flashes "Saved" on each auto-save |
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
| **Reset Table** | Reset button with confirmation, clears to 3 × 3 defaults |
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
| Timestamps | Unix Converter, Date Calculator, Date Formatter |
| Regex | Pattern Tester, Find & Replace, Reference Cheatsheet |
| **Grouped sidebar** | 6 collapsible groups, 33 tools total, single-page navigation |
| **Top group nav** | Icon bar jumps to any group and highlights the active one |
| Dark / Light Theme | Toggle in header, persisted to localStorage |

---

## Peppy Random Tools

### Features

| Feature | Details |
|---------|---------|
| Wheel Spinner | Customizable spin wheel with sound, confetti and winner reveal |
| **Wheel History** | Tracks last 20 spin results |
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
| **Copy Results** | 📋 Copy button on all generator outputs (Winners, Teams, Pairs, Groups, Seating, Shuffler) |
| Dark / Light Theme | Toggle in header, persisted to localStorage |

---

## Peppy QR & Barcode Tools

### Features

| Feature | Details |
|---------|---------|
| QR Generator | 7 input types: URL, plain text, WiFi, vCard, Email, SMS, Phone |
| QR options | Size slider, error correction level (L/M/Q/H), dark/light color pickers |
| **QR size presets** | Small (128 px) / Medium (256 px) / Large (512 px) one-click buttons |
| **QR generation history** | Tracks last 20 generated codes with type, content preview, and timestamp |
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

## Peppy Easy PDF Tools

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

## Peppy PDF Mini Editor BETA

### Features

| Feature | Details |
|---------|----------|
| **Open / Merge PDF(s) & Images** | Unified import dialog — add PDFs and/or JPEG/PNG images in any order; drag-drop to reorder before merging; supports single-file open or multi-file merge in one step |
| **Password-Protected PDF on Open** | When importing an encrypted PDF, the app automatically detects the password and prompts for it — enter the password to decrypt and load the file as a normal (unencrypted) document, ready to edit and export |
| **Add More Pages** | Append PDFs or images to an already-open document via the toolbar button |
| **Drag-to-Rearrange** | Drag page thumbnails to reorder pages visually in the grid |
| **Delete Pages** | Context-aware Delete button in toolbar: removes selected pages (Grid view) or the current page (Reader view) |
| **Rotate Pages** | Context-aware CW / CCW rotate buttons in toolbar: rotate selected pages (Grid) or the current page (Reader) |
| **Add Watermark** | Configurable text, font size, opacity, color, angle, and position (5 spots). Apply to all pages, selected pages, or a custom page range (e.g. 1-3, 5, 7-9) |
| **Add Page Numbers** | 4 number formats × 6 positions, configurable font size, color, and start number |
| **Crop Pages** | Set top/bottom/left/right margins in points. Apply to all pages, selected pages, or a page range |
| **Resize Pages** | Resize to A4, Letter, Legal, A3, A5, or custom dimensions. Apply to all pages, selected pages, or a page range |
| **Text Annotation** | Add text — configurable size, color, and position (7 placements). Apply to all pages, selected pages, or a page range |
| **Redact** | Draw black rectangles in Reader view; Ctrl+Z removes the last drawn rect; dedicated **Apply Redact** button burns them permanently into the PDF. Pending redactions are auto-applied before any export |
| **Document Info** | View/edit PDF metadata (title, author, subject, keywords, creator) plus stats; includes Remove Metadata and Remove Hidden Data actions |
| **Export** | Unified single-panel export with three modes — **All** (entire document), **Pages** (specific range, e.g. `1, 3-5, 8`), **Split PDF** (every page into separate files, or custom ranges). Options: Compress, Flatten, Optimized. Built-in **Protect PDF** section: user password, owner password, and per-permission checkboxes (restrict print / copy / edit / annotations; read-only lock). Protection applies to every output file when splitting. |
| **Remove Metadata** | Strip title, author, subject, keywords, creator, producer, and XMP |
| **Remove Hidden Data** | Strip metadata, XMP, embedded JS, embedded files, and annotations |
| **Compress PDF** | Re-serialize with object streams; shows before/after file size |
| **Undo / Redo** | Stack-based history (up to 20 snapshots) for all destructive operations; Ctrl+Z while drawing redact rects removes the last drawn rect |
| **Dual View** | Grid (thumbnail overview) and Reader (single-page with zoom) — toggle in toolbar |
| **Reader View** | Single-page rendering with page navigation, zoom (25%–400%), redact drawing mode |
| **Select All / Deselect** | Grid-nav bar buttons for bulk page selection |
| **Thumbnail Zoom** | Scale thumbnails from 50% to 250% |
| **Global Drag & Drop** | Drop PDFs or images anywhere on the page to import |
| **Modern Workspace UI** | Sidebar action panel + central page grid / reader; every edit instantly reflects in whichever view is active |
| Dark / Light Theme | Toggle in header, persisted to localStorage |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo (or remove last drawn redact rect if pending) |
| Ctrl+Y / Ctrl+Shift+Z | Redo |

### Libraries Used

| Library | Purpose |
|---------|---------|
| [pdf-lib v1.17](https://pdf-lib.js.org/) | PDF creation, modification, encryption, watermark, page operations |
| [PDF.js v3.11](https://mozilla.github.io/pdf.js/) | Render PDF pages to `<canvas>` for interactive thumbnails |

---

## Peppy Clock Tools

### Features

| Feature | Details |
|---------|----------|
| **Stopwatch** | Start/stop/reset with lap tracking, displays hours:minutes:seconds.centiseconds |
| **Countdown Timer** | Set hours/minutes/seconds manually or use presets (1/5/10/15/30/60 min). Progress bar, audio beep on finish, browser notification |
| **World Clocks** | 30+ time zones displayed in a grid, live auto-updating every second, add/remove cities |
| **Pomodoro Timer** | Configurable work/short-break/long-break durations and round count. Auto-advances phases, beep + notification on phase change |
| **Alarm Clock** | Set alarm time, pulsing audio alert with Web Audio API, snooze/dismiss controls |
| Dark / Light Theme | Toggle in header, persisted to localStorage |

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

