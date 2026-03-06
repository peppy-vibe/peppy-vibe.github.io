'use strict';

/* ── State ─────────────────────────────────── */
const S = {
  rows: 3,
  cols: 3,
  data: [],            // 2D array [r][c] of cell objects
  sel: new Set(),      // 'r,c' strings
  anchor: null,        // {r, c}
  headerRow: false,
  headerCol: false,
  importMode: null,    // 'html' | 'csv'
  previewText: '',
  previewFile: '',
  ts: {                // table settings
    borderW: 1,
    borderC: '#000000',
    width:   '100%',
    align:   'center',
    bg:      '',
    cellPad: '6px',
  },
};

/* ── Cell factory ──────────────────────────── */
function mkCell() {
  return {
    text: '', colspan: 1, rowspan: 1, isHidden: false,
    textAlign: '', verticalAlign: '', fontSize: '',
    color: '', backgroundColor: '', padding: '',
    fontWeight: '', fontStyle: '',
  };
}

/* ── Bootstrap ─────────────────────────────── */
initTable(3, 3);

function initTable(r, c) {
  S.rows = r;
  S.cols = c;
  S.data = Array.from({ length: r }, () => Array.from({ length: c }, mkCell));
  S.sel.clear();
  S.anchor = null;
  renderTable();
}

/* ── Render ────────────────────────────────── */
function renderTable() {
  // NOTE: do NOT call syncContent() here. Callers that need to preserve
  // in-flight typing already call syncContent() before modifying S.data.
  // Calling it here would re-read stale DOM values and overwrite those
  // modifications (breaking clearCells, pasteSpreadsheet, _pasteTextToCells).

  const ts  = S.ts;
  const brd = ts.borderW > 0 ? `${ts.borderW}px solid ${ts.borderC}` : 'none';

  const tbl = document.createElement('table');
  tbl.style.borderCollapse = 'collapse';
  tbl.style.width          = ts.width;
  if (ts.bg) tbl.style.backgroundColor = ts.bg;
  if (ts.align === 'center') { tbl.style.marginLeft = tbl.style.marginRight = 'auto'; }
  else if (ts.align === 'right') { tbl.style.marginLeft = 'auto'; tbl.style.marginRight = ''; }
  else { tbl.style.marginLeft = tbl.style.marginRight = ''; }

  for (let r = 0; r < S.rows; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < S.cols; c++) {
      const cell = S.data[r][c];
      if (cell.isHidden) continue;

      const useHeader = (S.headerRow && r === 0) || (S.headerCol && c === 0);
      const el = document.createElement(useHeader ? 'th' : 'td');

      if (cell.colspan > 1) el.setAttribute('colspan', cell.colspan);
      if (cell.rowspan > 1) el.setAttribute('rowspan', cell.rowspan);
      el.dataset.r = r;
      el.dataset.c = c;
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'false');

      // Style
      el.style.border        = brd;
      el.style.padding       = cell.padding      || ts.cellPad;
      el.style.verticalAlign = cell.verticalAlign || 'top';
      if (cell.textAlign)       el.style.textAlign       = cell.textAlign;
      if (cell.fontSize)        el.style.fontSize        = cell.fontSize;
      if (cell.color)           el.style.color           = cell.color;
      if (cell.backgroundColor) el.style.backgroundColor = cell.backgroundColor;
      if (cell.fontWeight)      el.style.fontWeight      = cell.fontWeight;
      if (cell.fontStyle)       el.style.fontStyle       = cell.fontStyle;

      if (S.sel.has(`${r},${c}`)) el.classList.add('sel');

      el.textContent = cell.text;

      el.addEventListener('mousedown',  (e) => onCellMouseDown(e, r, c), true);
      el.addEventListener('input',      ()  => { S.data[r][c].text = el.textContent; });
      el.addEventListener('paste',      onCellPaste);
      el.addEventListener('keydown',    onCellKeydown);
      el.addEventListener('contextmenu', (e) => onCellContextMenu(e, r, c));

      tr.appendChild(el);
    }
    tbl.appendChild(tr);
  }

  const container = document.getElementById('tbl-container');
  container.innerHTML = '';
  container.appendChild(tbl);
  updateTblStatusBar();
}

/* Sync textContent → data before structural ops */
function syncContent() {
  document.querySelectorAll('#tbl-container [data-r]').forEach(el => {
    const r = +el.dataset.r, c = +el.dataset.c;
    if (S.data[r] && S.data[r][c]) S.data[r][c].text = el.textContent;
  });
}

/* ── Cell interaction ──────────────────────── */
/* Update only CSS classes (no DOM rebuild) so focus is never stolen */
function updateSelClasses() {
  document.querySelectorAll('#tbl-container [data-r]').forEach(el => {
    el.classList.toggle('sel', S.sel.has(`${el.dataset.r},${el.dataset.c}`));
  });
}

function onCellMouseDown(e, r, c) {
  closeCtxMenu();
  if (e.shiftKey && S.anchor) {
    e.preventDefault();
    extendSel(r, c);
    updateSelClasses();
  } else {
    // Only update selection state; do NOT call renderTable() which destroys focus
    S.anchor = { r, c };
    S.sel    = new Set([`${r},${c}`]);
    updateSelClasses();
  }
}

function extendSel(toR, toC) {
  const { r: ar, c: ac } = S.anchor;
  const minR = Math.min(ar, toR), maxR = Math.max(ar, toR);
  const minC = Math.min(ac, toC), maxC = Math.max(ac, toC);
  S.sel = new Set();
  for (let r = minR; r <= maxR; r++)
    for (let c = minC; c <= maxC; c++)
      S.sel.add(`${r},${c}`);
}

/* Only allow plain text when pasting into cells.
   If clipboard contains TSV (from Excel/Sheets), fill multiple cells. */
function onCellPaste(e) {
  e.preventDefault();
  e.stopPropagation();  // prevent document-level handler from double-processing
  const text = (e.clipboardData || window.clipboardData).getData('text/plain');
  if (!text) return;

  // Detect spreadsheet TSV paste (contains tab characters)
  if (text.includes('\t')) {
    pasteSpreadsheet(text);
    return;
  }

  // Plain text: insert at cursor position in current cell
  document.execCommand('insertText', false, text);
}

// Document-level paste handler: catches pastes when focus is on canvas (no cell focused)
document.addEventListener('paste', (e) => {
  // Skip if a table cell is handling it (stopPropagation above prevents this from firing for cells)
  const text = (e.clipboardData || window.clipboardData).getData('text/plain');
  if (!text || !text.includes('\t')) return;
  e.preventDefault();
  pasteSpreadsheet(text);
});

function pasteSpreadsheet(text) {
  // Parse TSV rows: Excel uses \r\n or \n
  const rows = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  // Drop trailing empty row if Excel adds one
  while (rows.length && rows[rows.length - 1] === '') rows.pop();
  if (!rows.length) return;

  syncContent();

  const anchorR = S.anchor ? S.anchor.r : 0;
  const anchorC = S.anchor ? S.anchor.c : 0;

  // Expand table if needed
  const needRows = anchorR + rows.length;
  const needCols = anchorC + Math.max(...rows.map(r => r.split('\t').length));
  while (S.rows < needRows) { S.data.push(Array.from({ length: S.cols }, mkCell)); S.rows++; }
  while (S.cols < needCols) { S.data.forEach(row => row.push(mkCell())); S.cols++; }
  document.getElementById('inp-rows').value = S.rows;
  document.getElementById('inp-cols').value = S.cols;

  rows.forEach((line, ri) => {
    const cells = line.split('\t');
    cells.forEach((val, ci) => {
      const r = anchorR + ri;
      const c = anchorC + ci;
      if (S.data[r]?.[c]) S.data[r][c].text = val;
    });
  });

  S.sel.clear();
  renderTable();
}

function onCellKeydown(e) {
  if (e.key === 'Escape') {
    const el = e.target;
    const r = +el.dataset.r, c = +el.dataset.c;
    S.sel = new Set([`${r},${c}`]);
    el.blur();
  }
}

/* ── Table structure ops ───────────────────── */
function addRow() {
  syncContent();
  S.data.push(Array.from({ length: S.cols }, mkCell));
  S.rows++;
  document.getElementById('inp-rows').value = S.rows;
  renderTable();
}

function removeLastRow() {
  if (S.rows <= 1) return;
  syncContent();
  S.data.pop();
  S.rows--;
  document.getElementById('inp-rows').value = S.rows;
  S.sel.clear();
  renderTable();
}

function addCol() {
  syncContent();
  S.data.forEach(row => row.push(mkCell()));
  S.cols++;
  document.getElementById('inp-cols').value = S.cols;
  renderTable();
}

function removeLastCol() {
  if (S.cols <= 1) return;
  syncContent();
  S.data.forEach(row => row.pop());
  S.cols--;
  document.getElementById('inp-cols').value = S.cols;
  S.sel.clear();
  renderTable();
}

function resizeTable() {
  syncContent();
  let nr = Math.max(1, Math.min(50, parseInt(document.getElementById('inp-rows').value) || 1));
  let nc = Math.max(1, Math.min(30, parseInt(document.getElementById('inp-cols').value) || 1));

  while (S.rows < nr) { S.data.push(Array.from({ length: S.cols }, mkCell)); S.rows++; }
  while (S.rows > nr && S.rows > 1)  { S.data.pop(); S.rows--; }
  while (S.cols < nc) { S.data.forEach(row => row.push(mkCell())); S.cols++; }
  while (S.cols > nc && S.cols > 1)  { S.data.forEach(row => row.pop()); S.cols--; }

  S.sel.clear();
  renderTable();
}

/* ── Merge / Split ─────────────────────────── */
function mergeCells() {
  if (S.sel.size < 2) { alert('Select at least 2 cells to merge.'); return; }
  syncContent();

  const coords = [...S.sel].map(k => k.split(',').map(Number));
  const minR = Math.min(...coords.map(([r]) => r));
  const maxR = Math.max(...coords.map(([r]) => r));
  const minC = Math.min(...coords.map(([, c]) => c));
  const maxC = Math.max(...coords.map(([, c]) => c));

  // Collect combined text from visible cells in bounding box
  let combined = '';
  for (let r = minR; r <= maxR; r++)
    for (let c = minC; c <= maxC; c++) {
      const cell = S.data[r][c];
      if (!cell.isHidden && cell.text.trim()) combined += (combined ? ' ' : '') + cell.text.trim();
    }

  // Set top-left as merged
  const tl = S.data[minR][minC];
  tl.colspan  = maxC - minC + 1;
  tl.rowspan  = maxR - minR + 1;
  tl.isHidden = false;
  tl.text     = combined;

  // Hide all other cells in range
  for (let r = minR; r <= maxR; r++)
    for (let c = minC; c <= maxC; c++) {
      if (r === minR && c === minC) continue;
      const cell = S.data[r][c];
      cell.isHidden = true;
      cell.colspan  = 1;
      cell.rowspan  = 1;
      cell.text     = '';
    }

  S.sel = new Set([`${minR},${minC}`]);
  renderTable();
}

function splitCell() {
  if (S.sel.size !== 1) { alert('Select exactly one merged cell to split.'); return; }
  syncContent();

  const [key] = S.sel;
  const [r, c] = key.split(',').map(Number);
  const cell   = S.data[r][c];

  if (cell.colspan === 1 && cell.rowspan === 1) { alert('Selected cell is not merged.'); return; }

  // Restore covered cells
  for (let dr = 0; dr < cell.rowspan; dr++)
    for (let dc = 0; dc < cell.colspan; dc++) {
      if (dr === 0 && dc === 0) continue;
      const covered     = S.data[r + dr][c + dc];
      covered.isHidden  = false;
      covered.text      = '';
    }

  cell.colspan = 1;
  cell.rowspan = 1;
  renderTable();
}

function clearCells() {
  syncContent();
  S.sel.forEach(k => {
    const [r, c] = k.split(',').map(Number);
    if (!S.data[r][c].isHidden) S.data[r][c].text = '';
  });
  renderTable();
}

/* ── Header toggles ────────────────────────── */
function toggleHeaderRow() {
  syncContent();
  S.headerRow = !S.headerRow;
  document.getElementById('btn-hrow').classList.toggle('active', S.headerRow);
  renderTable();
}

function toggleHeaderCol() {
  syncContent();
  S.headerCol = !S.headerCol;
  document.getElementById('btn-hcol').classList.toggle('active', S.headerCol);
  renderTable();
}

/* ── Table settings ────────────────────────── */
function applyTableSettings() {
  const ts = S.ts;
  ts.borderW  = Math.max(0, parseInt(document.getElementById('ts-border-w').value) || 0);
  ts.borderC  = document.getElementById('ts-border-c').value;
  ts.width    = document.getElementById('ts-width').value   || '100%';
  ts.align    = document.getElementById('ts-align').value;
  ts.cellPad  = document.getElementById('ts-pad').value     || '6px';
  const bgNone = document.getElementById('ts-bg-none').checked;
  ts.bg = bgNone ? '' : document.getElementById('ts-bg').value;

  // Update DOM directly (no full re-render → no cursor loss)
  const tbl = document.querySelector('#tbl-container table');
  if (!tbl) return;

  const brd = ts.borderW > 0 ? `${ts.borderW}px solid ${ts.borderC}` : 'none';

  tbl.style.width           = ts.width;
  tbl.style.backgroundColor = ts.bg;
  if (ts.align === 'center') { tbl.style.marginLeft = tbl.style.marginRight = 'auto'; }
  else if (ts.align === 'right') { tbl.style.marginLeft = 'auto'; tbl.style.marginRight = ''; }
  else { tbl.style.marginLeft = tbl.style.marginRight = ''; }

  tbl.querySelectorAll('td, th').forEach(el => {
    const r = +el.dataset.r, c = +el.dataset.c;
    const cd = S.data[r]?.[c];
    el.style.border  = brd;
    el.style.padding = (cd?.padding) || ts.cellPad;
  });
}

/* ── Cell settings ─────────────────────────── */
function applyCellStyle(prop, value) {
  S.sel.forEach(k => {
    const [r, c] = k.split(',').map(Number);
    if (S.data[r]?.[c]) S.data[r][c][prop] = value;
    const el = document.querySelector(`#tbl-container [data-r="${r}"][data-c="${c}"]`);
    if (el) el.style[prop] = value;
  });
}

function clearCellBg() {
  const none = document.getElementById('cs-bg-none').checked;
  const val  = none ? '' : document.getElementById('cs-bg').value;
  applyCellStyle('backgroundColor', val);
}

/* ── Tab switch ────────────────────────────── */
function switchTab(btn, tabId) {
  document.querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
  btn.classList.add('active');
  document.getElementById(tabId).classList.remove('hidden');
}

/* ── Export ────────────────────────────────── */
function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function buildHTMLTable() {
  const ts  = S.ts;
  const brd = ts.borderW > 0 ? `${ts.borderW}px solid ${ts.borderC}` : 'none';
  let style = `border-collapse:collapse;width:${ts.width};`;
  if (ts.bg) style += `background:${ts.bg};`;

  let html = `<table style="${style}">\n`;
  for (let r = 0; r < S.rows; r++) {
    html += '  <tr>\n';
    for (let c = 0; c < S.cols; c++) {
      const cell = S.data[r][c];
      if (cell.isHidden) continue;
      const useH = (S.headerRow && r === 0) || (S.headerCol && c === 0);
      const tag  = useH ? 'th' : 'td';

      let cs = `border:${brd};padding:${cell.padding || ts.cellPad};vertical-align:${cell.verticalAlign || 'top'};`;
      if (cell.textAlign)       cs += `text-align:${cell.textAlign};`;
      if (cell.fontSize)        cs += `font-size:${cell.fontSize};`;
      if (cell.color)           cs += `color:${cell.color};`;
      if (cell.backgroundColor) cs += `background-color:${cell.backgroundColor};`;
      if (cell.fontWeight)      cs += `font-weight:${cell.fontWeight};`;
      if (cell.fontStyle)       cs += `font-style:${cell.fontStyle};`;

      let attrs = `style="${cs}"`;
      if (cell.colspan > 1) attrs += ` colspan="${cell.colspan}"`;
      if (cell.rowspan > 1) attrs += ` rowspan="${cell.rowspan}"`;

      html += `    <${tag} ${attrs}>${escHtml(cell.text)}</${tag}>\n`;
    }
    html += '  </tr>\n';
  }
  html += '</table>';
  return html;
}

function buildMarkdown() {
  // Build a flat grid (ignore spans for markdown)
  const grid = [];
  for (let r = 0; r < S.rows; r++) {
    const row = [];
    for (let c = 0; c < S.cols; c++) {
      if (!S.data[r][c].isHidden) {
        row.push(S.data[r][c].text.replace(/\|/g,'\\|').replace(/\n/g,' ') || '');
      }
    }
    grid.push(row);
  }
  if (!grid.length) return '';

  const maxC  = Math.max(...grid.map(r => r.length));
  const widths = Array(maxC).fill(3);
  grid.forEach(row => row.forEach((cell, i) => { widths[i] = Math.max(widths[i] || 3, cell.length); }));

  const pad = (t, w) => t + ' '.repeat(Math.max(0, w - t.length));
  let md = '';
  grid.forEach((row, ri) => {
    while (row.length < maxC) row.push('');
    md += '| ' + row.map((cell, i) => pad(cell, widths[i])).join(' | ') + ' |\n';
    if (ri === 0) md += '| ' + widths.map(w => '-'.repeat(w)).join(' | ') + ' |\n';
  });
  return md;
}

function buildLatex() {
  const cols  = Array(S.cols).fill('l').join('|');
  let   latex = `\\begin{tabular}{|${cols}|}\n\\hline\n`;
  for (let r = 0; r < S.rows; r++) {
    const cells = [];
    for (let c = 0; c < S.cols; c++) {
      const cell = S.data[r][c];
      if (cell.isHidden) continue;
      const text = cell.text.replace(/[&%$#_{}~^\\]/g, m => '\\' + m);
      cells.push(cell.colspan > 1 ? `\\multicolumn{${cell.colspan}}{|l|}{${text}}` : text);
    }
    latex += cells.join(' & ') + ' \\\\\n\\hline\n';
  }
  return latex + '\\end{tabular}';
}

function buildCSV() {
  let csv = '';
  for (let r = 0; r < S.rows; r++) {
    const cells = [];
    for (let c = 0; c < S.cols; c++) {
      if (S.data[r][c].isHidden) continue;
      const t = S.data[r][c].text;
      cells.push(t.includes(',') || t.includes('"') || t.includes('\n')
        ? '"' + t.replace(/"/g, '""') + '"'
        : t);
    }
    csv += cells.join(',') + '\n';
  }
  return csv;
}

const EXPORT_MAP = {
  html:     { build: buildHTMLTable, file: 'table.html', title: 'HTML' },
  markdown: { build: buildMarkdown,  file: 'table.md',   title: 'Markdown' },
  latex:    { build: buildLatex,     file: 'table.tex',  title: 'LaTeX' },
  csv:      { build: buildCSV,       file: 'table.csv',  title: 'CSV' },
};

function exportAs(type) {
  syncContent();
  const info          = EXPORT_MAP[type];
  S.previewText       = info.build();
  S.previewFile       = info.file;
  document.getElementById('preview-title').textContent = info.title + ' Output';
  document.getElementById('preview-code').textContent  = S.previewText;
  document.getElementById('preview-overlay').classList.add('visible');
}

function copyHTMLToClipboard() {
  syncContent();
  const html = buildHTMLTable();
  navigator.clipboard.writeText(html).then(
    () => alert('HTML copied to clipboard!'),
    () => fallbackCopy(html)
  );
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  alert('Copied to clipboard!');
}

function copyPreview() {
  navigator.clipboard.writeText(S.previewText).then(
    () => alert('Copied!'),
    () => fallbackCopy(S.previewText)
  );
}

function downloadPreview() {
  const blob = new Blob([S.previewText], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = S.previewFile;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

/* ── Import ────────────────────────────────── */
function showImportDlg(mode) {
  S.importMode = mode;
  document.getElementById('import-title').textContent =
    mode === 'html' ? 'Import HTML Table' : 'Import CSV';
  document.getElementById('import-ta').placeholder =
    mode === 'html' ? 'Paste HTML with a <table> element\u2026' : 'Paste CSV data\u2026';
  document.getElementById('import-ta').value  = '';
  document.getElementById('import-msg').textContent = '';
  document.getElementById('import-msg').className   = 'dlg-msg';
  document.getElementById('import-overlay').classList.add('visible');
  document.getElementById('import-ta').focus();
}

function doImport() {
  if (S.importMode === 'html') importHTML();
  else importCSV();
}

function importHTML() {
  const input   = document.getElementById('import-ta').value.trim();
  const msgEl   = document.getElementById('import-msg');
  if (!input) return;

  const parser  = new DOMParser();
  const doc     = parser.parseFromString(input, 'text/html');
  const tbl     = doc.querySelector('table');
  if (!tbl) {
    msgEl.textContent = 'No <table> element found.';
    msgEl.className   = 'dlg-msg err';
    return;
  }

  const trs    = tbl.querySelectorAll('tr');
  if (!trs.length) { msgEl.textContent = 'Table has no rows.'; msgEl.className = 'dlg-msg err'; return; }

  const newData = [];
  let maxCols   = 0;
  trs.forEach(tr => {
    const row = [];
    tr.querySelectorAll('td, th').forEach(td => {
      const cell   = mkCell();
      cell.text    = td.textContent || '';   // textContent — XSS safe
      cell.isHeader = td.tagName === 'TH';
      row.push(cell);
    });
    maxCols = Math.max(maxCols, row.length);
    newData.push(row);
  });

  newData.forEach(row => { while (row.length < maxCols) row.push(mkCell()); });

  S.data = newData;
  S.rows = newData.length;
  S.cols = maxCols;
  document.getElementById('inp-rows').value = S.rows;
  document.getElementById('inp-cols').value = S.cols;
  S.sel.clear();
  closeDlg('import-overlay');
  renderTable();
}

function importCSV() {
  const input = document.getElementById('import-ta').value;
  const msgEl = document.getElementById('import-msg');
  if (!input.trim()) return;

  const lines = parseCSV(input).filter(r => r.length);
  if (!lines.length) { msgEl.textContent = 'No data found.'; msgEl.className = 'dlg-msg err'; return; }

  const maxCols = Math.max(...lines.map(r => r.length));
  const newData = lines.map(line => {
    const row = line.map(t => { const cell = mkCell(); cell.text = t; return cell; });
    while (row.length < maxCols) row.push(mkCell());
    return row;
  });

  S.data = newData;
  S.rows = newData.length;
  S.cols = maxCols;
  document.getElementById('inp-rows').value = S.rows;
  document.getElementById('inp-cols').value = S.cols;
  S.sel.clear();
  closeDlg('import-overlay');
  renderTable();
}

function parseCSV(text) {
  const rows = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const row    = [];
    let inQ      = false;
    let current  = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { current += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === ',' && !inQ) {
        row.push(current); current = '';
      } else {
        current += ch;
      }
    }
    row.push(current);
    rows.push(row);
  }
  return rows;
}

/* ── Dialog helpers ────────────────────────── */
function overlayClose(e, id) {
  if (e.target.id === id) closeDlg(id);
}

function closeDlg(id) {
  document.getElementById(id).classList.remove('visible');
}

/* ── Context menu ──────────────────────────── */
function onCellContextMenu(e, r, c) {
  e.preventDefault();
  syncContent();
  S.ctxCell = { r, c };

  // Preserve an existing multi-cell selection when right-clicking inside it.
  // Only reset to single-cell if the right-clicked cell is not already selected.
  if (!S.sel.has(`${r},${c}`)) {
    S.anchor = { r, c };
    S.sel    = new Set([`${r},${c}`]);
    updateSelClasses();
  }

  const menu = document.getElementById('ctx-menu');
  menu.classList.add('visible');

  // Position near cursor, stay inside viewport
  const vw = window.innerWidth, vh = window.innerHeight;
  let x = e.clientX + 2, y = e.clientY + 2;
  const mw = 200, mh = 230;
  if (x + mw > vw) x = vw - mw - 8;
  if (y + mh > vh) y = vh - mh - 8;
  menu.style.left = x + 'px';
  menu.style.top  = y + 'px';
}

function closeCtxMenu() {
  document.getElementById('ctx-menu').classList.remove('visible');
}

document.addEventListener('mousedown', (e) => {
  if (!e.target.closest('#ctx-menu')) closeCtxMenu();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCtxMenu();
});

function ctxInsertRowAbove() {
  closeCtxMenu();
  if (!S.ctxCell) return;
  const { r } = S.ctxCell;
  syncContent();
  S.data.splice(r, 0, Array.from({ length: S.cols }, mkCell));
  S.rows++;
  document.getElementById('inp-rows').value = S.rows;
  S.sel.clear(); S.anchor = null;
  renderTable();
}

function ctxInsertRowBelow() {
  closeCtxMenu();
  if (!S.ctxCell) return;
  const { r } = S.ctxCell;
  syncContent();
  S.data.splice(r + 1, 0, Array.from({ length: S.cols }, mkCell));
  S.rows++;
  document.getElementById('inp-rows').value = S.rows;
  S.sel.clear(); S.anchor = null;
  renderTable();
}

function ctxInsertColLeft() {
  closeCtxMenu();
  if (!S.ctxCell) return;
  const { c } = S.ctxCell;
  syncContent();
  S.data.forEach(row => row.splice(c, 0, mkCell()));
  S.cols++;
  document.getElementById('inp-cols').value = S.cols;
  S.sel.clear(); S.anchor = null;
  renderTable();
}

function ctxInsertColRight() {
  closeCtxMenu();
  if (!S.ctxCell) return;
  const { c } = S.ctxCell;
  syncContent();
  S.data.forEach(row => row.splice(c + 1, 0, mkCell()));
  S.cols++;
  document.getElementById('inp-cols').value = S.cols;
  S.sel.clear(); S.anchor = null;
  renderTable();
}

function ctxDeleteRow() {
  closeCtxMenu();
  if (!S.ctxCell || S.rows <= 1) return;
  const { r } = S.ctxCell;
  syncContent();
  S.data.splice(r, 1);
  S.rows--;
  document.getElementById('inp-rows').value = S.rows;
  S.sel.clear(); S.anchor = null;
  renderTable();
}

function ctxDeleteCol() {
  closeCtxMenu();
  if (!S.ctxCell || S.cols <= 1) return;
  const { c } = S.ctxCell;
  syncContent();
  S.data.forEach(row => row.splice(c, 1));
  S.cols--;
  document.getElementById('inp-cols').value = S.cols;
  S.sel.clear(); S.anchor = null;
  renderTable();
}

/* ── Context menu: Copy / Paste cell ────────── */
S.clipCell = null;  // { text }

/* Build a TSV string from all cells in S.sel (bounding-box order). */
function _selToTSV() {
  const coords = [...S.sel].map(k => k.split(',').map(Number));
  const minR = Math.min(...coords.map(([r]) => r));
  const maxR = Math.max(...coords.map(([r]) => r));
  const minC = Math.min(...coords.map(([, c]) => c));
  const maxC = Math.max(...coords.map(([, c]) => c));
  const lines = [];
  for (let r = minR; r <= maxR; r++) {
    const row = [];
    for (let c = minC; c <= maxC; c++) {
      row.push(S.data[r]?.[c]?.text ?? '');
    }
    lines.push(row.join('\t'));
  }
  return lines.join('\n');
}

function ctxCopyCell() {
  closeCtxMenu();
  if (S.sel.size === 0) return;
  syncContent();
  const tsv = _selToTSV();
  S.clipCell = { text: tsv };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(tsv).catch(() => _fallbackCopyText(tsv));
  } else {
    _fallbackCopyText(tsv);
  }
}

function _fallbackCopyText(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch {}
  document.body.removeChild(ta);
}

function ctxPasteCell() {
  closeCtxMenu();
  const tryPaste = (text) => {
    if (!text) return;
    // TSV / multi-line → spreadsheet paste; plain text → fill all selected cells
    if (text.includes('\t') || text.includes('\n')) {
      pasteSpreadsheet(text);
    } else {
      _pasteTextToCells(text);
    }
  };
  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard.readText().then(tryPaste).catch(() => {
      if (S.clipCell) tryPaste(S.clipCell.text);
    });
  } else if (S.clipCell) {
    tryPaste(S.clipCell.text);
  }
}

function _pasteTextToCells(text) {
  if (text == null) return;
  syncContent();
  S.sel.forEach(k => {
    const [r, c] = k.split(',').map(Number);
    if (S.data[r]?.[c] && !S.data[r][c].isHidden) {
      S.data[r][c].text = text;
    }
  });
  renderTable();
}

/* ── Theme ─────────────────────────────────── */
function toggleTheme() {
  const cur  = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('stp-theme', next);
  updateThemeBtn();
}

function updateThemeBtn() {
  const btn = document.getElementById('theme-btn');
  if (!btn) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.textContent = isDark ? '\u2600 Light' : '\u263e Dark';
}

updateThemeBtn();

/* ── Zoom ──────────────────────────────────── */
let tableZoomLevel = 100;

function tableZoomIn()    { setTableZoom(Math.min(tableZoomLevel + 10, 200)); }
function tableZoomOut()   { setTableZoom(Math.max(tableZoomLevel - 10, 50));  }
function tableZoomReset() { setTableZoom(100); }

function setTableZoom(z) {
  tableZoomLevel = z;
  const c = document.getElementById('tbl-container');
  if (c) c.style.fontSize = z + '%';
  const sb = document.getElementById('sb-tbl-zoom');
  if (sb) sb.textContent = z + '%';
}

/* ── Status bar update ─────────────────────── */
// Called explicitly at the end of renderTable (see below)

function updateTblStatusBar() {
  const dims = document.getElementById('sb-dims');
  if (dims) dims.textContent = `${S.rows} \u00d7 ${S.cols}`;
  const selInfo = document.getElementById('sb-sel-info');
  if (selInfo) selInfo.textContent = S.sel.size > 1 ? `${S.sel.size} cells selected` : '';
}

/* ── Keyboard navigation in table cells ────── */
document.addEventListener('keydown', (e) => {
  const active = document.activeElement;
  if (!active || !active.dataset.r) return;
  const r = +active.dataset.r;
  const c = +active.dataset.c;

  if (e.key === 'Tab') {
    e.preventDefault();
    const next = e.shiftKey
      ? findCell(r, c, -1)
      : findCell(r, c, 1);
    if (next) { next.focus(); S.anchor = { r: +next.dataset.r, c: +next.dataset.c }; S.sel = new Set([`${next.dataset.r},${next.dataset.c}`]); updateSelClasses(); }
  } else if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const below = document.querySelector(`#tbl-container [data-r="${r+1}"][data-c="${c}"]`);
    if (below) { below.focus(); S.anchor = { r: r+1, c }; S.sel = new Set([`${r+1},${c}`]); updateSelClasses(); }
  } else if (e.key === 'Enter' && e.shiftKey) {
    e.preventDefault();
    const above = document.querySelector(`#tbl-container [data-r="${r-1}"][data-c="${c}"]`);
    if (above) { above.focus(); S.anchor = { r: r-1, c }; S.sel = new Set([`${r-1},${c}`]); updateSelClasses(); }
  }
});

function findCell(r, c, dir) {
  // Flatten cell order
  const cells = Array.from(document.querySelectorAll('#tbl-container [data-r]'));
  const idx   = cells.findIndex(el => +el.dataset.r === r && +el.dataset.c === c);
  if (idx === -1) return null;
  const next = cells[idx + dir];
  return next || null;
}

/* ── Keyboard copy (Ctrl+C) of selected cells ── */
// When more than one cell is selected, Ctrl+C writes them as TSV to the
// clipboard so the data can be pasted back into a spreadsheet application.
document.addEventListener('copy', (e) => {
  if (S.sel.size <= 1) return;          // single-cell: let browser copy the text selection normally
  if (!e.target.closest('#tbl-container')) return; // only intercept when focus is inside the table
  e.preventDefault();
  syncContent();
  const tsv = _selToTSV();
  e.clipboardData.setData('text/plain', tsv);
  S.clipCell = { text: tsv };
});

