# 📄 Project Requirements

## Project Name: Peppy Tools Portal

## 1. Project Overview

Create a **static website hosted on GitHub Pages** that serves as a landing portal to two independent static web applications:

1. **Peppy Advanced Notepad Web App** (Windows Notepad-like functionality)
2. **Peppy Table Generator Web App** (Feature parity with tablesgenerator.com)

All components must be:

* 100% static (HTML, CSS, JavaScript)
* No backend server
* Deployable via GitHub Pages
* Fully client-side processing

---

# 2. System Architecture

## 2.1 Hosting

* Hosting Platform: GitHub Pages
* Repository Type: Public or Private (with Pages enabled)
* Deployment Branch: `main` or `gh-pages`
* No server-side runtime allowed

## 2.2 Folder Structure (Recommended)

```
/ (root)
 ├── index.html
 ├── /assets
 │     ├── css/
 │     ├── js/
 │     └── icons/
 ├── /advanced-notepad
 │     ├── index.html
 │     ├── style.css
 │     └── app.js
 └── /table-generator
       ├── index.html
       ├── style.css
       └── app.js
```

## 3.2 Theme Requirements

* Provide a light/dark mode toggle button in the portal header
* Persist user theme preference in `localStorage` under key `stp-theme`
* Default theme is dark
* Theme selection propagates consistently to all linked sub-applications

---



## 3.1 Functional Requirements

The index page must:

* Display project title
* Provide navigation links to:

  * Peppy Advanced Notepad
  * Peppy Table Generator
* Be responsive (mobile + desktop)
* Load fast (minimal external dependencies)

### Required Sections:

* Header (Project Name)
* Description of each app
* Clickable card/button linking to:

  * `/advanced-notepad/`
  * `/table-generator/`

---

# 4. Peppy Advanced Notepad Web Application

## 4.1 Overview

A browser-based text editor replicating core features of **Windows Notepad** from Microsoft Windows.

## 4.2 Functional Requirements

### 4.2.1 Core Editing Features

* Create new document
* Open local text file (.txt)
* Save file (.txt)
* Save As
* Undo / Redo
* Cut / Copy / Paste
* Select All
* Delete selection

### 4.2.2 Editing Capabilities

* Word wrap (toggle)
* Font family selection
* Font size selection
* Bold / Italic / Underline (optional enhancement)
* Line numbers (optional)
* Status bar showing:

  * Line number
  * Column number
  * Character count

### 4.2.3 File Handling

* Use browser File API
* No server upload
* Download generated file to user device

### 4.2.4 Keyboard Shortcuts

* Ctrl + N (New)
* Ctrl + O (Open)
* Ctrl + S (Save)
* Ctrl + Z (Undo)
* Ctrl + Y (Redo)
* Ctrl + A (Select All)
* Ctrl + F (Find)
* Ctrl + H (Replace)

### 4.2.5 Search & Replace

* Find text
* Replace text
* Replace All
* Case sensitive toggle

### 4.2.6 Markdown Support with Embedded LaTeX

* Support Markdown syntax in the editor (headers, bold, italic, lists, code blocks, tables, etc.)
* Support embedded LaTeX math expressions:
  * Inline math: `$...$`
  * Display/block math: `$$...$$`
* Toggle between **Edit mode** (plain text) and **Markdown Preview mode** (rendered output)
* Preview renders Markdown and LaTeX entirely client-side using lightweight libraries
* Keyboard shortcut: Ctrl+P to toggle preview

### 4.2.7 Light / Dark Theme

* Theme toggle button visible in the app header (sun/moon icon)
* Applies `data-theme="dark"` or `data-theme="light"` on the `<html>` element
* Reads and writes preference to `localStorage` key `stp-theme` for cross-app persistence
* Theme applied before first paint to prevent flash of wrong theme

### 4.2.8 Realtime Split Preview

* **Split mode**: editor (left pane) and live Markdown+LaTeX preview (right pane) visible simultaneously
* Preview updates automatically on every keystroke (no manual refresh)
* A draggable splitter bar between editor and preview allows resizing both panes
* Preview panel has a close (×) button to collapse back to editor-only
* Toolbar button and keyboard shortcut (Ctrl+Shift+P) to toggle split mode
* Hidden/shown state persists during the session

### 4.2.9 Zoom Controls in Status Bar

* Zoom In, Zoom Out, and Reset Zoom buttons displayed in the status bar
* Current zoom percentage shown next to zoom buttons
* Zoom affects editor font size; keyboard shortcuts Ctrl++, Ctrl+-, Ctrl+0 continue to work

### 4.2.10 Additional Editor Features

* **Word count** displayed in the status bar alongside character count
* **Auto-save draft** to localStorage to recover unsaved work on page reload
* **Tab key** inserts configurable spaces instead of moving focus
* **Word wrap toggle** clickable via status bar (in addition to Format menu)
* **Scroll synchronisation** between editor and preview in split mode
* **Insert Date/Time** via Edit menu shortcut (Ctrl+Shift+D)

### 4.2.11 Preview Button Consolidation

* Remove the dedicated toolbar **"Preview"** button (full-page Markdown preview) to eliminate redundancy with the split-pane workflow
* Rename the toolbar **"Split"** button to **"Preview"**; it continues to toggle the split-pane live preview (Ctrl+Shift+P)
* The split preview panel header exposes an **Expand** (⤢) button that extends the preview pane to occupy the full working area (hides the editor and splitter)
* Clicking the Expand button a second time restores the two-pane split layout
* The full-page Markdown Preview mode remains accessible via Format menu > Markdown Preview (Ctrl+P); only the toolbar shortcut button is removed

### 4.2.12 Dropdown Menubar Reliability

* All menu bar dropdowns (File, Edit, Format, View) must function correctly; every menu item must execute its action when clicked
* Menu buttons must **not** steal focus from the editor textarea; clicking a dropdown item must preserve the textarea's focus and any active text selection (critical for Cut, Copy, and Delete operations to act on the correct selection)
* The menu closes only **after** the clicked button's action has executed — not before — so the `click` event is never suppressed
* Paste from the Edit menu uses `navigator.clipboard.readText()` with a `document.execCommand('paste')` fallback for environments where the Clipboard API is unavailable

---

## 4.3 Non-Functional Requirements

* Must work offline after first load
* Must support modern browsers:

  * Chrome
  * Edge
  * Firefox
* No external backend
* All data stored in memory or localStorage

---

# 5. Peppy Table Generator Web Application

## 5.1 Overview

A web-based table creation tool with similar functionality to TablesGenerator.com.

## 5.2 Functional Requirements

### 5.2.1 Table Creation

* Add row
* Remove row
* Add column
* Remove column
* Editable cells
* Merge cells
* Split cells

### 5.2.2 Formatting Options

#### Table-Level Settings

* Border width
* Border color
* Table width
* Alignment (left/center/right)
* Background color

#### Cell-Level Settings

* Text alignment
* Font size
* Font color
* Background color
* Padding
* Vertical alignment

### 5.2.3 Advanced Features

* Header row toggle
* Header column toggle
* HTML preview
* Code view

### 5.2.4 Export Options

Generate:

* HTML
* Markdown
* LaTeX
* CSV
* Copy to clipboard

### 5.2.5 Import

* Paste HTML table and auto-render
* Paste CSV and convert to table

### 5.2.6 Spreadsheet Paste

* Support pasting table data copied directly from spreadsheet applications (e.g., Microsoft Excel, Google Sheets, LibreOffice Calc)
* Detect tab-separated values (TSV) format from clipboard
* Auto-populate cells starting from the current selected/anchor cell
* Handle mismatched row/column counts gracefully (expand table if needed)

### 5.2.7 Right-Click Context Menu

* Right-clicking any cell opens a context menu
* Context menu options:
  * Insert Row Above
  * Insert Row Below
  * Insert Column Left
  * Insert Column Right
  * Delete Row
  * Delete Column
* Menu closes on any outside click or Escape key

### 5.2.8 Cell Editing Reliability

* Clicking a cell must always reliably enter typing/edit mode immediately
* First click selects the cell; the cell is immediately editable without requiring a second click
* Selection highlight (visual indicator) must not interfere with cell focus or text cursor placement
* DOM must not be unnecessarily reconstructed on single-cell selection events

### 5.2.9 Light / Dark Theme

* Theme toggle button in the app header consistent with portal and notepad
* Same `stp-theme` localStorage key for cross-app persistence
* All table, panel, toolbar, dialog, and context-menu surfaces respond to theme changes

### 5.2.10 Right-Click Copy / Paste Cell

* "Copy Cell" in the context menu copies **all currently selected cells** as TSV (tab-separated values) to the system clipboard; a single-cell selection copies plain text
* "Paste Cell" detects TSV / multi-line clipboard content and routes it through the spreadsheet paste handler; plain text is pasted into every selected cell
* Operates on multi-cell selections — paste fills all selected cells
* Right-clicking a cell that is part of an existing multi-cell selection **preserves** the full selection; right-clicking an unselected cell resets the selection to that single cell
* Copy Cell writes to the **system clipboard** using `navigator.clipboard.writeText` with a `textarea` + `execCommand` fallback for non-HTTPS / restricted browser contexts
* Paste Cell reads from the **system clipboard** using `navigator.clipboard.readText` (prompts for permission if needed) with fallback to the internal copy-cell clipboard

### 5.2.11 Spreadsheet Copy / Paste

* Correctly detect TSV clipboard content from Excel, Google Sheets, and LibreOffice Calc on all platforms
* Parse both LF and CRLF line endings
* On paste: expand table dimensions automatically if the pasted data exceeds current table bounds
* On copy (Ctrl+C): when two or more cells are selected, the selected cells are written to the clipboard as TSV so they can be pasted back into a spreadsheet application; single-cell copy falls through to default browser behaviour
* Paste from spreadsheet must work when keyboard focus is on **any table cell** (not only the anchor cell); a document-level `paste` event listener handles this case and delegates to the TSV parser

### 5.2.12 Zoom Controls

* Zoom controls (A−, current %, A+, ⊙ reset) displayed in the **status bar** (consistent with the Peppy Advanced Notepad pattern)
* Zoom controls removed from the main toolbar
* Zoom scales the table cell font size without affecting export output

### 5.2.13 Additional Table Features

* **Keyboard navigation**: Tab / Shift+Tab moves between cells; Enter / Shift+Enter moves down/up
* **Status bar**: shows table dimensions (rows × columns) and current zoom level
* **Auto-fit column width**: double-click a column boundary to auto-size
* **Scroll sync** in split-pane scenarios

### 5.2.14 Settings Panel Dark Theme

* The settings panel tab buttons (Table / Cell) must render correctly in dark theme
* Inactive tab background must use the active theme's secondary background variable (`--tg-bg3`) instead of a hardcoded light colour
* Active tab background must use `--tg-bg2` (the panel content background) to remain visually connected to the panel below
* Tab text and border colours must use theme variables

### 5.2.15 Selection Hint in Status Bar

* Remove the "Click cells to select · Shift+click to extend" hint text from the **app header**
* Display the same hint in the **status bar** at a reduced opacity, consistent with the status-bar pattern used across apps

### 5.2.16 Clear Cell Content

* The "Clear" toolbar button erases content from all selected cells and immediately re-renders the table
* `renderTable()` must **not** call `syncContent()` internally; doing so would re-read stale DOM values and silently overwrite cell changes made in memory immediately before the render (root cause of clear and paste not applying)
* Any function that calls `renderTable()` without first calling `syncContent()` — currently `toggleHeaderRow()` and `toggleHeaderCol()` — must call `syncContent()` before modifying state so that any in-flight typing is captured before the DOM is rebuilt

---

# 6. UI/UX Requirements

## 6.1 Design

* Clean, minimal interface
* Toolbar-based layout
* Responsive design
* Accessible color contrast

## 6.2 Performance

* Load time < 2 seconds
* Smooth interaction
* No heavy frameworks unless necessary

---

# 7. Technical Constraints

* Must be fully static
* No Node.js backend
* Optional:

  * Vanilla JS preferred
  * Lightweight libraries allowed (e.g., CodeMirror, Tabulator)

---

# 8. Security Requirements

* No external data transmission
* No user data stored remotely
* Prevent XSS when importing HTML (sanitize input)

---

# 9. Future Enhancements (Optional)

* PWA support
* Dark mode
* Auto-save
* Cloud storage integration (Google Drive, GitHub Gist)
* Drag & drop file support

---

# 10. Acceptance Criteria

The system is considered complete when:

* GitHub Pages successfully hosts the site
* Landing page links correctly to both apps
* Notepad can open/save local files
* Peppy Table Generator exports valid HTML identical to manual creation
* All features function fully client-side
* Light/dark theme toggle works on all pages and persists across navigation via localStorage
* Split-pane preview in notepad renders Markdown + LaTeX in realtime without losing the editor
* Zoom controls in both apps scale text without affecting export output
* All notepad menu bar items (File, Edit, Format, View) execute their actions correctly on click without disrupting editor focus or selection
* Right-click Copy Cell / Paste Cell works for single and multi-cell selections, including TSV round-trips with spreadsheet applications
* Ctrl+C on a multi-cell selection in the table generator copies the cells as TSV to the system clipboard
* The Clear toolbar button reliably erases content from selected cells
* TSV paste from Excel / Google Sheets fills the correct cells and expands the table when needed

---

# 11. Cross-Application Design Consistency

## 11.1 Theme System

* All pages (portal, notepad, Peppy Table Generator) share the same theme via the `stp-theme` localStorage key (`"light"` | `"dark"`, default `"dark"`)
* Theme is applied via `data-theme` attribute on `<html>` element **before** first paint using an inline `<script>` block at the top of `<body>`
* Each page has a theme-toggle button in its `<div class="app-header">` (or portal `<nav>`)
* Button label/icon updates to reflect current theme (☀ Light / ☾ Dark)

## 11.2 Color Variables

* All apps define identical CSS custom property names on `:root`:
  * `--bg` — main background
  * `--bg2` — secondary background (panels, toolbars)
  * `--bg3` — tertiary background (hover, alt rows)
  * `--border` — border color
  * `--text` — primary text
  * `--text2` — secondary/muted text
  * `--accent` — brand accent (blue `#0078d4`)
  * `--accent-hover` — hovered accent
* Each file provides both `:root` (light defaults) and `[data-theme="dark"] :root` overrides

## 11.3 Shared UI Patterns

* **App header** (`div.app-header`): back arrow link on left, app title h1 in center-left, theme-toggle button on right
* **Status bar**: horizontal bar at bottom of viewport with equal padding on all app pages
* **Zoom controls**: A− / percentage / A+ / ⊙ pattern in the **status bar** for both Peppy Advanced Notepad and Peppy Table Generator
* **Context menus**: appear at pointer position, dismiss on outside click or Escape, consistent padding/border-radius
* **Dialogs / modals**: backdrop overlay, centered card, close button, keyboard-accessible (Escape closes)

## 11.4 Typography

* All apps use `font-family: 'Segoe UI', system-ui, sans-serif` for UI chrome
* Notepad editor uses `'Consolas', 'Courier New', monospace`
* Minimum touch target size: 32 × 32 px for buttons
* Font size scales with zoom (notepad editor area and table canvas only; UI chrome never zooms)

