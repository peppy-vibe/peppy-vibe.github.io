# 📄 Project Requirements

## Project Name: Peppy Tools Portal

---

## 1. Project Overview

Create a **static website hosted on GitHub Pages** that serves as a landing portal to six independent static web applications:

1. **Peppy Advanced Notepad** — Windows Notepad-inspired browser text editor with Markdown + LaTeX preview
2. **Peppy Table Generator** — Feature-rich HTML table creation and export tool
3. **Peppy Encoding & Security Tools** — Developer utilities for encoding, hashing, and token inspection
4. **Peppy QR & Barcode Generator** — Client-side QR code and barcode generator with download support
5. **Peppy Text Tools** — Text manipulation utilities (diff, sort, dedup, random strings, Lorem Ipsum)
6. **Peppy JSON / YAML / XML Tools** — Structured data formatting, validation, and conversion tools

All components must be:

* 100% static (HTML, CSS, JavaScript)
* No backend server
* Deployable via GitHub Pages
* Fully client-side processing

---

## 2. System Architecture

### 2.1 Hosting

* Hosting Platform: GitHub Pages
* Repository Type: Public or Private (with Pages enabled)
* Deployment Branch: `main` or `gh-pages`
* No server-side runtime allowed

### 2.2 Folder Structure

```
/ (root)
 ├── index.html
 ├── /advanced-notepad
 │     ├── index.html
 │     ├── style.css
 │     └── app.js
 ├── /table-generator
 │     ├── index.html
 │     ├── style.css
 │     └── app.js
 ├── /encoding-tools
 │     ├── index.html
 │     ├── style.css
 │     └── app.js
 ├── /qr-barcode
 │     ├── index.html
 │     ├── style.css
 │     └── app.js
 ├── /text-tools
 │     ├── index.html
 │     ├── style.css
 │     └── app.js
 └── /json-tools
       ├── index.html
       ├── style.css
       └── app.js
```

---

## 3. Portal (index.html)

### 3.1 Functional Requirements

The index page must:

* Display project title and tagline
* Provide navigation cards linking to all six applications
* Be responsive (mobile + desktop)
* Load fast (minimal external dependencies)

#### Required Sections

* Header: Project Name + tagline
* Card grid: one card per app with icon, title, description, feature bullet list, and Launch button
* Footer: brief attribution

#### App Cards

| Card | Link |
|------|------|
| Peppy Advanced Notepad | `/advanced-notepad/` |
| Peppy Table Generator | `/table-generator/` |
| Peppy Encoding & Security Tools | `/encoding-tools/` |
| Peppy QR & Barcode Generator | `/qr-barcode/` |
| Peppy Text Tools | `/text-tools/` |
| Peppy JSON / YAML / XML Tools | `/json-tools/` |

### 3.2 Theme Requirements

* Light/dark mode toggle button in the portal `<nav>`
* Persist user theme preference in `localStorage` under key `stp-theme`
* Default theme is dark
* Theme selection propagates to all linked sub-applications via the same key

---

## 4. Peppy Advanced Notepad

### 4.1 Overview

A browser-based text editor replicating core features of Windows Notepad from Microsoft Windows.

### 4.2 Functional Requirements

#### 4.2.1 Core Editing Features

* Create new document
* Open local text file (.txt)
* Save file (.txt)
* Save As
* Undo / Redo
* Cut / Copy / Paste
* Select All
* Delete selection

#### 4.2.2 Editing Capabilities

* Word wrap (toggle)
* Font family selection
* Font size selection
* Bold / Italic / Underline (optional enhancement)
* Line numbers (optional)
* Status bar showing:
  * Line number
  * Column number
  * Character count

#### 4.2.3 File Handling

* Use browser File API
* No server upload
* Download generated file to user device

#### 4.2.4 Keyboard Shortcuts

* Ctrl + N (New)
* Ctrl + O (Open)
* Ctrl + S (Save)
* Ctrl + Z (Undo)
* Ctrl + Y (Redo)
* Ctrl + A (Select All)
* Ctrl + F (Find)
* Ctrl + H (Replace)

#### 4.2.5 Search & Replace

* Find text
* Replace text
* Replace All
* Case sensitive toggle

#### 4.2.6 Markdown Support with Embedded LaTeX

* Support Markdown syntax in the editor (headers, bold, italic, lists, code blocks, tables, etc.)
* Support embedded LaTeX math expressions:
  * Inline math: `$...$`
  * Display/block math: `$$...$$`
* Toggle between **Edit mode** (plain text) and **Markdown Preview mode** (rendered output)
* Preview renders Markdown and LaTeX entirely client-side using lightweight libraries
* Keyboard shortcut: Ctrl+P to toggle preview

#### 4.2.7 Light / Dark Theme

* Theme toggle button visible in the app header (sun/moon icon)
* Applies `data-theme="dark"` or `data-theme="light"` on the `<html>` element
* Reads and writes preference to `localStorage` key `stp-theme` for cross-app persistence
* Theme applied before first paint to prevent flash of wrong theme

#### 4.2.8 Realtime Split Preview

* **Split mode**: editor (left pane) and live Markdown+LaTeX preview (right pane) visible simultaneously
* Preview updates automatically on every keystroke (no manual refresh)
* A draggable splitter bar between editor and preview allows resizing both panes
* Preview panel has a close (×) button to collapse back to editor-only
* Toolbar button and keyboard shortcut (Ctrl+Shift+P) to toggle split mode
* Hidden/shown state persists during the session

#### 4.2.9 Zoom Controls in Status Bar

* Zoom In, Zoom Out, and Reset Zoom buttons displayed in the status bar
* Current zoom percentage shown next to zoom buttons
* Zoom affects editor font size; keyboard shortcuts Ctrl++, Ctrl+-, Ctrl+0 continue to work

#### 4.2.10 Additional Editor Features

* **Word count** displayed in the status bar alongside character count
* **Auto-save draft** to localStorage to recover unsaved work on page reload
* **Tab key** inserts configurable spaces instead of moving focus
* **Word wrap toggle** clickable via status bar (in addition to Format menu)
* **Scroll synchronisation** between editor and preview in split mode
* **Insert Date/Time** via Edit menu shortcut (Ctrl+Shift+D)

#### 4.2.11 Preview Button Consolidation

* Remove the dedicated toolbar **"Preview"** button (full-page Markdown preview) to eliminate redundancy with the split-pane workflow
* Rename the toolbar **"Split"** button to **"Preview"**; it continues to toggle the split-pane live preview (Ctrl+Shift+P)
* The split preview panel header exposes an **Expand** (⤢) button that extends the preview pane to occupy the full working area (hides the editor and splitter)
* Clicking the Expand button a second time restores the two-pane split layout
* The full-page Markdown Preview mode remains accessible via Format menu > Markdown Preview (Ctrl+P); only the toolbar shortcut button is removed

#### 4.2.12 Dropdown Menubar Reliability

* All menu bar dropdowns (File, Edit, Format, View) must function correctly; every menu item must execute its action when clicked
* Menu buttons must **not** steal focus from the editor textarea; clicking a dropdown item must preserve the textarea's focus and any active text selection (critical for Cut, Copy, and Delete operations to act on the correct selection)
* The menu closes only **after** the clicked button's action has executed — not before — so the `click` event is never suppressed
* Paste from the Edit menu uses `navigator.clipboard.readText()` with a `document.execCommand('paste')` fallback for environments where the Clipboard API is unavailable

### 4.3 Non-Functional Requirements

* Must work offline after first load
* Must support modern browsers: Chrome, Edge, Firefox
* No external backend
* All data stored in memory or localStorage

---

## 5. Peppy Table Generator

### 5.1 Overview

A web-based table creation tool with similar functionality to TablesGenerator.com.

### 5.2 Functional Requirements

#### 5.2.1 Table Creation

* Add row / Remove row
* Add column / Remove column
* Editable cells
* Merge cells
* Split cells

#### 5.2.2 Formatting Options

**Table-Level Settings**

* Border width, border color
* Table width
* Alignment (left / center / right)
* Background color

**Cell-Level Settings**

* Text alignment
* Font size, font color
* Background color, padding
* Vertical alignment

#### 5.2.3 Advanced Features

* Header row toggle
* Header column toggle
* HTML preview
* Code view

#### 5.2.4 Export Options

Generate: HTML, Markdown, LaTeX, CSV — copy to clipboard

#### 5.2.5 Import

* Paste HTML table and auto-render
* Paste CSV and convert to table

#### 5.2.6 Spreadsheet Paste

* Support pasting table data copied directly from spreadsheet applications (Excel, Google Sheets, LibreOffice Calc)
* Detect tab-separated values (TSV) format from clipboard
* Auto-populate cells starting from the current selected/anchor cell
* Handle mismatched row/column counts gracefully (expand table if needed)

#### 5.2.7 Right-Click Context Menu

* Right-clicking any cell opens a context menu with: Insert Row Above/Below, Insert Column Left/Right, Delete Row, Delete Column
* Menu closes on any outside click or Escape key

#### 5.2.8 Cell Editing Reliability

* Clicking a cell must always reliably enter typing/edit mode immediately
* First click selects the cell; the cell is immediately editable without requiring a second click
* Selection highlight must not interfere with cell focus or text cursor placement
* DOM must not be unnecessarily reconstructed on single-cell selection events

#### 5.2.9 Light / Dark Theme

* Theme toggle consistent with portal and notepad
* Same `stp-theme` localStorage key for cross-app persistence
* All table, panel, toolbar, dialog, and context-menu surfaces respond to theme changes

#### 5.2.10 Right-Click Copy / Paste Cell

* "Copy Cell" copies all currently selected cells as TSV to the system clipboard; single-cell copies plain text
* "Paste Cell" detects TSV/multi-line clipboard content and routes through the spreadsheet paste handler
* Right-clicking a cell that is part of a multi-cell selection preserves the full selection
* Uses `navigator.clipboard.writeText` with `textarea + execCommand` fallback

#### 5.2.11 Spreadsheet Copy / Paste

* Correctly detect TSV clipboard content from Excel, Google Sheets, and LibreOffice Calc on all platforms
* Parse both LF and CRLF line endings
* On paste: expand table dimensions automatically if pasted data exceeds current table bounds
* On copy (Ctrl+C): when two or more cells are selected, copy as TSV to system clipboard

#### 5.2.12 Zoom Controls

* Zoom controls (A−, %, A+, ⊙ reset) displayed in the **status bar**
* Zoom removed from the main toolbar
* Zoom scales table cell font size without affecting export output

#### 5.2.13 Additional Table Features

* **Keyboard navigation**: Tab / Shift+Tab moves between cells; Enter / Shift+Enter moves down/up
* **Status bar**: shows table dimensions (rows × columns) and current zoom level
* **Auto-fit column width**: double-click a column boundary to auto-size

#### 5.2.14 Settings Panel Dark Theme

* Settings panel tab buttons (Table / Cell) render correctly in dark theme
* Inactive tab background uses `--tg-bg3`; active tab uses `--tg-bg2`
* Tab text and border colours use theme variables

#### 5.2.15 Selection Hint in Status Bar

* Remove the "Click cells to select · Shift+click to extend" hint text from the app header
* Display the same hint in the status bar at reduced opacity

#### 5.2.16 Clear Cell Content

* The "Clear" toolbar button erases content from all selected cells and immediately re-renders the table
* `renderTable()` must not call `syncContent()` internally
* Any function calling `renderTable()` without first calling `syncContent()` must call `syncContent()` before modifying state

---

## 6. Peppy Encoding & Security Tools

### 6.1 Overview

A suite of developer utilities for encoding, hashing, and security token inspection, running entirely in the browser with no server-side calls.

### 6.2 Functional Requirements

#### 6.2.1 App Layout

* Left sidebar with tab navigation
* Right tool area showing the active tool panel
* Status bar at the bottom showing current tool name
* Theme toggle in the app header consistent with all other apps

#### 6.2.2 Base64 Encoder / Decoder

* Encode plain text to Base64 (UTF-8 safe via `encodeURIComponent` / `btoa`)
* Decode Base64 to plain text (UTF-8 safe via `atob` / `decodeURIComponent`)
* Swap input and output
* Clear button
* Copy output to clipboard with confirmation message

#### 6.2.3 URL Encoder / Decoder

* Encode special characters using `encodeURIComponent`
* Decode URL-encoded strings using `decodeURIComponent`
* Swap input and output
* Copy output to clipboard

#### 6.2.4 Hash Generator

* Supported algorithms: MD5, SHA-1, SHA-256, SHA-384, SHA-512
* MD5 computed entirely in JavaScript (custom RFC 1321 implementation — no external library)
* SHA-* computed via the browser's `crypto.subtle.digest` API (async)
* Displays algorithm name and bit-length alongside the hash output
* Copy hash to clipboard

#### 6.2.5 Password Generator

* Configurable length: 4–128 characters (range slider)
* Character set toggles: uppercase (A–Z), lowercase (a–z), digits (0–9), symbols
* Option to exclude ambiguous characters (0, O, l, I)
* Uses `crypto.getRandomValues` for cryptographically secure generation
* Guarantees at least one character from each enabled set after generation
* Password strength meter (7-level: Very Weak → Excellent) with visual bar
* Copy generated password to clipboard

#### 6.2.6 UUID Generator

* Generates UUID v4 (random) using `crypto.randomUUID()` with manual `crypto.getRandomValues` fallback
* Nil UUID option (all zeros)
* Configurable count: 1–100 UUIDs per generation (appends to existing output)
* Copy all generated UUIDs to clipboard

#### 6.2.7 JWT Decoder

* Client-side inspection only — **no signature verification**
* Decodes header and payload from Base64url encoding (handles padding)
* Displays header, payload, and signature note in colour-coded sections
* Auto-decodes as user types
* Clear error message for invalid JWT format

---

## 7. Peppy QR & Barcode Generator

### 7.1 Overview

A browser-based tool for generating QR codes and linear barcodes with customisation options and download support.

### 7.2 Functional Requirements

#### 7.2.1 App Layout

* Left sidebar with two tabs: QR Code and Barcode
* Each panel split into controls column (fixed width) and preview pane
* Preview pane background is always white regardless of theme (for scan readability)
* Status bar showing current tool name
* Theme toggle in app header

#### 7.2.2 QR Code Generator

* **Input**: free-form text or URL (textarea)
* **Size**: range slider 128 px → 512 px (32 px steps)
* **Error Correction Level**: L (7%), M (15%), Q (25%), H (30%)
* **Dark colour**: colour picker (default `#000000`)
* **Light colour**: colour picker (default `#ffffff`)
* QR code regenerates automatically on any input or option change
* Preview renders in the right pane; hint text shown when input is empty
* **Download as PNG** button: exports the canvas element via `toDataURL`
* Clear button resets input and preview
* Error handling for data too long and library load failure
* Uses **qrcodejs** library (loaded from cdnjs CDN with `crossorigin="anonymous"`)

#### 7.2.3 Barcode Generator

* **Input**: value text field
* **Format selector**: CODE128 (default), CODE39, EAN-13, EAN-8, UPC-A, ITF-14, MSI, Pharmacode
* **Bar Width**: range slider 1 → 4 (step 0.5)
* **Bar Height**: range slider 40 px → 200 px (step 10 px)
* **Line Colour**: colour picker (default `#000000`)
* **Display value text**: checkbox (default on)
* **Flat bars**: checkbox
* Barcode regenerates automatically on any input or option change
* **Download as SVG**: serialises SVG element and triggers file download
* **Download as PNG**: renders SVG to canvas via `Image` + `URL.createObjectURL`, then downloads PNG
* Clear button resets input and preview
* Error handling for invalid values and library load failure
* Uses **JsBarcode** library (loaded from cdnjs CDN with `crossorigin="anonymous"`)

---

## 8. Peppy Text Tools

### 8.1 Overview

A collection of text manipulation utilities for developers and content creators, running entirely in the browser.

### 8.2 Functional Requirements

#### 8.2.1 App Layout

* Left sidebar with five tabs
* Right tool area showing the active panel
* Status bar showing current tool name
* Theme toggle in app header

#### 8.2.2 Text Diff Checker

* Two input textareas side-by-side: "Original" and "Modified"
* **Compare** button triggers a full line-by-line diff
* Diff algorithm: LCS (Longest Common Subsequence) with O(m×n) DP table and backtracking
* Performance limit: if `m × n > 250,000` (approx. 500 lines each), display an error and skip diff
* **Side-by-side output panels**: aligned view of original (left) and modified (right)
  * Removed lines: red-tinted background in left panel; empty placeholder on the right
  * Added lines: green-tinted background in right panel; empty placeholder on the left
  * Unchanged lines: shown identically in both panels
* Line numbers displayed in a gutter on each panel
* Scroll synchronisation: scrolling one diff panel synchronises the other
* Diff stats: added/removed counts; "Texts are identical" when no differences
* **Clear** button resets all inputs and output

#### 8.2.3 Text Sorter

* Input textarea (one item per line)
* **Sort Modes**: Alphabetical A→Z, Alphabetical Z→A, Length (shortest first), Length (longest first), Numeric, Shuffle (random)
* Shuffle uses Fisher–Yates with `crypto.getRandomValues` (cryptographically random)
* Options: case-sensitive toggle, remove empty lines (default on), remove duplicates
* Output textarea (read-only); Swap, Clear, and Copy buttons
* Status message shows output line count

#### 8.2.4 Duplicate Line Remover

* Input textarea
* Options: case-sensitive, trim whitespace before comparing (default on), remove blank lines
* Output textarea (read-only); Swap, Clear, and Copy buttons
* Status message: "Removed N duplicates"

#### 8.2.5 Random String Generator

* **Length**: numeric input (1–4096, default 16)
* **Count**: numeric input (1–1000, default 1)
* Character set checkboxes: uppercase A–Z (default on), lowercase a–z (default on), digits 0–9 (default on), symbols
* **Custom characters** field for additional characters
* Character set is deduplicated before use
* Generation uses `crypto.getRandomValues(Uint32Array)` for cryptographically secure randomness
* Output textarea shows one string per line; Clear and Copy buttons

#### 8.2.6 Lorem Ipsum Generator

* **Type** selector: words, sentences, paragraphs (default)
* **Count** input: 1–500 (default 3)
* **Start with "Lorem ipsum…"** checkbox (default on): forces the standard opening text as the first item
* Word bank drawn from the standard Lorem Ipsum corpus (100+ words)
* Sentence length: 8–17 words, first word capitalised, ends with period
* Paragraph length: 3–7 sentences
* Words separated by spaces; sentences by spaces; paragraphs by blank lines
* Output textarea; Clear and Copy buttons

---

## 9. Peppy JSON / YAML / XML Tools

### 9.1 Overview

A collection of structured-data utilities for formatting, validating, and converting JSON, YAML, and XML data entirely in the browser.

### 9.2 Functional Requirements

#### 9.2.1 App Layout

* Left sidebar with eight tabs
* Right tool area showing the active panel
* Status bar showing current tool name
* Theme toggle in app header
* **js-yaml v4** loaded from cdnjs CDN for YAML parsing

#### 9.2.2 JSON Formatter

* Input JSON textarea; **Indent** selector: 2 spaces (default), 4 spaces, tab
* **Format** button: `JSON.parse` → `JSON.stringify(…, null, indent)`
* **Minify** button: `JSON.parse` → `JSON.stringify(…)`
* Quick arrow button (→) between panes to reformat
* Swap, Clear, and Copy buttons; error on parse failure

#### 9.2.3 JSON Viewer (Tree)

* Input JSON textarea; **View Tree** button parses and renders an interactive collapsible tree
* Objects and arrays show ▾/▸ toggle buttons; click to collapse/expand
* Item/key count shown next to each node (e.g. `// 3 keys`)
* Value colour coding: keys (purple), strings (green), numbers (blue), booleans (orange), null (grey italic)
* Strings longer than 150 characters truncated in tree view; full value in tooltip
* Children indented with a dashed left border
* **Expand All** and **Collapse All** buttons; **Clear** button

#### 9.2.4 JSON Validator

* Single input textarea with live validation debounced 400 ms
* **Validate** button triggers immediate validation
* Result banner: green (✓ valid — type + top-level count) or red (✗ invalid — error message)
* **Clear** button

#### 9.2.5 JSON → CSV Converter

* Input: JSON array of objects
* All unique keys collected in insertion order across all objects
* Nested objects/arrays are JSON-stringified
* CSV cells properly escaped (RFC 4180): values with commas, quotes, or newlines wrapped in double-quotes
* Output: header row + data rows; status "N rows converted"
* Clear and Copy buttons

#### 9.2.6 JSON → YAML Converter

* Custom recursive serialiser (no external library):
  * `null`/`undefined` → `null`; booleans → `true`/`false`; finite numbers → string; non-finite → `null`
  * Strings unquoted when safe; otherwise double-quoted with `\n`, `\r`, `\t`, `\"`, `\\` escaping
  * A string requires quoting if it matches a YAML keyword, looks numeric, contains YAML special characters, or has leading/trailing whitespace
  * Arrays → block sequences (`- item`) with proper indentation for nested objects
  * Objects → block mappings (`key: value`), 2-space indent per level
* Clear and Copy buttons

#### 9.2.7 YAML → JSON Converter

* Input YAML textarea
* Parses via `jsyaml.load()` (js-yaml v4 — safe load, no arbitrary code execution)
* Graceful error if js-yaml CDN fails to load
* Output: JSON with 2-space indent; Clear and Copy buttons

#### 9.2.8 XML Formatter

* Input XML textarea; **Indent** selector: 2 spaces (default), 4 spaces, tab
* **Format** button: parses with browser `DOMParser`, recursively formats:
  * Empty elements → self-closing `<tag/>`
  * Single text child → inline `<tag>text</tag>`
  * Multi-child elements → block with indented children
  * Attribute values escaped; comment nodes preserved
* **Minify** button: parses and re-serialises, collapsing whitespace between tags
* Arrow quick-format button, Swap, Clear, and Copy; error on parse failure

#### 9.2.9 XML → JSON Converter

* Input XML textarea
* Conversion rules:
  * Root object keyed by document element's tag name
  * Attributes prefixed with `@` (e.g. `@id`)
  * Repeated sibling elements with the same tag become an array
  * Text content: value directly when no attributes/sub-elements; otherwise `#text` key
  * Empty elements return empty string
* Output: JSON (2-space indent); Clear and Copy buttons

---

## 10. UI/UX Requirements

### 10.1 Design

* Clean, minimal interface
* Sidebar-based tab layout for multi-tool applications
* Responsive design (desktop-first; usable on tablet)
* Accessible colour contrast

### 10.2 Performance

* Load time < 2 seconds
* Smooth interaction
* No heavy frameworks unless necessary

---

## 11. Technical Constraints

* Must be fully static
* No Node.js backend
* Vanilla JS preferred
* Lightweight CDN libraries permitted:
  * **qrcodejs** — QR code generation
  * **JsBarcode** — barcode generation
  * **js-yaml v4** — YAML parsing

---

## 12. Security Requirements

* No external data transmission
* No user data stored remotely
* Prevent XSS when importing HTML (sanitise input)
* Use `crypto.getRandomValues` (never `Math.random`) for all security-sensitive generation (passwords, random strings, UUID, shuffle)
* CDN resources loaded with `crossorigin="anonymous"` and `referrerpolicy="no-referrer"`
* YAML parsing uses `jsyaml.load()` (safe load in js-yaml v4 — no arbitrary code execution)
* XML parsing uses browser `DOMParser` — parsed document is sandboxed from the live DOM

---

## 13. Future Enhancements (Optional)

* PWA support (offline manifest + service worker)
* Cloud storage integration (Google Drive, GitHub Gist)
* Drag & drop file support across all apps
* Regex Tester / Explainer
* Timestamp Converter
* Color Converter (HEX ↔ RGB ↔ HSL)

---

## 14. Acceptance Criteria

The system is considered complete when:

* GitHub Pages successfully hosts the site
* Landing page links correctly to all six apps
* Notepad can open/save local files
* Table Generator exports valid HTML
* All features function fully client-side
* Light/dark theme toggle works on all pages and persists across navigation via localStorage
* Split-pane preview in notepad renders Markdown + LaTeX in realtime without losing the editor
* Zoom controls in notepad and table generator scale text without affecting export output
* All notepad menu bar items execute their actions correctly without disrupting editor focus or selection
* Right-click Copy Cell / Paste Cell works for single and multi-cell selections in the table generator, including TSV round-trips
* Ctrl+C on a multi-cell table selection copies cells as TSV to the system clipboard
* The Clear toolbar button reliably erases content from selected table cells
* QR code generates on text input and downloads as PNG
* Barcode generates for all supported formats and downloads as SVG and PNG
* Text Diff produces a correct side-by-side diff for small and large inputs
* Text Sorter sorts correctly for all modes including cryptographically shuffled order
* Duplicate Line Remover correctly deduplicates with optional case-insensitivity and trimming
* Random String Generator produces strings using only the selected charset via `crypto.getRandomValues`
* Lorem Ipsum Generator produces valid words / sentences / paragraphs
* JSON Formatter and Minifier round-trip JSON losslessly
* JSON Viewer renders a correct collapsible tree for deeply nested JSON
* JSON Validator accurately identifies valid and invalid JSON with error position
* JSON → CSV produces a valid CSV from a flat array of objects
* JSON → YAML produces valid YAML that round-trips correctly through a YAML parser
* YAML → JSON correctly converts YAML to JSON using js-yaml
* XML Formatter produces correctly indented XML preserving comments and attributes
* XML → JSON faithfully maps attributes, repeated elements, and text content

---

## 15. Cross-Application Design Consistency

### 15.1 Theme System

* All pages share the same theme via `stp-theme` localStorage key (`"light"` | `"dark"`, default `"dark"`)
* Theme applied via `data-theme` attribute on `<html>` before first paint using an inline `<script>` block at the top of `<body>`
* Each app page has a theme-toggle button in its `<div class="app-header">` (or portal `<nav>`)
* Button label/icon updates to reflect current theme (☀ Light / ☾ Dark)

### 15.2 Color Variables

All apps define identical CSS custom property names on `:root`:

| Variable | Purpose |
|----------|---------|
| `--bg` | Main background |
| `--bg2` | Secondary background (panels, toolbars) |
| `--bg3` | Tertiary background (hover, alt rows) |
| `--border` | Border colour |
| `--text` | Primary text |
| `--text2` | Secondary / muted text |
| `--accent` | Brand accent (blue `#0078d4`) |
| `--accent2` | Pressed / hovered accent |
| `--sidebar` | Sidebar background |

Each file provides both `:root` (light defaults) and `[data-theme="dark"]` overrides.

### 15.3 Shared UI Patterns

* **App header** (`div.app-header`): back arrow link to portal on the left, app title `<h1>` in centre-left, theme-toggle button on right — blue background (`#0078d4`), white text
* **Sidebar** (`div.sidebar`): left rail with `.tab-btn` buttons; active tab highlighted with left accent border and bold accent text
* **Status bar**: horizontal bar at the viewport bottom using the same blue as the header; shows current tool name
* **Tool panels**: hidden/shown via `.active` class; `.panel-title` in accent colour with bottom border
* **IO layout**: `.io-wrap` flex row with `.io-col` textareas and `.io-btns` centre column for action buttons
* **Buttons**: primary (accent fill), secondary (`btn-secondary` — bg2 fill), copy (small, bg2 → accent on hover)
* **Tool messages** (`.tool-msg`): `.ok` green, `.err` red, default accent blue
* **Context menus**: appear at pointer position, dismiss on outside click or Escape
* **Dialogs / modals**: backdrop overlay, centred card, keyboard-accessible (Escape closes)

### 15.4 Typography

* All apps use `font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif` for UI chrome
* Code and IO textareas use `'Consolas', 'Courier New', monospace`
* Minimum touch target size: 32 × 32 px for all interactive controls
* Font size scales with zoom only in editor area and table canvas; UI chrome is never zoomed
