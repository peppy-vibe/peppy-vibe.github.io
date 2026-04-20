/* ═══════════════════════════════════════════════════════════
   PEPPY PDF MINI EDITOR — app.js
   Interactive visual PDF editor — 100% client-side
   Uses pdf-lib for modification and PDF.js for rendering
═══════════════════════════════════════════════════════════ */
'use strict';

/* ── PDF.js worker ── */
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

/* ────────────────────────────────────────────────────────────
   STATE
──────────────────────────────────────────────────────────── */
let pdfBytes = null;        // current raw PDF bytes (Uint8Array)
let pdfFileName = '';        // original filename
let mergeFiles = [];         // files staged in merge dialog
let selectedPages = new Set(); // 0-based indices of selected pages
let thumbScale = 1;          // thumbnail zoom multiplier
let currentView = 'grid';   // 'grid' or 'reader'
let readerPage = 1;          // current page in reader view (1-based)
let readerScale = 1;         // zoom scale in reader view
let redactMode = false;      // whether redact drawing is active
let redactRects = [];        // array of {page, x, y, w, h} for redactions
let redactDrawing = false;   // currently dragging a redact rect
let redactStart = null;      // {x, y} start of current redact drag

/* ── Render sequence — prevents stale renders overwriting newer ones ── */
let _renderSeq = 0;

/* ── Undo / Redo ── */
const undoStack = [];        // array of Uint8Array snapshots
const redoStack = [];
const MAX_UNDO = 20;
const MAX_UNDO_BYTES = 50 * 1024 * 1024; // 50 MB total undo budget

function undoStackBytes() {
  let total = 0;
  for (const s of undoStack) total += s.byteLength;
  return total;
}

function pushUndo() {
  if (!pdfBytes) return;
  undoStack.push(pdfBytes.slice());
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  // Enforce memory budget — drop oldest snapshots until under limit
  while (undoStack.length > 1 && undoStackBytes() > MAX_UNDO_BYTES) {
    undoStack.shift();
  }
  redoStack.length = 0;
  updateUndoRedoUI();
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(pdfBytes.slice());
  pdfBytes = undoStack.pop();
  updateUndoRedoUI();
  refreshCurrentView();
  toast('Undo', 'success');
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(pdfBytes.slice());
  pdfBytes = redoStack.pop();
  updateUndoRedoUI();
  refreshCurrentView();
  toast('Redo', 'success');
}
function updateUndoRedoUI() {
  const u = document.getElementById('btn-undo');
  const r = document.getElementById('btn-redo');
  if (u) u.disabled = !undoStack.length;
  if (r) r.disabled = !redoStack.length;
}
async function refreshCurrentView() {
  if (currentView === 'grid') await renderWorkspace();
  else await renderReaderPage();
}

/* ────────────────────────────────────────────────────────────
   THEME
──────────────────────────────────────────────────────────── */
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('stp-theme', next);
  updateThemeBtn();
}
function updateThemeBtn() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const btn = document.getElementById('theme-btn');
  if (btn) btn.innerHTML = isDark ? '<i class="bi bi-sun" aria-hidden="true"></i>' : '<i class="bi bi-moon-stars" aria-hidden="true"></i>';
}

/* ── FULLSCREEN ── */
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
}

/* ────────────────────────────────────────────────────────────
   TOAST
──────────────────────────────────────────────────────────── */
let toastTimer = null;
function toast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3000);
}

/* ────────────────────────────────────────────────────────────
   DIALOG HELPERS
──────────────────────────────────────────────────────────── */
function openDialog(id) { document.getElementById(id).style.display = ''; }
function closeDialog(id) { document.getElementById(id).style.display = 'none'; }

/* ────────────────────────────────────────────────────────────
   PASSWORD PROMPT DIALOG (for encrypted PDFs on open)
──────────────────────────────────────────────────────────── */
let _pwPromptResolve = null;

/** Show the password prompt dialog and return a Promise that resolves
 *  with the entered password string, or null if the user cancels. */
function promptForPDFPassword(filename) {
  return new Promise((resolve) => {
    _pwPromptResolve = resolve;
    const msg = document.getElementById('pw-prompt-msg');
    if (msg) msg.textContent = '\u201C' + filename + '\u201D is password protected. Enter the password to unlock it.';
    const input = document.getElementById('pw-prompt-input');
    if (input) input.value = '';
    openDialog('dlg-pdf-password');
    setTimeout(() => { if (input) input.focus(); }, 80);
  });
}

function pwPromptSubmit() {
  const pw = document.getElementById('pw-prompt-input').value;
  closeDialog('dlg-pdf-password');
  if (_pwPromptResolve) { _pwPromptResolve(pw); _pwPromptResolve = null; }
}

function pwPromptCancel() {
  closeDialog('dlg-pdf-password');
  if (_pwPromptResolve) { _pwPromptResolve(null); _pwPromptResolve = null; }
}

/** Load a PDF from an ArrayBuffer, handling encryption by prompting for the
 *  password when needed. Returns a pdf-lib PDFDocument with no password set.
 *  Throws if the user cancels or the password is wrong. */
async function loadPDFHandlingPassword(buf, filename) {
  const { PDFDocument } = PDFLib;
  try {
    return await PDFDocument.load(buf);
  } catch (e) {
    const msg = e.message || '';
    if (msg.toLowerCase().includes('encrypt') || msg.toLowerCase().includes('password') || msg.toLowerCase().includes('decrypt')) {
      const pw = await promptForPDFPassword(filename);
      if (pw === null) throw new Error('cancelled');
      const doc = await PDFDocument.load(buf, { password: pw, ignoreEncryption: false });
      return doc;
    }
    throw e;
  }
}

/* ────────────────────────────────────────────────────────────
   UTILITY
   (readFileAsArrayBuffer, downloadBytes, stemName, hexToRgb,
    parsePageRanges, fmtBytes are in ../lib/pdf-utils.js)
──────────────────────────────────────────────────────────── */

function getSelectedIndices() {
  return [...selectedPages].sort((a, b) => a - b);
}

function toggleRangesInput(wrapId, value) {
  const el = document.getElementById(wrapId);
  if (el) el.style.display = value === 'ranges' ? '' : 'none';
}

/* ────────────────────────────────────────────────────────────
   IMPORT: SINGLE PDF
──────────────────────────────────────────────────────────── */
function importSinglePDF() {
  document.getElementById('file-input-single').click();
}

async function handleSinglePDF(files) {
  if (!files || !files.length) return;
  const file = files[0];
  try {
    const buf = await readFileAsArrayBuffer(file);
    const doc = await loadPDFHandlingPassword(buf, file.name);
    pdfBytes = await doc.save();
    pdfFileName = file.name;
    selectedPages.clear();
    await renderWorkspace();
    toast('Loaded ' + file.name + ' (' + fmtBytes(pdfBytes.length) + ')', 'success');
  } catch (err) {
    if (err.message !== 'cancelled') toast('Error: ' + err.message, 'error');
  }
  document.getElementById('file-input-single').value = '';
}

/* ────────────────────────────────────────────────────────────
   IMPORT: MERGE MULTIPLE PDFs
──────────────────────────────────────────────────────────── */
function importMergePDFs() {
  document.getElementById('file-input-merge').click();
}

async function handleMergePDFs(files) {
  if (!files || files.length < 1) return;
  try {
    const { PDFDocument } = PDFLib;
    const merged = await PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      const buf = await readFileAsArrayBuffer(files[i]);
      const src = await loadPDFHandlingPassword(buf, files[i].name);
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach(p => merged.addPage(p));
    }
    pdfBytes = await merged.save();
    pdfFileName = files.length === 1 ? files[0].name : 'merged.pdf';
    selectedPages.clear();
    await renderWorkspace();
    toast('Merged ' + files.length + ' file(s) — ' + fmtBytes(pdfBytes.length), 'success');
  } catch (err) {
    if (err.message !== 'cancelled') toast('Error merging: ' + err.message, 'error');
  }
  document.getElementById('file-input-merge').value = '';
}

/* ────────────────────────────────────────────────────────────
   IMPORT: IMAGES TO PDF
──────────────────────────────────────────────────────────── */
/* importImages is now handled via openMergeDialog — kept as redirect */
function importImages() { openMergeDialog(); }

async function handleImages(files) {
  if (!files || !files.length) return;
  try {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      const buf = await readFileAsArrayBuffer(files[i]);
      const bytes = new Uint8Array(buf);
      let img;
      const name = files[i].name.toLowerCase();
      if (name.endsWith('.png')) {
        img = await doc.embedPng(bytes);
      } else {
        img = await doc.embedJpg(bytes);
      }
      const page = doc.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }
    pdfBytes = await doc.save();
    pdfFileName = 'images.pdf';
    selectedPages.clear();
    await refreshCurrentView();
    toast('Converted ' + files.length + ' image(s) to PDF', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* ────────────────────────────────────────────────────────────
   ADD MORE PAGES (from PDF or images into existing doc)
──────────────────────────────────────────────────────────── */
function addMorePages() {
  document.getElementById('file-input-add').click();
}

async function handleAddPages(files) {
  if (!pdfBytes || !files || !files.length) return;
  try {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(pdfBytes);
    for (let i = 0; i < files.length; i++) {
      const buf = await readFileAsArrayBuffer(files[i]);
      const name = files[i].name.toLowerCase();
      if (name.endsWith('.pdf')) {
        // Use password-aware loader so encrypted PDFs prompt for a password
        const src = await loadPDFHandlingPassword(buf, files[i].name);
        const pages = await doc.copyPages(src, src.getPageIndices());
        pages.forEach(p => doc.addPage(p));
      } else {
        const bytes = new Uint8Array(buf);
        let img;
        if (name.endsWith('.png')) {
          img = await doc.embedPng(bytes);
        } else {
          img = await doc.embedJpg(bytes);
        }
        const page = doc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
    }
    pdfBytes = await doc.save();
    selectedPages.clear();
    await refreshCurrentView();
    toast('Added ' + files.length + ' file(s)', 'success');
  } catch (err) {
    if (err.message !== 'cancelled') toast('Error: ' + err.message, 'error');
  }
  document.getElementById('file-input-add').value = '';
}

/* ────────────────────────────────────────────────────────────
   RENDER WORKSPACE — thumbnail grid
──────────────────────────────────────────────────────────── */
async function renderWorkspace() {
  if (!pdfBytes) return;

  // Sequence guard: abort this render if a newer one starts before we finish
  const mySeq = ++_renderSeq;

  const emptyEl = document.getElementById('workspace-empty');
  const toolbar = document.getElementById('workspace-toolbar');
  const grid = document.getElementById('page-grid');
  const nameDisp = document.getElementById('file-name-display');

  emptyEl.style.display = 'none';
  toolbar.style.display = '';
  const gridNavEl = document.getElementById('grid-nav');
  if (gridNavEl) gridNavEl.style.display = '';

  // File name in top bar
  nameDisp.textContent = pdfFileName + ' (' + fmtBytes(pdfBytes.length) + ')';

  // Clear grid immediately so the user sees the workspace refresh (not stale pages)
  grid.innerHTML = '';

  // Render thumbnails with PDF.js
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
  let pdfDoc;
  try {
    pdfDoc = await loadingTask.promise;
  } catch (err) {
    if (mySeq !== _renderSeq) return; // superseded; silently drop
    toast('Render error: ' + err.message, 'error');
    return;
  }

  // Abort if a newer render started while PDF.js was loading
  if (mySeq !== _renderSeq) return;

  const numPages = pdfDoc.numPages;

  document.getElementById('page-count-info').textContent = numPages + ' page(s)';

  const baseSize = 180 * thumbScale;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    const scale = baseSize / Math.max(vp.width, vp.height);
    const viewport = page.getViewport({ scale });

    const wrapper = document.createElement('div');
    wrapper.className = 'page-thumb' + (selectedPages.has(i - 1) ? ' selected' : '');
    wrapper.dataset.index = i - 1;
    wrapper.setAttribute('draggable', 'true');

    // Checkbox
    const check = document.createElement('div');
    check.className = 'page-thumb-check';
    check.textContent = selectedPages.has(i - 1) ? '✓' : '';
    check.addEventListener('click', (e) => { e.stopPropagation(); togglePageSelection(parseInt(wrapper.dataset.index)); });
    wrapper.appendChild(check);

    // Canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'page-thumb-canvas';
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    try {
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    } catch (_) { /* page render cancelled — will be replaced by next renderWorkspace */ }

    // Abort if superseded while rendering this page
    if (mySeq !== _renderSeq) return;

    wrapper.appendChild(canvas);

    // Label
    const label = document.createElement('div');
    label.className = 'page-thumb-label';
    const numSpan = document.createElement('span');
    numSpan.className = 'page-num';
    numSpan.textContent = 'Page ' + i;
    const dimSpan = document.createElement('span');
    dimSpan.className = 'page-dims';
    dimSpan.textContent = Math.round(vp.width) + '×' + Math.round(vp.height) + ' pt';
    label.appendChild(numSpan);
    label.appendChild(dimSpan);
    wrapper.appendChild(label);

    // Click to select
    wrapper.addEventListener('click', (e) => {
      if (e.target === check) return;
      togglePageSelection(parseInt(wrapper.dataset.index));
    });

    // Drag events for rearranging
    wrapper.addEventListener('dragstart', thumbDragStart);
    wrapper.addEventListener('dragover', thumbDragOver);
    wrapper.addEventListener('dragleave', thumbDragLeave);
    wrapper.addEventListener('drop', thumbDrop);
    wrapper.addEventListener('dragend', thumbDragEnd);

    grid.appendChild(wrapper);
  }

  updateZoomLabel();
}

/* ────────────────────────────────────────────────────────────
   PAGE SELECTION
──────────────────────────────────────────────────────────── */
function togglePageSelection(idx) {
  if (selectedPages.has(idx)) {
    selectedPages.delete(idx);
  } else {
    selectedPages.add(idx);
  }
  updateSelectionUI();
}

function selectAllPages() {
  if (!pdfBytes) return;
  const thumbs = document.querySelectorAll('.page-thumb');
  thumbs.forEach(t => {
    selectedPages.add(parseInt(t.dataset.index));
  });
  updateSelectionUI();
}

function deselectAllPages() {
  selectedPages.clear();
  updateSelectionUI();
}

function updateSelectionUI() {
  document.querySelectorAll('.page-thumb').forEach(t => {
    const idx = parseInt(t.dataset.index);
    const sel = selectedPages.has(idx);
    t.classList.toggle('selected', sel);
    const chk = t.querySelector('.page-thumb-check');
    if (chk) chk.textContent = sel ? '✓' : '';
  });
}

/* ────────────────────────────────────────────────────────────
   THUMBNAIL ZOOM
──────────────────────────────────────────────────────────── */
function zoomThumbs(dir) {
  const step = 0.25;
  thumbScale = Math.max(0.5, Math.min(2.5, thumbScale + dir * step));
  document.documentElement.style.setProperty('--thumb-size', Math.round(180 * thumbScale) + 'px');
  updateZoomLabel();
  // Re-render at new scale
  renderWorkspace();
}
function updateZoomLabel() {
  const el = document.getElementById('zoom-label');
  if (el) {
    const pct = currentView === 'reader'
      ? Math.round(readerScale * 100)
      : Math.round(thumbScale * 100);
    el.textContent = pct + '%';
  }
}
function zoom(dir) {
  if (currentView === 'reader') readerZoom(dir);
  else zoomThumbs(dir);
}

/* ────────────────────────────────────────────────────────────
   DRAG & DROP — REARRANGE PAGES
──────────────────────────────────────────────────────────── */
let dragSrcIdx = null;

function thumbDragStart(e) {
  dragSrcIdx = parseInt(this.dataset.index);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}
function thumbDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  this.classList.add('drag-over');
}
function thumbDragLeave() {
  this.classList.remove('drag-over');
}
async function thumbDrop(e) {
  e.stopPropagation();
  this.classList.remove('drag-over');
  const targetIdx = parseInt(this.dataset.index);
  if (dragSrcIdx === null || dragSrcIdx === targetIdx) return;
  await rearrangePages(dragSrcIdx, targetIdx);
}
function thumbDragEnd() {
  document.querySelectorAll('.page-thumb').forEach(el => {
    el.classList.remove('dragging', 'drag-over');
  });
  dragSrcIdx = null;
}

async function rearrangePages(fromIdx, toIdx) {
  pushUndo();
  try {
    const { PDFDocument } = PDFLib;
    const src = await PDFDocument.load(pdfBytes);
    const total = src.getPageCount();

    // Build new order
    const order = [];
    for (let i = 0; i < total; i++) order.push(i);
    const [moved] = order.splice(fromIdx, 1);
    order.splice(toIdx, 0, moved);

    const newDoc = await PDFDocument.create();
    const copied = await newDoc.copyPages(src, order);
    copied.forEach(p => newDoc.addPage(p));

    pdfBytes = await newDoc.save();
    selectedPages.clear();
    await renderWorkspace();
  } catch (err) {
    toast('Error rearranging: ' + err.message, 'error');
  }
}

/* ────────────────────────────────────────────────────────────
   GLOBAL DRAG & DROP — import files by dropping
──────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  updateThemeBtn();

  const body = document.body;
  const dropHint = document.getElementById('global-drop-zone');

  body.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (dropHint) dropHint.classList.add('drag-over');
  });
  body.addEventListener('dragleave', (e) => {
    if (e.relatedTarget === null || !body.contains(e.relatedTarget)) {
      if (dropHint) dropHint.classList.remove('drag-over');
    }
  });
  body.addEventListener('drop', async (e) => {
    e.preventDefault();
    if (dropHint) dropHint.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (!files.length) return;

    if (!pdfBytes) {
      // Route through the Open / Merge dialog so encrypted PDFs are handled natively
      openMergeDialog();
      handleMergeDialogFiles(files);
    } else {
      // Append pages to the existing document
      await handleAddPages(files);
    }
  });

  // Split mode toggle
  document.querySelectorAll('input[name="split-mode"]').forEach(r => {
    r.addEventListener('change', () => {
      document.getElementById('split-ranges-wrap').style.display =
        document.querySelector('input[name="split-mode"]:checked').value === 'ranges' ? '' : 'none';
    });
  });

  // Resize preset toggle
  const resizePreset = document.getElementById('resize-preset');
  if (resizePreset) {
    resizePreset.addEventListener('change', () => {
      document.getElementById('resize-custom').style.display =
        resizePreset.value === 'custom' ? '' : 'none';
    });
  }

  // Watermark opacity display
  const wmOp = document.getElementById('wm-opacity');
  if (wmOp) {
    wmOp.addEventListener('input', () => {
      document.getElementById('wm-opacity-val').textContent = wmOp.value;
    });
  }

  // Manual reader page navigation
  const readerPageInput = document.getElementById('reader-page-input');
  if (readerPageInput) {
    readerPageInput.addEventListener('change', () => {
      const n = parseInt(readerPageInput.value, 10);
      if (!isNaN(n) && n >= 1) { readerPage = n; renderReaderPage(); }
    });
    readerPageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const n = parseInt(readerPageInput.value, 10);
        if (!isNaN(n) && n >= 1) { readerPage = n; renderReaderPage(); }
      }
    });
  }

  // Merge dialog drag-drop
  const mergeDropZone = document.getElementById('merge-drop-zone');
  if (mergeDropZone) {
    mergeDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      mergeDropZone.classList.add('drag-over');
    });
    mergeDropZone.addEventListener('dragleave', () => {
      mergeDropZone.classList.remove('drag-over');
    });
    mergeDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      mergeDropZone.classList.remove('drag-over');
      handleMergeDialogFiles(e.dataTransfer.files);
    });
  }
});

/* ────────────────────────────────────────────────────────────
   EDIT: DELETE PAGES
──────────────────────────────────────────────────────────── */
async function deleteSelectedPages() {
  if (!pdfBytes) { toast('No PDF loaded', 'error'); return; }
  const sel = getSelectedIndices();
  if (!sel.length) { toast('Select pages to delete', 'error'); return; }
  pushUndo();
  try {
    const { PDFDocument } = PDFLib;
    const src = await PDFDocument.load(pdfBytes);
    const total = src.getPageCount();
    if (sel.length >= total) { toast('Cannot delete all pages', 'error'); return; }

    const keep = [];
    for (let i = 0; i < total; i++) {
      if (!sel.includes(i)) keep.push(i);
    }
    const newDoc = await PDFDocument.create();
    const copied = await newDoc.copyPages(src, keep);
    copied.forEach(p => newDoc.addPage(p));

    pdfBytes = await newDoc.save();
    selectedPages.clear();
    await renderWorkspace();
    toast('Deleted ' + sel.length + ' page(s)', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* ────────────────────────────────────────────────────────────
   EDIT: ROTATE PAGES
──────────────────────────────────────────────────────────── */
async function rotateSelectedPages(degrees) {
  if (!pdfBytes) { toast('No PDF loaded', 'error'); return; }
  const sel = getSelectedIndices();
  if (!sel.length) { toast('Select pages to rotate', 'error'); return; }
  pushUndo();
  try {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(pdfBytes);
    sel.forEach(idx => {
      const page = doc.getPage(idx);
      const cur = page.getRotation().angle;
      page.setRotation(PDFLib.degrees(cur + degrees));
    });
    pdfBytes = await doc.save();
    await renderWorkspace();
    toast('Rotated ' + sel.length + ' page(s)', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* ────────────────────────────────────────────────────────────
   EDIT: WATERMARK
──────────────────────────────────────────────────────────── */
function openWatermarkDialog() {
  if (!pdfBytes) { toast('No PDF loaded', 'error'); return; }
  openDialog('dlg-watermark');
}

async function applyWatermark() {
  const text = document.getElementById('wm-text').value.trim();
  if (!text) { toast('Enter watermark text', 'error'); return; }
  pushUndo();

  const fontSize = parseInt(document.getElementById('wm-size').value) || 50;
  const opacity = parseFloat(document.getElementById('wm-opacity').value) || 0.3;
  const color = hexToRgb(document.getElementById('wm-color').value);
  const angleDeg = parseInt(document.getElementById('wm-angle').value) || 45;
  const position = document.getElementById('wm-position').value;
  const applyTo = document.getElementById('wm-apply').value;

  try {
    const { PDFDocument, rgb, degrees } = PDFLib;
    const doc = await PDFDocument.load(pdfBytes);
    const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    const pages = doc.getPages();

    const targetPages = (() => {
      if (applyTo === 'selected' && selectedPages.size > 0) return getSelectedIndices();
      if (applyTo === 'ranges') {
        const r = parsePageRanges(document.getElementById('wm-ranges').value.trim(), pages.length);
        return r;
      }
      return pages.map((_, i) => i);
    })();
    if (!targetPages || !targetPages.length) { toast('Invalid or empty page ranges', 'error'); return; }

    targetPages.forEach(idx => {
      const page = pages[idx];
      const { width, height } = page.getSize();

      let x, y;
      switch (position) {
        case 'top-left':     x = fontSize; y = height - fontSize * 1.5; break;
        case 'top-right':    x = width - fontSize; y = height - fontSize * 1.5; break;
        case 'bottom-left':  x = fontSize; y = fontSize; break;
        case 'bottom-right': x = width - fontSize; y = fontSize; break;
        default:             x = width / 2; y = height / 2;
      }

      page.drawText(text, {
        x, y, size: fontSize, font,
        color: rgb(color.r, color.g, color.b),
        opacity,
        rotate: degrees(angleDeg),
      });
    });

    pdfBytes = await doc.save();
    closeDialog('dlg-watermark');
    refreshCurrentView();
    toast('Watermark added', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* ────────────────────────────────────────────────────────────
   EDIT: PAGE NUMBERS
──────────────────────────────────────────────────────────── */
function openPageNumbersDialog() {
  if (!pdfBytes) { toast('No PDF loaded', 'error'); return; }
  openDialog('dlg-pagenumbers');
}

async function applyPageNumbers() {
  const format = document.getElementById('pn-format').value;
  const position = document.getElementById('pn-position').value;
  const fontSize = parseInt(document.getElementById('pn-size').value) || 12;
  pushUndo();
  const color = hexToRgb(document.getElementById('pn-color').value);
  const startNum = parseInt(document.getElementById('pn-start').value) || 1;

  try {
    const { PDFDocument, rgb } = PDFLib;
    const doc = await PDFDocument.load(pdfBytes);
    const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    const pages = doc.getPages();
    const total = pages.length;
    const margin = 36;

    pages.forEach((page, i) => {
      const num = startNum + i;
      let label;
      switch (format) {
        case 'pn':   label = 'Page ' + num; break;
        case 'dash': label = '- ' + num + ' -'; break;
        case 'of':   label = num + ' of ' + (total + startNum - 1); break;
        default:     label = String(num);
      }

      const { width, height } = page.getSize();
      const tw = font.widthOfTextAtSize(label, fontSize);
      let x, y;

      switch (position) {
        case 'bottom-left':   x = margin; y = margin; break;
        case 'bottom-right':  x = width - margin - tw; y = margin; break;
        case 'top-left':      x = margin; y = height - margin; break;
        case 'top-center':    x = (width - tw) / 2; y = height - margin; break;
        case 'top-right':     x = width - margin - tw; y = height - margin; break;
        default:              x = (width - tw) / 2; y = margin; // bottom-center
      }

      page.drawText(label, {
        x, y, size: fontSize, font,
        color: rgb(color.r, color.g, color.b),
      });
    });

    pdfBytes = await doc.save();
    closeDialog('dlg-pagenumbers');
    refreshCurrentView();
    toast('Page numbers added', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* ────────────────────────────────────────────────────────────
   EDIT: CROP
──────────────────────────────────────────────────────────── */
function openCropDialog() {
  if (!pdfBytes) { toast('No PDF loaded', 'error'); return; }
  openDialog('dlg-crop');
}

async function applyCrop() {
  const top = parseFloat(document.getElementById('crop-top').value) || 0;
  pushUndo();
  const bottom = parseFloat(document.getElementById('crop-bottom').value) || 0;
  const left = parseFloat(document.getElementById('crop-left').value) || 0;
  const right = parseFloat(document.getElementById('crop-right').value) || 0;
  const applyTo = document.getElementById('crop-apply').value;

  try {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(pdfBytes);
    const pages = doc.getPages();

    const targetPages = (() => {
      if (applyTo === 'selected' && selectedPages.size > 0)
        return getSelectedIndices().map(i => pages[i]);
      if (applyTo === 'ranges') {
        const r = parsePageRanges(document.getElementById('crop-ranges').value.trim(), pages.length);
        if (!r || !r.length) return null;
        return r.map(i => pages[i]);
      }
      return pages;
    })();
    if (!targetPages) { toast('Invalid or empty page ranges', 'error'); return; }

    targetPages.forEach(page => {
      const { width, height } = page.getSize();
      page.setCropBox(left, bottom, width - left - right, height - top - bottom);
    });

    pdfBytes = await doc.save();
    closeDialog('dlg-crop');
    refreshCurrentView();
    toast('Crop applied', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* ────────────────────────────────────────────────────────────
   EDIT: RESIZE
──────────────────────────────────────────────────────────── */
function openResizeDialog() {
  if (!pdfBytes) { toast('No PDF loaded', 'error'); return; }
  openDialog('dlg-resize');
}

const PAGE_SIZES = {
  A4:     [595.28, 841.89],
  Letter: [612, 792],
  Legal:  [612, 1008],
  A3:     [841.89, 1190.55],
  A5:     [419.53, 595.28],
};

async function applyResize() {
  const preset = document.getElementById('resize-preset').value;
  pushUndo();
  let w, h;
  if (preset === 'custom') {
    w = parseFloat(document.getElementById('resize-w').value) || 612;
    h = parseFloat(document.getElementById('resize-h').value) || 792;
  } else {
    [w, h] = PAGE_SIZES[preset] || PAGE_SIZES.A4;
  }
  const applyTo = document.getElementById('resize-apply').value;

  try {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(pdfBytes);
    const pages = doc.getPages();

    const targetPages = (() => {
      if (applyTo === 'selected' && selectedPages.size > 0)
        return getSelectedIndices().map(i => pages[i]);
      if (applyTo === 'ranges') {
        const r = parsePageRanges(document.getElementById('resize-ranges').value.trim(), pages.length);
        if (!r || !r.length) return null;
        return r.map(i => pages[i]);
      }
      return pages;
    })();
    if (!targetPages) { toast('Invalid or empty page ranges', 'error'); return; }

    targetPages.forEach(page => {
      page.setSize(w, h);
    });

    pdfBytes = await doc.save();
    closeDialog('dlg-resize');
    refreshCurrentView();
    toast('Pages resized', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* ────────────────────────────────────────────────────────────
   SECURITY: ADD PASSWORD
──────────────────────────────────────────────────────────── */
function openPasswordDialog() { openPasswordLockDialog(); }

/* applyPassword is now handled via doExport() — password fields live in the Export dialog */
function applyPassword() { doExport(); }

/* ────────────────────────────────────────────────────────────
   SECURITY: REMOVE PASSWORD
──────────────────────────────────────────────────────────── */
async function removePassword() {
  if (!pdfBytes) { toast('No PDF loaded', 'error'); return; }
  const pw = prompt('Enter the PDF password:');
  if (pw === null) return;
  try {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(pdfBytes, { password: pw, ignoreEncryption: false });
    pdfBytes = await doc.save();
    await renderWorkspace();
    toast('Password removed', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* ────────────────────────────────────────────────────────────
   SECURITY: REMOVE METADATA
──────────────────────────────────────────────────────────── */
async function removeMetadata() {
  if (!pdfBytes) { toast('No PDF loaded', 'error'); return; }
  pushUndo();
  try {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(pdfBytes);
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setCreator('');
    doc.setProducer('');

    // Remove XMP metadata if present
    const catalog = doc.context.lookup(doc.context.trailerInfo.Root);
    if (catalog && catalog.get) {
      const metaRef = catalog.get(PDFLib.PDFName.of('Metadata'));
      if (metaRef) catalog.delete(PDFLib.PDFName.of('Metadata'));
    }

    pdfBytes = await doc.save();
    refreshCurrentView();
    toast('Metadata removed', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* ────────────────────────────────────────────────────────────
   SECURITY: REMOVE HIDDEN DATA
──────────────────────────────────────────────────────────── */
async function removeHiddenData() {
  if (!pdfBytes) { toast('No PDF loaded', 'error'); return; }
  pushUndo();
  try {
    const { PDFDocument, PDFName } = PDFLib;
    const doc = await PDFDocument.load(pdfBytes);

    // Strip metadata
    doc.setTitle(''); doc.setAuthor(''); doc.setSubject('');
    doc.setKeywords([]); doc.setCreator(''); doc.setProducer('');

    const catalog = doc.context.lookup(doc.context.trailerInfo.Root);
    if (catalog && catalog.get) {
      // Remove XMP
      if (catalog.get(PDFName.of('Metadata'))) catalog.delete(PDFName.of('Metadata'));
      // Remove embedded JS
      const names = catalog.get(PDFName.of('Names'));
      if (names && names.get) {
        if (names.get(PDFName.of('JavaScript'))) names.delete(PDFName.of('JavaScript'));
        if (names.get(PDFName.of('EmbeddedFiles'))) names.delete(PDFName.of('EmbeddedFiles'));
      }
    }

    // Remove annotations from pages
    doc.getPages().forEach(page => {
      const dict = page.node;
      if (dict.get && dict.get(PDFName.of('Annots'))) {
        dict.delete(PDFName.of('Annots'));
      }
    });

    pdfBytes = await doc.save();
    refreshCurrentView();
    toast('Hidden data removed', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* ────────────────────────────────────────────────────────────
   EXPORT PANEL (unified single-panel dialog)
──────────────────────────────────────────────────────────── */
function openExportPanel(/* tab unused, kept for legacy callers */) {
  if (!pdfBytes) { toast('No PDF loaded', 'error'); return; }
  const fn = document.getElementById('export-filename');
  if (fn) fn.value = pdfFileName || 'edited.pdf';
  const info = document.getElementById('export-info');
  if (info) {
    pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise.then(doc => {
      info.textContent = 'Pages: ' + doc.numPages + '   Size: ' + fmtBytes(pdfBytes.length);
    }).catch(() => {});
  }
  openDialog('dlg-export-panel');
}

/* UI helpers */
function onExportModeChange() {
  const mode = document.querySelector('input[name="export-mode"]:checked')?.value || 'all';
  const splitOpts = document.getElementById('export-split-options');
  if (splitOpts) splitOpts.style.display = mode === 'split' ? '' : 'none';
}

function onProtectToggle() {
  const enabled = document.getElementById('export-protect-enable')?.checked;
  const fields = document.getElementById('export-protect-fields');
  if (fields) fields.style.display = enabled ? '' : 'none';
}

/* Redirect legacy callers */
function switchExportTab() {}  // no-op — tabs removed
function openExportAllDialog() { openExportPanel(); }
function openExportSplitDialog() { openExportPanel(); }
function openExportExtractDialog() { openExportPanel(); }
function openPasswordLockDialog() { openExportPanel(); }
function openExportDialog() { openExportPanel(); }

/* ────────────────────────────────────────────────────────────
   UNIFIED EXPORT: all modes handled in one function
──────────────────────────────────────────────────────────── */
async function doExport() {
  if (!pdfBytes) return;
  if (!await ensureRedactionsApplied()) return;

  const mode = document.querySelector('input[name="export-mode"]:checked')?.value || 'all';
  const filename = (document.getElementById('export-filename')?.value || '').trim() || pdfFileName || 'edited.pdf';
  const compress = document.getElementById('export-compress')?.checked;
  const flatten  = document.getElementById('export-flatten')?.checked;
  const optimized = document.getElementById('export-optimized')?.checked;
  const saveOpts  = (compress || optimized) ? { useObjectStreams: true } : {};

  // Password protection
  const protectEnabled = document.getElementById('export-protect-enable')?.checked;
  let protectOpts = null;
  if (protectEnabled) {
    const userPw = document.getElementById('export-pw-user')?.value || '';
    if (!userPw) { toast('Enter a user password for protection', 'error'); return; }
    const ownerPw = document.getElementById('export-pw-owner')?.value || userPw;
    const restrictPrint = document.getElementById('export-pw-restrict-print')?.checked;
    const restrictCopy  = document.getElementById('export-pw-restrict-copy')?.checked ?? true;
    const restrictEdit  = document.getElementById('export-pw-restrict-edit')?.checked ?? true;
    const readOnly      = document.getElementById('export-pw-read-only')?.checked;
    protectOpts = {
      useObjectStreams: false,
      userPassword: userPw,
      ownerPassword: ownerPw,
      permissions: {
        printing: restrictPrint ? 'none' : (readOnly ? 'lowResolution' : 'highResolution'),
        modifying: !restrictEdit && !readOnly,
        copying: !restrictCopy && !readOnly,
        annotating: !restrictEdit && !readOnly,
        fillingForms: !readOnly,
        contentAccessibility: true,
        documentAssembly: !readOnly,
        encryptionType: 'aes256',
      },
    };
  }

  const finalOpts = protectOpts || saveOpts;

  try {
    const { PDFDocument } = PDFLib;

    if (mode === 'all') {
      const doc = await PDFDocument.load(pdfBytes);
      if (flatten) { try { doc.getForm().flatten(); } catch (_) {} }
      const bytes = await doc.save(finalOpts);
      closeDialog('dlg-export-panel');
      downloadBytes(bytes, filename);
      toast('PDF exported (' + fmtBytes(bytes.length) + ')', 'success');

    } else if (mode === 'pages') {
      const pagesStr = (document.getElementById('export-pages-input')?.value || '').trim();
      if (!pagesStr) { toast('Enter page numbers to export', 'error'); return; }
      const src    = await PDFDocument.load(pdfBytes);
      const total  = src.getPageCount();
      const indices = parsePageRanges(pagesStr, total);
      if (!indices || !indices.length) { toast('Invalid page range', 'error'); return; }
      const newDoc = await PDFDocument.create();
      const copied = await newDoc.copyPages(src, indices);
      copied.forEach(p => newDoc.addPage(p));
      if (flatten) { try { newDoc.getForm().flatten(); } catch (_) {} }
      const bytes = await newDoc.save(finalOpts);
      closeDialog('dlg-export-panel');
      downloadBytes(bytes, filename);
      toast('Exported ' + indices.length + ' page(s) (' + fmtBytes(bytes.length) + ')', 'success');

    } else if (mode === 'split') {
      const splitMode = document.querySelector('input[name="split-sub-mode"]:checked')?.value || 'all';
      const src   = await PDFDocument.load(pdfBytes);
      const total = src.getPageCount();
      const stem  = stemName(filename);
      let ranges  = [];
      if (splitMode === 'all') {
        for (let i = 0; i < total; i++) ranges.push([i]);
      } else {
        const str = (document.getElementById('export-split-ranges')?.value || '').trim();
        if (!str) { toast('Enter page ranges', 'error'); return; }
        const parsed = parseCustomRanges(str, total);
        if (!parsed || !parsed.length) { toast('Invalid range format', 'error'); return; }
        ranges = parsed;
      }
      for (let r = 0; r < ranges.length; r++) {
        const newDoc = await PDFDocument.create();
        const copied = await newDoc.copyPages(src, ranges[r]);
        copied.forEach(p => newDoc.addPage(p));
        if (flatten) { try { newDoc.getForm().flatten(); } catch (_) {} }
        const bytes = await newDoc.save(finalOpts);
        const label = splitMode === 'all' ? 'p' + (ranges[r][0] + 1) : 'part' + (r + 1);
        downloadBytes(bytes, stem + '_' + label + '.pdf');
      }
      closeDialog('dlg-export-panel');
      toast(ranges.length + ' file(s) downloaded', 'success');
    }
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* Kept for any legacy callers */
async function doExportAll() { doExport(); }
async function doExport_legacy() { doExport(); }

function parseCustomRanges(str, total) {
  const result = [];
  const parts = str.split(',').map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(s => parseInt(s.trim(), 10));
      if (isNaN(a) || isNaN(b)) return null;
      const arr = [];
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
        if (i >= 1 && i <= total) arr.push(i - 1);
      }
      result.push(arr);
    } else {
      const n = parseInt(part, 10);
      if (isNaN(n) || n < 1 || n > total) return null;
      result.push([n - 1]);
    }
  }
  return result;
}

/* ────────────────────────────────────────────────────────────
   EXPORT: EXTRACT PAGES
──────────────────────────────────────────────────────────── */
function openExtractDialog() { openExportPanel(); }
async function applyExtract() { doExport(); }

/* ────────────────────────────────────────────────────────────
   EXPORT: FLATTEN
──────────────────────────────────────────────────────────── */
async function flattenPDF() {
  if (!pdfBytes) { toast('No PDF loaded', 'error'); return; }
  pushUndo();
  try {
    const { PDFDocument, PDFName } = PDFLib;
    const doc = await PDFDocument.load(pdfBytes);
    const form = doc.getForm();
    try { form.flatten(); } catch (_) { /* no form fields */ }

    pdfBytes = await doc.save();
    await renderWorkspace();
    toast('PDF flattened', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* ────────────────────────────────────────────────────────────
   EXPORT: LOCK (READ-ONLY)
──────────────────────────────────────────────────────────── */
async function lockPDF() {
  if (!pdfBytes) { toast('No PDF loaded', 'error'); return; }
  const pw = prompt('Enter an owner password for the locked PDF:');
  if (!pw) return;

  try {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(pdfBytes);
    const bytes = await doc.save({
      useObjectStreams: false,
      ownerPassword: pw,
      permissions: {
        printing: 'lowResolution',
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: true,
        documentAssembly: false,
      },
    });
    downloadBytes(bytes, stemName(pdfFileName) + '_locked.pdf');
    toast('Locked PDF downloaded', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* ────────────────────────────────────────────────────────────
   VIEW SWITCHING (Grid / Reader)
──────────────────────────────────────────────────────────── */
function switchView(view) {
  if (!pdfBytes && view === 'reader') { toast('Open a PDF first', 'error'); return; }
  currentView = view;
  document.getElementById('vt-grid').classList.toggle('active', view === 'grid');
  document.getElementById('vt-reader').classList.toggle('active', view === 'reader');
  document.getElementById('page-grid').style.display = view === 'grid' ? '' : 'none';
  document.getElementById('reader-view').style.display = view === 'reader' ? '' : 'none';
  const gridNav = document.getElementById('grid-nav');
  if (gridNav) gridNav.style.display = view === 'grid' ? '' : 'none';
  updateZoomLabel();
  if (view === 'reader') renderReaderPage();
}

/* ────────────────────────────────────────────────────────────
   READER VIEW — single page rendering with zoom
──────────────────────────────────────────────────────────── */
async function renderReaderPage() {
  if (!pdfBytes) return;
  try {
    const doc = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise;
    const numPages = doc.numPages;
    if (readerPage > numPages) readerPage = numPages;
    if (readerPage < 1) readerPage = 1;

    const pageInput = document.getElementById('reader-page-input');
    if (pageInput) { pageInput.value = readerPage; pageInput.max = numPages; }
    const pageTotal = document.getElementById('reader-page-total');
    if (pageTotal) pageTotal.textContent = '/ ' + numPages;
    updateZoomLabel();

    const page = await doc.getPage(readerPage);
    const vp = page.getViewport({ scale: readerScale });
    const canvas = document.getElementById('reader-canvas');
    canvas.width = vp.width;
    canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;

    // Position redact overlay to match canvas
    const overlay = document.getElementById('redact-overlay');
    overlay.setAttribute('width', vp.width);
    overlay.setAttribute('height', vp.height);
    overlay.style.width = vp.width + 'px';
    overlay.style.height = vp.height + 'px';
    // Re-draw existing redact rects for this page
    drawRedactRects();
  } catch (err) {
    toast('Error rendering page: ' + err.message, 'error');
  }
}

function readerPrev() {
  if (readerPage > 1) { readerPage--; renderReaderPage(); }
}
function readerNext() {
  readerPage++;
  renderReaderPage();
}
function readerZoom(dir) {
  const step = 0.25;
  readerScale = Math.max(0.25, Math.min(4, readerScale + dir * step));
  renderReaderPage();
}

/* ────────────────────────────────────────────────────────────
   REDACT MODE — draw black rectangles on pages
──────────────────────────────────────────────────────────── */
function toggleRedactMode() {
  if (!pdfBytes) { toast('Open a PDF first', 'error'); return; }
  if (currentView !== 'reader') switchView('reader');
  redactMode = !redactMode;
  const overlay = document.getElementById('redact-overlay');
  const toggle = document.getElementById('redact-toggle');
  overlay.classList.toggle('active', redactMode);
  if (toggle) toggle.classList.toggle('active', redactMode);
  updateApplyRedactBtn();
  if (redactMode) {
    toast('Redact mode ON — draw rectangles over content, then click Apply Redact', 'success');
  }
}

function updateApplyRedactBtn() {
  const btn = document.getElementById('btn-apply-redact');
  if (btn) btn.style.display = redactRects.length > 0 ? '' : 'none';
}

function initRedactListeners() {
  const wrap = document.getElementById('reader-canvas-wrap');
  if (!wrap) return;
  const overlay = document.getElementById('redact-overlay');

  overlay.addEventListener('mousedown', (e) => {
    if (!redactMode) return;
    const rect = overlay.getBoundingClientRect();
    redactDrawing = true;
    redactStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  });
  overlay.addEventListener('mousemove', (e) => {
    if (!redactDrawing || !redactStart) return;
    const rect = overlay.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Show preview rect
    let preview = overlay.querySelector('.redact-preview');
    if (!preview) {
      preview = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      preview.classList.add('redact-preview');
      preview.setAttribute('fill', 'rgba(0,0,0,0.3)');
      preview.setAttribute('stroke', '#e05252');
      preview.setAttribute('stroke-width', '2');
      preview.setAttribute('stroke-dasharray', '4');
      overlay.appendChild(preview);
    }
    const rx = Math.min(redactStart.x, x);
    const ry = Math.min(redactStart.y, y);
    const rw = Math.abs(x - redactStart.x);
    const rh = Math.abs(y - redactStart.y);
    preview.setAttribute('x', rx);
    preview.setAttribute('y', ry);
    preview.setAttribute('width', rw);
    preview.setAttribute('height', rh);
  });
  overlay.addEventListener('mouseup', (e) => {
    if (!redactDrawing || !redactStart) return;
    const rect = overlay.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rx = Math.min(redactStart.x, x) / readerScale;
    const ry = Math.min(redactStart.y, y) / readerScale;
    const rw = Math.abs(x - redactStart.x) / readerScale;
    const rh = Math.abs(y - redactStart.y) / readerScale;
    if (rw > 5 && rh > 5) {
      redactRects.push({ page: readerPage, x: rx, y: ry, w: rw, h: rh });
    }
    redactDrawing = false;
    redactStart = null;
    // Remove preview
    const preview = overlay.querySelector('.redact-preview');
    if (preview) preview.remove();
    drawRedactRects();
    updateApplyRedactBtn();
  });
}

function drawRedactRects() {
  const overlay = document.getElementById('redact-overlay');
  overlay.querySelectorAll('rect:not(.redact-preview)').forEach(r => r.remove());
  redactRects.filter(r => r.page === readerPage).forEach(r => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    el.setAttribute('x', r.x * readerScale);
    el.setAttribute('y', r.y * readerScale);
    el.setAttribute('width', r.w * readerScale);
    el.setAttribute('height', r.h * readerScale);
    overlay.appendChild(el);
  });
}

async function applyRedactions() {
  if (!pdfBytes || !redactRects.length) { toast('No redactions drawn', 'error'); return; }
  pushUndo();
  try {
    const { PDFDocument, rgb } = PDFLib;
    const doc = await PDFDocument.load(pdfBytes);
    const pages = doc.getPages();
    redactRects.forEach(r => {
      const page = pages[r.page - 1];
      if (!page) return;
      const { height } = page.getSize();
      // PDF coords are bottom-up, canvas coords are top-down
      page.drawRectangle({
        x: r.x,
        y: height - r.y - r.h,
        width: r.w,
        height: r.h,
        color: rgb(0, 0, 0),
      });
    });
    pdfBytes = await doc.save();
    redactRects = [];
    redactMode = false;
    document.getElementById('redact-overlay').classList.remove('active');
    const toggle = document.getElementById('redact-toggle');
    if (toggle) toggle.classList.remove('active');
    updateApplyRedactBtn();
    refreshCurrentView();
    toast('Redactions applied', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* Auto-apply pending redactions before export — returns false if user cancels */
async function ensureRedactionsApplied() {
  if (!redactRects.length) return true;
  const ok = confirm(redactRects.length + ' pending redaction(s) have not been applied yet.\nApply them now before exporting?');
  if (!ok) return false;
  await applyRedactions();
  return true;
}

/* ────────────────────────────────────────────────────────────
   COMPRESS PDF
──────────────────────────────────────────────────────────── */
async function compressPDF() {
  if (!pdfBytes) { toast('No PDF loaded', 'error'); return; }
  pushUndo();
  try {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(pdfBytes);
    const before = pdfBytes.length;
    pdfBytes = await doc.save({ useObjectStreams: true });
    const after = pdfBytes.length;
    const pct = ((1 - after / before) * 100).toFixed(1);
    refreshCurrentView();
    toast('Compressed: ' + fmtBytes(before) + ' → ' + fmtBytes(after) + ' (' + pct + '% reduction)', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* ────────────────────────────────────────────────────────────
   TEXT ANNOTATION
──────────────────────────────────────────────────────────── */
function openAnnotationDialog() {
  if (!pdfBytes) { toast('No PDF loaded', 'error'); return; }
  openDialog('dlg-annotation');
}

async function applyAnnotation() {
  const text = document.getElementById('annot-text').value.trim();
  if (!text) { toast('Enter annotation text', 'error'); return; }
  pushUndo();
  try {
    const { PDFDocument, rgb } = PDFLib;
    const doc = await PDFDocument.load(pdfBytes);
    const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    const fontSize = parseInt(document.getElementById('annot-size').value) || 14;
    const color = hexToRgb(document.getElementById('annot-color').value);
    const position = document.getElementById('annot-position').value;
    const applyTo = document.getElementById('annot-apply').value;
    const pages = doc.getPages();

    const targetPages = (() => {
      if (applyTo === 'selected' && selectedPages.size > 0) return getSelectedIndices();
      if (applyTo === 'ranges') {
        const r = parsePageRanges(document.getElementById('annot-ranges').value.trim(), pages.length);
        return r;
      }
      return pages.map((_, i) => i);
    })();
    if (!targetPages || !targetPages.length) { toast('Invalid or empty page ranges', 'error'); return; }

    const textWidth = font.widthOfTextAtSize(text, fontSize);

    targetPages.forEach(idx => {
      const page = pages[idx];
      if (!page) return;
      const { width, height } = page.getSize();
      let x, y;
      const margin = 20;
      switch (position) {
        case 'top-left':      x = margin; y = height - margin - fontSize; break;
        case 'top-center':    x = (width - textWidth) / 2; y = height - margin - fontSize; break;
        case 'top-right':     x = width - textWidth - margin; y = height - margin - fontSize; break;
        case 'center':        x = (width - textWidth) / 2; y = (height - fontSize) / 2; break;
        case 'bottom-left':   x = margin; y = margin; break;
        case 'bottom-center': x = (width - textWidth) / 2; y = margin; break;
        case 'bottom-right':  x = width - textWidth - margin; y = margin; break;
        default:              x = margin; y = height - margin - fontSize;
      }
      page.drawText(text, { x, y, size: fontSize, font, color: rgb(color.r, color.g, color.b) });
    });

    pdfBytes = await doc.save();
    closeDialog('dlg-annotation');
    refreshCurrentView();
    toast('Annotation added to ' + targetPages.length + ' page(s)', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* ────────────────────────────────────────────────────────────
   DOCUMENT INFO
──────────────────────────────────────────────────────────── */
async function openDocInfoDialog() {
  if (!pdfBytes) { toast('No PDF loaded', 'error'); return; }
  try {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(pdfBytes);
    document.getElementById('doc-title').value = doc.getTitle() || '';
    document.getElementById('doc-author').value = doc.getAuthor() || '';
    document.getElementById('doc-subject').value = doc.getSubject() || '';
    document.getElementById('doc-keywords').value = (doc.getKeywords() || '');
    document.getElementById('doc-creator').value = doc.getCreator() || '';

    const stats = document.getElementById('doc-info-stats');
    const pDoc = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise;
    stats.innerHTML =
      '<b>Pages:</b> ' + pDoc.numPages +
      '<br><b>File Size:</b> ' + fmtBytes(pdfBytes.length) +
      '<br><b>Producer:</b> ' + (doc.getProducer() || 'N/A') +
      '<br><b>Creation Date:</b> ' + (doc.getCreationDate() || 'N/A') +
      '<br><b>Modification Date:</b> ' + (doc.getModificationDate() || 'N/A');

    openDialog('dlg-docinfo');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

async function applyDocInfo() {
  if (!pdfBytes) return;
  pushUndo();
  try {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(pdfBytes);
    doc.setTitle(document.getElementById('doc-title').value);
    doc.setAuthor(document.getElementById('doc-author').value);
    doc.setSubject(document.getElementById('doc-subject').value);
    doc.setKeywords(document.getElementById('doc-keywords').value.split(',').map(s => s.trim()).filter(Boolean));
    doc.setCreator(document.getElementById('doc-creator').value);

    pdfBytes = await doc.save();
    closeDialog('dlg-docinfo');
    toast('Document info updated', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* ────────────────────────────────────────────────────────────
   MERGE DIALOG
──────────────────────────────────────────────────────────── */
function openMergeDialog() {
  mergeFiles = [];
  renderMergeFileList();
  openDialog('dlg-merge');
}

function triggerMergeFileInput() {
  document.getElementById('file-input-merge').click();
}

function handleMergeDialogFiles(files) {
  for (const f of files) {
    const isPDF = f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf';
    const isImage = f.type === 'image/jpeg' || f.type === 'image/png' ||
                    /\.(jpe?g|png)$/i.test(f.name);
    if (isPDF || isImage) {
      mergeFiles.push({ file: f, name: f.name, size: f.size, isImage });
    } else {
      toast('Skipped ' + f.name + ' (only PDF, JPEG, PNG supported)', 'error');
    }
  }
  renderMergeFileList();
  document.getElementById('file-input-merge').value = '';
}

function renderMergeFileList() {
  const list = document.getElementById('merge-file-list');
  const btn = document.getElementById('btn-apply-merge');
  if (!list) return;
  list.innerHTML = '';
  if (btn) btn.disabled = mergeFiles.length < 1;
  mergeFiles.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'merge-file-item';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'mfi-name';
    nameSpan.title = item.name;
    nameSpan.textContent = item.name;
    const sizeSpan = document.createElement('span');
    sizeSpan.className = 'mfi-size';
    sizeSpan.textContent = fmtBytes(item.size);
    const upBtn = document.createElement('button');
    upBtn.className = 'mfi-btn';
    upBtn.textContent = '\u25b2';
    upBtn.title = 'Move up';
    upBtn.disabled = idx === 0;
    upBtn.onclick = () => moveMergeFile(idx, -1);
    const downBtn = document.createElement('button');
    downBtn.className = 'mfi-btn';
    downBtn.textContent = '\u25bc';
    downBtn.title = 'Move down';
    downBtn.disabled = idx === mergeFiles.length - 1;
    downBtn.onclick = () => moveMergeFile(idx, 1);
    const rmBtn = document.createElement('button');
    rmBtn.className = 'mfi-btn';
    rmBtn.textContent = '\u2715';
    rmBtn.title = 'Remove';
    rmBtn.onclick = () => removeMergeFile(idx);
    div.appendChild(nameSpan);
    div.appendChild(sizeSpan);
    div.appendChild(upBtn);
    div.appendChild(downBtn);
    div.appendChild(rmBtn);
    list.appendChild(div);
  });
}

function moveMergeFile(idx, dir) {
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= mergeFiles.length) return;
  [mergeFiles[idx], mergeFiles[newIdx]] = [mergeFiles[newIdx], mergeFiles[idx]];
  renderMergeFileList();
}

function removeMergeFile(idx) {
  mergeFiles.splice(idx, 1);
  renderMergeFileList();
}

async function applyMerge() {
  if (!mergeFiles.length) { toast('Add at least one PDF', 'error'); return; }
  try {
    const { PDFDocument } = PDFLib;
    const merged = await PDFDocument.create();
    for (const item of mergeFiles) {
      const buf = await readFileAsArrayBuffer(item.file);
      if (item.isImage) {
        const bytes = new Uint8Array(buf);
        let img;
        if (item.name.toLowerCase().endsWith('.png')) {
          img = await merged.embedPng(bytes);
        } else {
          img = await merged.embedJpg(bytes);
        }
        const page = merged.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      } else {
        const src = await loadPDFHandlingPassword(buf, item.name || item.file.name);
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
    }
    pdfBytes = await merged.save();
    pdfFileName = mergeFiles.length > 1 ? 'merged.pdf' : mergeFiles[0].name;
    selectedPages.clear();
    closeDialog('dlg-merge');
    await renderWorkspace();
    toast('Merged ' + mergeFiles.length + ' file(s) \u2014 ' + fmtBytes(pdfBytes.length), 'success');
  } catch (err) {
    if (err.message !== 'cancelled') toast('Error merging: ' + err.message, 'error');
  }
}

/* ────────────────────────────────────────────────────────────
   TOOLBAR: CONTEXT-AWARE DELETE / ROTATE DISPATCHERS
──────────────────────────────────────────────────────────── */
function deletePages() {
  if (!pdfBytes) { toast('No PDF loaded', 'error'); return; }
  if (currentView === 'reader') deleteCurrentPage();
  else deleteSelectedPages();
}

function rotatePages(deg) {
  if (!pdfBytes) { toast('No PDF loaded', 'error'); return; }
  if (currentView === 'reader') rotateCurrentPage(deg);
  else rotateSelectedPages(deg);
}

/* ────────────────────────────────────────────────────────────
   READER: DELETE / ROTATE CURRENT PAGE
──────────────────────────────────────────────────────────── */
async function deleteCurrentPage() {
  if (!pdfBytes) { toast('No PDF loaded', 'error'); return; }
  try {
    const { PDFDocument } = PDFLib;
    const src = await PDFDocument.load(pdfBytes);
    const total = src.getPageCount();
    if (total <= 1) { toast('Cannot delete the only page', 'error'); return; }
    pushUndo();
    const keep = [];
    for (let i = 0; i < total; i++) {
      if (i !== readerPage - 1) keep.push(i);
    }
    const newDoc = await PDFDocument.create();
    const copied = await newDoc.copyPages(src, keep);
    copied.forEach(p => newDoc.addPage(p));
    pdfBytes = await newDoc.save();
    if (readerPage > total - 1) readerPage = total - 1;
    await renderReaderPage();
    toast('Page deleted', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

async function rotateCurrentPage(degrees) {
  if (!pdfBytes) { toast('No PDF loaded', 'error'); return; }
  pushUndo();
  try {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(pdfBytes);
    const page = doc.getPage(readerPage - 1);
    const cur = page.getRotation().angle;
    page.setRotation(PDFLib.degrees(cur + degrees));
    pdfBytes = await doc.save();
    await renderReaderPage();
    toast('Page rotated', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

/* openPasswordLockDialog is now a redirect to openExportPanel() — defined above */

/* ────────────────────────────────────────────────────────────
   DOCUMENT INFO: ACTION WRAPPERS
──────────────────────────────────────────────────────────── */
async function removeMetadataAction() {
  closeDialog('dlg-docinfo');
  await removeMetadata();
}

async function removeHiddenDataAction() {
  closeDialog('dlg-docinfo');
  await removeHiddenData();
}

/* openExportAllDialog() — redirected to openExportPanel */

/* ────────────────────────────────────────────────────────────
   INIT ADDITIONAL LISTENERS
──────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initRedactListeners();
  updateUndoRedoUI();

  // Enter key in PDF password prompt → submit
  const pwInput = document.getElementById('pw-prompt-input');
  if (pwInput) pwInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') pwPromptSubmit(); });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      // Ctrl+Z while there are drawn-but-unapplied redact rects → remove last rect
      if (redactRects.length > 0) {
        redactRects.pop();
        drawRedactRects();
        updateApplyRedactBtn();
        toast('Redact rect removed', 'success');
      } else {
        undo();
      }
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
  });

});
