# Peppy Tools Portal

A collection of six powerful, fully client-side browser tools. No server required — works offline and can be hosted on GitHub Pages for free.

---

## Live Demo

Host the folder on GitHub Pages or open `index.html` locally in any modern browser.

---

## Project Structure

```
/
├── index.html                    # Portal landing page
├── README.md
├── advanced-notepad/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── table-generator/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── encoding-tools/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── qr-barcode/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── text-tools/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── json-tools/
    ├── index.html
    ├── style.css
    └── app.js
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
| Fonts / Icons | System fonts, Unicode symbols |
| Hosting | GitHub Pages (static) |

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

## Peppy Encoding & Security Tools

### Features

| Feature | Details |
|---------|---------|
| Base64 | Encode / decode plain text (UTF-8 safe) |
| URL Encoding | Encode / decode via `encodeURIComponent` / `decodeURIComponent` |
| Hash Generator | MD5, SHA-1, SHA-256, SHA-384, SHA-512 |
| Password Generator | Configurable length & charset; strength meter; `crypto.getRandomValues` |
| UUID Generator | UUID v4 (random); nil UUID; 1–100 UUIDs per batch |
| JWT Decoder | Client-side header + payload inspection (no signature verification) |
| Dark / Light Theme | Toggle in header, persisted to localStorage |

---

## Peppy QR & Barcode Generator

### Features

| Feature | Details |
|---------|---------|
| QR Code | Free-form text / URL input; size, error-correction, and colour options |
| Barcode | CODE128, CODE39, EAN-13, EAN-8, UPC-A, ITF-14, MSI, Pharmacode |
| Customisation | Bar width, bar height, line colour, value text toggle |
| Download | QR → PNG; Barcode → SVG and PNG |
| Auto-regenerate | Preview updates automatically on any input or option change |
| Dark / Light Theme | Toggle in header, persisted to localStorage |

---

## Peppy Text Tools

### Features

| Feature | Details |
|---------|---------|
| Text Diff | Side-by-side LCS line diff with line numbers and scroll sync |
| Text Sorter | A→Z, Z→A, length, numeric, shuffle (cryptographically random) |
| Duplicate Remover | Case-sensitive / insensitive; trim whitespace; remove blank lines |
| Random Strings | Configurable length, count, charset; `crypto.getRandomValues` |
| Lorem Ipsum | Words, sentences, or paragraphs; optional standard opening text |
| Dark / Light Theme | Toggle in header, persisted to localStorage |

---

## Peppy JSON / YAML / XML Tools

### Features

| Feature | Details |
|---------|---------|
| JSON Formatter | Format (2-space, 4-space, tab) and minify |
| JSON Viewer | Interactive collapsible tree with value colour-coding |
| JSON Validator | Live debounced validation with error position |
| JSON → CSV | Array-of-objects to RFC 4180 CSV |
| JSON → YAML | Custom recursive serialiser — no external library |
| YAML → JSON | Powered by js-yaml v4 safe load |
| XML Formatter | Format (2-space, 4-space, tab) and minify via browser `DOMParser` |
| XML → JSON | Converts attributes (`@`-prefix), repeated elements, and text content |
| Dark / Light Theme | Toggle in header, persisted to localStorage |

---

## Browser Support

Tested on:
- Chrome 120+
- Edge 120+
- Firefox 121+
- Safari 17+

All features use standard Web Platform APIs with no polyfills needed.

---

## License

MIT — free to use, modify, and distribute.
