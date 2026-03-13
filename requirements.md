# 📄 Project Requirements

## Project Name: Peppy Tools Portal

---

## 1. Project Overview

A **static website hosted on GitHub Pages** that serves as a landing portal to seven independent static web applications:

1. **Peppy Advanced Notepad** — Windows Notepad-inspired browser text editor with Markdown + LaTeX preview
2. **Peppy Table Generator** — Feature-rich HTML table creation and export tool
3. **Peppy Dev Tools** — All developer utilities in one unified app: encoding, QR/barcode, text tools, JSON/YAML/XML, colors, timestamps, and regex (34 tools across 7 groups)
4. **Peppy Random Tools** — 10 decision and randomisation tools: wheel spinner, dice, coin flip, card drawer, and more
5. **Peppy People & Group Tools** — 11 people/team management tools: person picker, team generator, seating chart, Secret Santa, and more
6. **Peppy QR & Barcode Tools** — QR code generator/scanner and barcode generator in 15+ formats
7. **Peppy PDF Tools** — 20 client-side PDF utilities: merge, split, rotate, watermark, compress, encrypt, redact, and more

All components must be:

* 100% static (HTML, CSS, JavaScript)
* No backend server
* Deployable via GitHub Pages
* Fully client-side processing

---

## 2. System Architecture

### 2.0 Security Requirements

All components must meet the following security rules:

* **XSS prevention:** Any user-controlled string (name inputs, scanned QR values, imported data) that is inserted into the DOM must use either `element.textContent` assignment or a dedicated `escHtml(s)` helper that escapes `&`, `<`, `>`, `"`, and `'`. Direct `innerHTML` interpolation of user data is forbidden.
* **URL validation:** When displaying QR scan results as clickable links, only `https://` and `http://` schemes are permitted. The URL must be parsed with `new URL()` and the protocol checked before setting `element.href`. Any other scheme (e.g. `javascript:`, `data:`, `vbscript:`) must render as plain text.
* **No outbound requests:** All processing must be strictly client-side. No user data may be sent to any external server.
* **Subresource integrity:** CDN-loaded scripts (pdf-lib, PDF.js) should include `integrity` and `crossorigin` attributes.

### 2.1 Hosting

* Hosting Platform: GitHub Pages
* Repository Type: Public or Private (with Pages enabled)
* Deployment Branch: `main` or `gh-pages`
* No server-side runtime allowed

### 2.2 Folder Structure

```
/ (root)
 ├── index.html
 ├── manifest.json          # PWA manifest (name, icons, shortcuts, display: standalone)
 ├── .nojekyll              # Prevents GitHub Pages Jekyll processing
 ├── sw.js
 ├── /advanced-notepad
 │     ├── index.html
 │     ├── style.css
 │     └── app.js
 ├── /table-generator
 │     ├── index.html
 │     ├── style.css
 │     └── app.js
 ├── /dev-tools
 │     ├── index.html
 │     ├── style.css
 │     └── app.js
 ├── /random-tools
 │     ├── index.html
 │     ├── style.css
 │     └── app.js
 ├── /people-tools
 │     ├── index.html
 │     ├── style.css
 │     └── app.js
 ├── /qr-barcode
 │     ├── index.html
 │     ├── style.css
 │     └── app.js
 ├── /pdf-tools
 │     ├── index.html
 │     ├── style.css
 │     └── app.js
 └── /vendor
       ├── qrcode.min.js
       ├── JsBarcode.all.min.js
       ├── js-yaml.min.js
       ├── marked.min.js
       └── katex/
```

### 2.3 Service Worker & PWA Requirements

* A Service Worker (`sw.js`) must pre-cache all pages and vendor assets on first install
* Cache name must include a version string (e.g. `peppy-v2`); bumping this string in `sw.js` forces a full cache refresh on next deploy
* On `activate`, the SW must delete all caches with names that do not match the current cache name, then call `self.clients.claim()`
* After old caches are deleted, the SW must broadcast `{ type: 'SW_UPDATED' }` to all open window clients via `client.postMessage()`
* The portal page listens for `reg.updatefound` / `newWorker.statechange` and for `navigator.serviceWorker` `message` events; it shows `#update-banner` when either fires
* `manifest.json` must be included in the SW pre-cache list
* A `.nojekyll` file must exist in the repository root so GitHub Pages serves files beginning with `_` (e.g. KaTeX font files) correctly

---

## 3. Portal (index.html)

### 3.1 Functional Requirements

The index page must:

* Display project title and tagline
* Provide navigation cards linking to all seven applications
* Be responsive (mobile + desktop)
* Load fast (no external dependencies)

#### Required Sections

* **Skip link:** `<a href="#main-content" class="skip-link">` for keyboard accessibility
* **Update banner:** `#update-banner` — hidden by default; shown when Service Worker installs a new version; clicking it reloads the page
* **Offline banner:** `#offline-banner` — shown when `navigator.onLine` is false
* **Nav bar:** `⚡ Peppy Vibe Tools` logo on left; `#install-btn` (hidden until `beforeinstallprompt`) and theme-toggle button on right
* **Hero section:** eyebrow label, `<h1>`, tagline sub-heading, stats bar (7 tools / 100+ features / 0 bytes uploaded / ✓ Offline), live search input `#tool-search`
* **Recent tools section:** `#recent-section` — hidden by default; shown when `sessionStorage` has recent-tool entries; displays pill links
* **Card grid:** one card per app with icon, optional feature-count badge, title, description, tag chips, feature bullet list, and Launch button; each card carries a `data-tags` attribute for search
* **Privacy banner:** inside `<main>`, above card grid; states no data is sent to any server
* **Footer:** brand name with version number, pill list of key trust signals

#### App Cards

| Card | Link | Badge |
|------|------|-------|
| Advanced Notepad | `/advanced-notepad/` | |
| Table Generator | `/table-generator/` | |
| PDF Tools | `/pdf-tools/` | 20 tools |
| Random Tools | `/random-tools/` | 10 tools |
| People & Group Tools | `/people-tools/` | 11 tools |
| QR & Barcode Tools | `/qr-barcode/` | |
| Dev Tools | `/dev-tools/` | 34 tools |

#### Search / Filter

* Typing in `#tool-search` filters visible cards in real time
* Matching is performed against `data-tags` + card text content (case-insensitive substring)
* Cards that do not match are hidden (`display: none`); `#no-results` message is shown if all cards are hidden

#### Recent Tools Tracking

* Each card `onclick` calls `trackRecent(name, url, icon)` before navigation
* Recent entries stored in `sessionStorage` under key `peppy-recent-tools` (JSON array, max 5, newest first, deduplicated by URL)
* On page load, `renderRecentTools()` reads sessionStorage and populates `#recent-pills` using safe DOM methods (`textContent` only — no `innerHTML`)
* `#recent-section` remains hidden if the list is empty

#### PWA Install Prompt

* Listen for `beforeinstallprompt`; call `e.preventDefault()` and store the event
* Show `#install-btn` when the event fires; hide it after install or dismissal
* Listen for `appinstalled` to hide `#install-btn` permanently

### 3.2 Theme Requirements

* Light/dark mode toggle button in the portal `<nav>`
* Persist user theme preference in `localStorage` under key `stp-theme`
* Default theme is dark
* Theme selection propagates to all linked sub-applications via the same key

### 3.3 Brand Colors

* Primary accent: `#5646F5` (purple/indigo)
* Darker accent: `#4535e0`
* Dark mode accent: `#8b83f7`
* All app `.app-header` backgrounds use `#5646F5` (light) / `#3c2fd4` (dark)

---

## 4. Peppy Advanced Notepad

### 4.1 Overview

A browser-based text editor replicating core features of Windows Notepad from Microsoft Windows.

### 4.2 Functional Requirements

#### 4.2.1 Core Editing Features

* Create new document; Open local text file (.txt); Save file (.txt); Save As
* Undo / Redo; Cut / Copy / Paste; Select All; Delete selection

#### 4.2.2 Editing Capabilities

* Word wrap (toggle); Font family selection; Font size selection
* Status bar showing: line number, column number, character count, word count

#### 4.2.3 File Handling

* Use browser File API; No server upload; Download generated file to user device

#### 4.2.4 Keyboard Shortcuts

* Ctrl+N (New), Ctrl+O (Open), Ctrl+S (Save), Ctrl+Shift+S (Save As)
* Ctrl+Z (Undo), Ctrl+Y (Redo)
* Ctrl+A (Select All), Ctrl+F (Find), Ctrl+H (Replace)
* Ctrl+P (Markdown Preview via Format menu), Ctrl+Shift+P (Split Preview)
* Ctrl+Shift+D (Insert Date/Time), Ctrl++ / Ctrl+- / Ctrl+0 (Zoom)
* Tab (Insert 2 spaces)

#### 4.2.5 Search & Replace

* Find text; Replace text; Replace All; Case sensitive toggle

#### 4.2.6 Markdown Support with Embedded LaTeX

* Full Markdown syntax support (headers, bold, italic, lists, code blocks, tables, etc.)
* Inline math: `$...$`; Display math: `$$...$$` via KaTeX
* Toggle between edit mode and full-screen Markdown Preview mode (Ctrl+P via Format menu)
* Preview renders entirely client-side using marked.js and KaTeX

#### 4.2.7 Split-Pane Live Preview

* **Split mode** (Ctrl+Shift+P): editor (left) and live Markdown+LaTeX preview (right) simultaneously
* Preview updates automatically on every keystroke
* Draggable splitter bar between panes
* Preview panel has a close (×) button to collapse back to editor-only
* **Expand** (⤢) button in preview header extends preview to full working area
* Clicking Expand again restores two-pane layout
* Toolbar button labelled "Preview" toggles split mode

#### 4.2.8 Zoom Controls

* Zoom In, Zoom Out, Reset Zoom buttons in status bar; current zoom percentage shown
* Keyboard shortcuts Ctrl++, Ctrl+-, Ctrl+0 work; zoom affects editor font size only

#### 4.2.9 Additional Editor Features

* **Word count** in status bar; **Auto-save draft** to localStorage (recovered on reload)
* **Tab key** inserts 2 spaces; **Word wrap toggle** via status bar and Format menu
* **Scroll synchronisation** between editor and preview in split mode
* **Insert Date/Time** via Edit menu (Ctrl+Shift+D)

#### 4.2.10 Dropdown Menubar Reliability

* All menu bar dropdowns (File, Edit, Format, View) execute their actions when clicked
* Menu buttons must not steal focus from the editor textarea; active text selection must be preserved
* Menu closes only after the clicked action executes
* Paste uses `navigator.clipboard.readText()` with `execCommand('paste')` fallback

#### 4.2.11 Light / Dark Theme

* Theme toggle button in app header; applies `data-theme` on `<html>`
* Reads/writes preference to `stp-theme` localStorage key; applied before first paint to prevent FOUC

### 4.3 Non-Functional Requirements

* Works offline after first load; supports Chrome, Edge, Firefox; all data in memory or localStorage

---

## 5. Peppy Table Generator

### 5.1 Overview

A web-based table creation tool with similar functionality to TablesGenerator.com.

### 5.2 Functional Requirements

#### 5.2.1 Table Creation

* Add/remove rows and columns; Editable cells; Merge cells; Split cells

#### 5.2.2 Formatting Options

**Table-Level:** Border width/color; Table width; Alignment; Background color

**Cell-Level:** Text alignment; Font size/color; Background color/padding; Vertical alignment

#### 5.2.3 Advanced Features

* Header row/column toggle; HTML preview; Code view

#### 5.2.4 Export Options

Generate: HTML, Markdown, LaTeX, CSV — copy to clipboard

#### 5.2.5 Import

* Paste HTML table and auto-render; Paste CSV and convert to table

#### 5.2.6 Spreadsheet Paste

* TSV paste from Excel, Google Sheets, LibreOffice Calc
* Auto-populate cells from anchor cell; expand table if needed; parse LF and CRLF
* Ctrl+C on multi-cell selection copies as TSV to system clipboard

#### 5.2.7 Right-Click Context Menu

* Insert Row Above/Below; Insert Column Left/Right; Delete Row/Column
* **Copy Cell**: selected cells as TSV (plain text for single cell)
* **Paste Cell**: routes TSV/multi-line content through spreadsheet paste handler
* Multi-cell selection preserved on right-click; closes on outside click or Escape

#### 5.2.8 Cell Editing Reliability

* First click selects and immediately enters edit mode; DOM not rebuilt on single-cell select

#### 5.2.9 Undo / Redo

* Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z; toolbar buttons; stack capped at 50 snapshots
* Captures: cell data, dimensions, header flags, styles
* Saves on: addRow, removeLastRow, addCol, removeLastCol, resizeTable, mergeCells, splitCell, clearCells
* Buttons disabled when stack is empty

#### 5.2.10 Zoom Controls

* A−/A+/⊙ reset in status bar; scales table cell font size only; does not affect export

#### 5.2.11 Keyboard Navigation & Status Bar

* Tab/Shift+Tab between cells; Enter/Shift+Enter moves down/up
* Status bar: dimensions, zoom, selection hint at reduced opacity

#### 5.2.12 Clear Cells

* "Clear" toolbar button erases selected cells and immediately re-renders

#### 5.2.13 Light / Dark Theme

* Same `stp-theme` localStorage key; all surfaces respond to theme changes

---

## 6. Peppy Dev Tools

### 6.1 Overview

All developer utility suites combined into one unified, single-page application with a grouped, collapsible sidebar. Contains 34 tools across 7 groups.

### 6.2 App Layout

* **Left sidebar** with a top group nav bar and collapsible tool groups
* **Right tool area** showing the active tool panel
* **Status bar** at the bottom showing current tool name
* Theme toggle in the app header consistent with all other apps
* CDN libraries: **js-yaml v4** (YAML), **qrcodejs** (QR), **JsBarcode** (barcode)

### 6.3 Sidebar Design

#### 6.3.1 Top Group Nav Bar

* Horizontal icon-button bar pinned at the top of the sidebar showing all 7 group icons
* Clicking a group icon expands that group (if collapsed) and scrolls it into view
* Active group highlighted with `--accent-light` background and accent border
* Icons: 🔐 Encoding, ⬛ QR, 📄 Text, {} JSON, 🎨 Colors, 🕐 Timestamps, 🔍 Regex
* Each button has a `title` tooltip with the full group name

#### 6.3.2 Collapsible Tool Groups

* Each group has a header button showing icon + name and a chevron indicator (▾/▸)
* Clicking the header toggles the group collapsed/expanded independently
* Default state: all groups expanded; chevron animates with CSS transition

#### 6.3.3 Sidebar Appearance (Modern Design)

* Sidebar background uses `--surface` (clean, matching regex-tester style)
* Active tool button: solid `--accent` fill with white text
* Tool button hover: `--accent-light` background + accent text
* Group header hover: accent text colour
* Group nav icon active: `--accent-light` fill + accent border

### 6.4 Group 1 — Encoding & Security

#### 6.4.1 Base64 Encoder / Decoder
* Encode (UTF-8 safe via `encodeURIComponent`/`btoa`); Decode (`atob`/`decodeURIComponent`); Swap; Clear; Copy

#### 6.4.2 URL Encoder / Decoder
* Encode via `encodeURIComponent`; Decode via `decodeURIComponent`; Swap; Copy

#### 6.4.3 Hash Generator
* MD5 (custom RFC 1321 JS impl), SHA-1, SHA-256, SHA-384, SHA-512 (`crypto.subtle.digest`)
* Displays algorithm name + bit-length; Copy per hash

#### 6.4.4 Password Generator
* Length 4–128 (slider); Charset: uppercase/lowercase/digits/symbols; Exclude ambiguous chars option
* `crypto.getRandomValues`; guaranteed one char per enabled set; 7-level strength meter; Copy

#### 6.4.5 UUID Generator
* UUID v4 via `crypto.randomUUID()` with `crypto.getRandomValues` fallback; Nil UUID option
* Count 1–100 per generation (appends to output); Copy all

#### 6.4.6 JWT Decoder
* Client-side inspection only — no signature verification
* Base64url decode with padding; colour-coded header/payload/signature; auto-decodes on input

#### 6.4.7 HTML Entity Encoder / Decoder
* Encode `<`, `>`, `&`, `"`, `'`, non-ASCII to named/numeric entities; browser-native DOM decode
* Swap; Clear; Copy

### 6.5 Group 2 — QR & Barcode

#### 6.5.1 QR Code Generator
* Free-form input; size 128–512 px (32 px steps); error correction L/M/Q/H; dark/light colour pickers
* Auto-regenerates; Download PNG; preview always white; uses **qrcodejs** (cdnjs, `crossorigin="anonymous"`)

#### 6.5.2 Barcode Generator
* Formats: CODE128, CODE39, EAN-13, EAN-8, UPC-A, ITF-14, MSI, Pharmacode
* Bar width 1–4 (step 0.5); height 40–200 px; line colour; value text/flat bars toggles
* Auto-regenerates; Download SVG and PNG; uses **JsBarcode** (cdnjs, `crossorigin="anonymous"`)

### 6.6 Group 3 — Text Tools

#### 6.6.1 Text Diff Checker
* LCS line diff; side-by-side output (removed = red left, added = green right); line numbers; scroll sync
* Performance limit: m×n > 250,000 → error; diff stats; Clear

#### 6.6.2 Text Sorter
* Modes: A→Z, Z→A, Length (short/long), Numeric, Shuffle (Fisher–Yates + `crypto.getRandomValues`)
* Options: case-sensitive, remove empty lines, remove duplicates; Swap/Clear/Copy; line count status

#### 6.6.3 Duplicate Line Remover
* Options: case-sensitive, trim whitespace, remove blank lines; Swap/Clear/Copy; "Removed N" status

#### 6.6.4 Random String Generator
* Length 1–4096; Count 1–1000; Charset: uppercase/lowercase/digits/symbols + custom
* Deduplicated charset; `crypto.getRandomValues(Uint32Array)`; Clear/Copy

#### 6.6.5 Lorem Ipsum Generator
* Type: words/sentences/paragraphs; Count 1–500; Optional standard opening
* Standard 100+ word corpus; sentence 8–17 words; paragraph 3–7 sentences; Clear/Copy

#### 6.6.6 Text Statistics
* Live: total chars, chars-no-spaces, words, sentences, paragraphs, lines, reading time (200 WPM), avg word length
* Top 10 word frequency with relative-width bar chart; words lowercased + punctuation stripped

### 6.7 Group 4 — JSON / Data

#### 6.7.1 JSON Formatter
* Indent: 2-space/4-space/tab; Format and Minify; quick arrow (→); Swap/Clear/Copy; error on failure

#### 6.7.2 JSON Viewer (Tree)
* Collapsible tree; ▾/▸ toggles; key counts; value colour-coding (keys purple, strings green, numbers blue, booleans orange, null grey)
* Strings >150 chars truncated with tooltip; Expand All / Collapse All / Clear

#### 6.7.3 JSON Validator
* Live debounced 400 ms + Validate button; green (✓ valid) or red (✗ + error); Clear

#### 6.7.4 JSON → CSV Converter
* Array-of-objects; all keys in insertion order; nested → JSON-stringify; RFC 4180 escaping; Clear/Copy

#### 6.7.5 JSON → YAML Converter
* Custom recursive serialiser (no external library); safe YAML quoting; block sequences/mappings; Clear/Copy

#### 6.7.6 YAML → JSON Converter
* `jsyaml.load()` (js-yaml v4 safe load); JSON 2-space output; Clear/Copy

#### 6.7.7 XML Formatter
* DOMParser format (self-closing/inline/block) and minify; preserves attributes and comments; Swap/Clear/Copy

#### 6.7.8 XML → JSON Converter
* Attributes → `@`-prefix; repeated siblings → array; mixed content → `#text` key; JSON 2-space; Clear/Copy

### 6.8 Group 5 — Colors

#### 6.8.1 Color Converter
* Bidirectional: HEX ↔ RGB ↔ HSL ↔ HSV ↔ CMYK; live swatch; Copy All; Clear

#### 6.8.2 Color Picker
* `<input type="color">` with live HEX/RGB/HSL/HSV display; ~60 CSS named color detection; swatch

#### 6.8.3 Contrast Checker (WCAG 2.1)
* Foreground + background inputs; contrast ratio; AA/AAA pass/fail badges; live text preview
* AA Normal ≥4.5:1, AA Large ≥3:1, AAA Normal ≥7:1, AAA Large ≥4.5:1

#### 6.8.4 Palette Generator
* Base colour + scheme (analogous, complementary, triadic, tetradic, monochromatic, split-complementary)
* 5-colour swatch grid with hex + one-click copy; Copy All as comma-separated hex

### 6.9 Group 6 — Timestamps

#### 6.9.1 Unix Timestamp Converter
* Timestamp → Date (s or ms, auto-detect >10¹²); UTC/local/ISO 8601/relative outputs
* Date → Timestamp; Now button; live update; Copy per output

#### 6.9.2 Date Calculator
* Difference: From/To → days, weeks, months, hours
* Add/Subtract: base date + value + unit → result; Copy

#### 6.9.3 Date Formatter
* datetime-local + Now button; outputs: ISO 8601, RFC 2822, Full US/EU, Short US, YYYY-MM-DD, Unix s, Day of Week, Day of Year, ISO Week
* Live update; Copy per row

#### 6.9.4 World Clocks
* 18 zones; city/HH:MM:SS/date/TZ abbreviation; ticks every second via `Intl.DateTimeFormat`
* Zones: Los Angeles, Denver, Chicago, New York, São Paulo, London, Paris, Istanbul, Moscow, Dubai, Karachi, Dhaka, Bangkok, Singapore, Tokyo, Sydney, Auckland, Honolulu

### 6.10 Group 7 — Regex

#### 6.10.1 Pattern Tester
* `/pattern/flags`; flags: g (default), i, m, s
* Test string + highlighted output side-by-side (`<mark>` alternating); match summary; capture group details
* Pure browser `RegExp`

#### 6.10.2 Find & Replace
* Pattern + flags; replace field (`$&`, `$1`, `$<name>`, `$$`); live replacement; "N replacements" summary; Copy

#### 6.10.3 Reference Cheatsheet
* Card grid: Character Classes, Anchors, Quantifiers, Groups, Lookahead/Lookbehind, Flags, Replacement Tokens, Common Patterns

---

## 7. UI/UX Requirements

### 7.1 Design

* Clean, minimal interface; sidebar-based tab layout; responsive (desktop-first); accessible colour contrast

### 7.2 Performance

* Load time < 2 seconds; smooth interaction; no heavy frameworks unless necessary

### 7.3 Shared App Layout Pattern

* `.app-header` — sticky, purple background, white text; back link, `<h1>`, theme-toggle
* `.sidebar` — active item has solid accent background + white text; hover has accent-light background
* `.tool-area` — `.tool-panel` shown/hidden via `.active` class
* `.statusbar` — bottom bar, same purple; shows current tool name
* Theme applied via inline `<script>` before first paint to prevent FOUC

---

## 8. Technical Constraints

* Must be fully static; No Node.js backend; Vanilla JS preferred
* Lightweight CDN libraries permitted:
  * **qrcodejs** — QR code generation
  * **JsBarcode** — barcode generation
  * **js-yaml v4** — YAML parsing
  * **marked.js v9** — Markdown rendering (notepad)
  * **KaTeX v0.16** — LaTeX rendering (notepad)
  * **pdf-lib v1.17** — Client-side PDF creation & modification
  * **PDF.js v3.11** — PDF page rendering to canvas (viewer, thumbnails, redaction)

---

## 9. Security Requirements

* No external data transmission; no user data stored remotely
* Prevent XSS when importing HTML (sanitise input)
* Use `crypto.getRandomValues` (never `Math.random`) for passwords, random strings, UUID, shuffle
* CDN resources: `crossorigin="anonymous"` and `referrerpolicy="no-referrer"`
* YAML: `jsyaml.load()` safe load — no arbitrary code execution
* XML: browser `DOMParser` — sandboxed from live DOM

---

## 10. Future Enhancements (Optional)

* PWA support (offline manifest + service worker)
* Cloud storage integration (Google Drive, GitHub Gist)
* Drag & drop file support across all apps
* Markdown export from notepad as shareable URL (Base64-encoded fragment)
* Regex Tester: live regex explainer / syntax diagram

---

## 11. Acceptance Criteria

The system is considered complete when:

* GitHub Pages successfully hosts the site; landing page links correctly to all three apps
* All features function fully client-side; light/dark theme persists via `stp-theme` localStorage
* **Notepad**: open/save local files; split-pane Markdown+LaTeX in realtime; zoom scales text only; menu bar preserves editor focus and selection
* **Table Generator**: exports valid HTML; Undo/Redo correct; right-click Copy/Paste Cell works for single and multi-cell (including TSV round-trips); Clear reliably erases selected cells
* **Dev Tools sidebar**: top group nav highlights active group and scrolls to it; groups collapse/expand with animated chevron; active tool shows solid accent background
* **Dev Tools — Encoding**: Base64/URL round-trip; Hash correct (MD5 + SHA-*); Password uses `crypto.getRandomValues` only; UUID v4 is valid RFC 4122; JWT extracts header+payload; HTML Entities bidirectional
* **Dev Tools — QR & Barcode**: QR generates from text and downloads PNG; Barcode generates all formats, downloads SVG and PNG
* **Dev Tools — Text**: Diff correct side-by-side; Sorter all modes including shuffle; Random String uses `crypto.getRandomValues` with selected charset only; Lorem Ipsum valid; Statistics accurate
* **Dev Tools — JSON/Data**: Formatter round-trips losslessly; Viewer correct tree; Validator accurate; JSON→CSV valid RFC 4180; JSON→YAML round-trips; YAML→JSON via js-yaml; XML Formatter preserves comments; XML→JSON faithful
* **Dev Tools — Colors**: Converter bidirectional in all 5 formats; Contrast Checker correct WCAG ratios; Palette Generator correct schemes
* **Dev Tools — Timestamps**: Unix Converter both directions + auto-detect s vs ms; Calculator correct; Formatter all 10 variants; World Clocks tick every second for all 18 zones
* **Dev Tools — Regex**: Pattern Tester real-time highlights + capture groups; Find & Replace applies all substitution tokens

---

## 12. Cross-Application Design Consistency

### 12.1 Theme System

* All pages share `stp-theme` localStorage key (`"light"` | `"dark"`, default `"dark"`)
* Applied via `data-theme` on `<html>` before first paint using inline `<script>`
* Each app has a theme-toggle button in `.app-header`; label updates to reflect current theme

### 12.2 Color Variables

All apps define identical CSS custom property names on `:root`:

| Variable | Purpose |
|----------|---------|
| `--bg` | Main background |
| `--bg2` | Secondary background (panels, toolbars) |
| `--bg3` | Tertiary background (hover, alt rows) |
| `--border` | Border colour |
| `--text` | Primary text |
| `--text2` | Secondary / muted text |
| `--accent` | Brand accent (`#5646F5` purple/indigo) |
| `--accent2` | Pressed / hovered accent (`#4535e0`) |
| `--accent-light` | Accent tint for hover backgrounds |
| `--surface` | Clean surface background (sidebar, panels) |
| `--surface2` | Secondary surface (nav bars, table headers) |

Each file provides both `:root` (light defaults) and `[data-theme="dark"]` overrides.

### 12.3 Shared UI Patterns

* **App header**: back arrow, `<h1>`, theme-toggle — purple background, white text
* **Sidebar**: active item solid accent fill + white text; hover accent-light background
* **Status bar**: bottom bar, same purple; shows current tool name
* **Tool panels**: hidden/shown via `.active` class; `.panel-title` in accent colour
* **IO layout**: `.io-wrap` flex row; `.io-col` textareas; `.io-btns` action buttons
* **Buttons**: primary (accent fill), secondary (`btn-secondary` — bg2), copy (bg2 → accent on hover)
* **Tool messages**: `.ok` green, `.err` red, default accent blue
* **Context menus**: appear at pointer, dismiss on outside click or Escape
* **Dialogs / modals**: backdrop overlay, centred card, Escape closes

### 12.4 Typography

* UI chrome: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`
* Code and IO textareas: `'Consolas', 'Courier New', monospace`
* Minimum touch target: 32 × 32 px for all interactive controls

---

## 13. Peppy PDF Tools

### 13.1 Overview

A browser-based PDF utility suite with 20 tools organised into 5 groups. All processing is 100% client-side using **pdf-lib** (manipulation) and **PDF.js** (rendering). No file is ever uploaded to a server.

### 13.2 Libraries

| Library | Version | Source | Purpose |
|---------|---------|--------|---------|
| pdf-lib | 1.17.1 | unpkg CDN | Create, modify, merge, split, encrypt, draw text/shapes |
| PDF.js | 3.11.174 | cdnjs CDN | Render PDF pages to `<canvas>` for preview, thumbnails, redaction |

### 13.3 App Layout

* Left sidebar with 5 collapsible groups and icon top-nav
* Right tool area showing active tool panel
* Drag-and-drop zones for file input on every tool
* Same purple `.app-header` with back link and theme toggle

### 13.4 Tool Requirements

#### Group 1 — Page Operations

##### 13.4.1 Merge / Combine PDF
* Accept multiple PDF files via drop zone or file picker
* Files listed in a draggable, reorderable list
* Combine all pages in listed order into a single PDF
* Download as `merged.pdf`

##### 13.4.2 Split PDF
* Accept a single PDF
* Mode A: split every page into individual PDFs
* Mode B: split by custom ranges (e.g. `1-3, 4, 5-7`) — each range becomes one file
* Download all output files

##### 13.4.3 Extract Pages from PDF
* Accept a single PDF; specify pages via range string
* Output a new PDF containing only the specified pages
* Download as `*_extracted.pdf`

##### 13.4.4 Delete Pages from PDF
* Accept a single PDF; specify pages to delete via range string
* Output a new PDF with those pages removed
* Download as `*_deleted.pdf`

##### 13.4.5 Rotate PDF Pages
* Accept a single PDF
* Angle: 90° CW, 180°, 90° CCW
* Apply to: all pages, odd pages, even pages, or custom range
* Apply rotation additively (adds to existing page rotation)
* Download as `*_rotated.pdf`

##### 13.4.6 Rearrange PDF Pages
* Accept a single PDF
* Render thumbnail previews of all pages using PDF.js at 0.3× scale
* Drag-and-drop thumbnails to reorder; order input auto-syncs
* Custom numeric order input (1-based, comma-separated)
* Download as `*_reordered.pdf`

#### Group 2 — Enhance

##### 13.4.7 Add Watermark to PDF
* Accept a single PDF
* Text watermark with: custom text, font size, opacity (0–1), color picker, rotation angle
* Uses `StandardFonts.HelveticaBold`; centered diagonally on each page
* Download as `*_watermarked.pdf`

##### 13.4.8 Add Page Numbers to PDF
* Accept a single PDF
* Position: bottom-center, bottom-right, bottom-left, top-center, top-right, top-left
* Format: `n`, `Page n`, or `n of total`
* Configurable start number, font size, and color
* Download as `*_numbered.pdf`

##### 13.4.9 Convert Images to PDF
* Accept multiple image files: JPG, PNG, GIF, BMP, WEBP
* Files listed in draggable reorderable list
* Page size: fit image, A4, Letter, A3, A5
* Orientation: auto, portrait, landscape
* Non-JPEG images converted to PNG via canvas before embedding
* Each image scaled to fit page preserving aspect ratio
* Download as `images.pdf`

#### Group 3 — Optimize & Fix

##### 13.4.10 Compress PDF
* Accept a single PDF
* Options: remove metadata, remove XMP stream, use object streams on save
* Reports original size, compressed size, and % reduction
* Download as `*_compressed.pdf`

##### 13.4.11 Crop PDF Pages
* Accept a single PDF; show first page dimensions in points
* Margin inputs: left, right, top, bottom (in points)
* Apply to all pages or custom page range
* Sets `CropBox` via pdf-lib
* Download as `*_cropped.pdf`

##### 13.4.12 Resize PDF Pages
* Accept a single PDF
* Preset sizes: A4, Letter, Legal, A3, A5, or custom width × height (pts)
* Orientation: portrait or landscape
* Content scaled to fit target size (preserves aspect ratio)
* Download as `*_resized.pdf`

##### 13.4.13 Flatten PDF
* Accept a single PDF
* Call `form.flatten()` via pdf-lib to embed interactive fields into page content
* Download as `*_flattened.pdf`

#### Group 4 — Security & Privacy

##### 13.4.14 Remove PDF Metadata
* Accept a single PDF
* Display current metadata values (title, author, subject, keywords, creator, producer)
* Clear all fields and optionally delete the XMP stream from the catalog
* Download as `*_cleaned.pdf`

##### 13.4.15 Add Password to PDF
* Accept a single PDF
* User password (required to open) + owner password (optional, defaults to user password)
* AES-256 encryption via pdf-lib permissions options
* Password strength meter (4 levels: weak/fair/good/strong)
* Download as `*_protected.pdf`

##### 13.4.16 Remove Password from PDF
* Accept a single encrypted PDF; user provides the known password
* Load with `{ password }` option, save without encryption
* Clear error message if password is wrong
* Download as `*_unlocked.pdf`

##### 13.4.17 Lock PDF (Read-Only)
* Accept a single PDF; requires an owner password
* Configurable restrictions: disallow printing, copying, editing, annotating
* AES-256 encryption applied with empty user password (opens without password but restrictions enforced)
* Download as `*_locked.pdf`

##### 13.4.18 Redact PDF
* Accept a single PDF; render each page to canvas via PDF.js at 1.5× scale
* User draws redaction boxes via click-and-drag on the canvas overlay
* Configurable redaction color (color picker)
* Boxes stored per page; navigate pages with Prev/Next
* On Apply: draw opaque filled rectangles at correct PDF coordinates (canvas-to-PDF coordinate transform)
* Download as `*_redacted.pdf`

##### 13.4.19 Remove Hidden Data from PDF
* Accept a single PDF
* Remove options (checkboxes): document metadata, XMP metadata stream, embedded JavaScript (via Names tree), annotation hidden data, embedded files/attachments
* Access low-level catalog via `PDFLib.PDFName` for XMP, JS, and embedded files
* Download as `*_sanitized.pdf`

#### Group 5 — View

##### 13.4.20 PDF Viewer / Preview
* Accept a single PDF via file picker button
* Render each page to canvas via PDF.js
* Zoom range slider (0.5× – 3×, step 0.1)
* Page navigation (Prev / Next) with page counter
* All pages rendered on demand (lazy per navigation)

### 13.5 Shared Interaction Patterns

* All file inputs support drag-and-drop and click-to-browse
* File items display name, size, and a remove button
* Processing errors displayed in `.tool-msg.err` below the action button
* Success messages show output file size in `.tool-msg.ok`
* Heavy operations show a progress bar
* `fmtBytes()` helper for human-readable file sizes
* `parsePageRanges()` helper: parses range strings like `1, 3-5, 8` → sorted 0-based indices

### 13.6 Security

* No data transmitted; all PDF bytes stay in memory
* Passwords are never stored or logged
* Input PDFs read via `FileReader.readAsArrayBuffer`; output via `Blob` + `URL.createObjectURL`