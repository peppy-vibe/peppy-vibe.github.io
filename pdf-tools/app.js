/* ═══════════════════════════════════════════════════════════
   PEPPY PDF TOOLS — app.js
   All processing is 100% client-side using pdf-lib and PDF.js
═══════════════════════════════════════════════════════════ */
'use strict';

/* ────────────────────────────────────────────────────────────
   PDF.js worker setup
──────────────────────────────────────────────────────────── */
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
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
  if (btn) btn.textContent = isDark ? '\u2600' : '\u263E';
}
updateThemeBtn();

/** Toggle fullscreen mode */
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

/** Toggle mobile sidebar drawer */
function toggleMobileMenu() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('active');
}
/** Close mobile sidebar drawer */
function closeMobileMenu() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

/* ────────────────────────────────────────────────────────────
   SIDEBAR NAVIGATION
──────────────────────────────────────────────────────────── */
function showTool(id) {
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('tool-' + id);
  if (panel) panel.classList.add('active');
  document.querySelectorAll('[data-tool="' + id + '"]').forEach(b => b.classList.add('active'));
  const activeBtn = document.querySelector('.tab-btn[data-tool="' + id + '"]');
  if (activeBtn) {
    const grp = activeBtn.getAttribute('data-grp');
    document.querySelectorAll('.grp-nav-btn').forEach(b => b.classList.remove('active'));
    const navBtn = document.querySelector('.grp-nav-btn[data-grp="' + grp + '"]');
    if (navBtn) navBtn.classList.add('active');
  }
  closeMobileMenu();
}

function toggleGroup(grp) {
  const el = document.getElementById('grp-' + grp);
  if (el) el.classList.toggle('collapsed');
}

function jumpGroup(grp) {
  const el = document.getElementById('grp-' + grp);
  if (el) {
    el.classList.remove('collapsed');
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  document.querySelectorAll('.grp-nav-btn').forEach(b => b.classList.remove('active'));
  const navBtn = document.querySelector('.grp-nav-btn[data-grp="' + grp + '"]');
  if (navBtn) navBtn.classList.add('active');
  const firstTool = el && el.querySelector('.tab-btn');
  if (firstTool) showTool(firstTool.getAttribute('data-tool'));
}

/* ────────────────────────────────────────────────────────────
   DRAG & DROP ZONE HELPERS
──────────────────────────────────────────────────────────── */
function dzOver(e, id) {
  e.preventDefault();
  document.getElementById(id).classList.add('drag-over');
}
function dzLeave(id) {
  document.getElementById(id).classList.remove('drag-over');
}
function dzDrop(e, id, cb) {
  e.preventDefault();
  dzLeave(id);
  const files = e.dataTransfer.files;
  if (files.length) cb(files);
}

/* ────────────────────────────────────────────────────────────
   UTILITY FUNCTIONS
──────────────────────────────────────────────────────────── */
function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1048576).toFixed(2) + ' MB';
}

function setMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'tool-msg' + (type ? ' ' + type : '');
}

function setProgress(barId, wrapId, pct) {
  const bar  = document.getElementById(barId);
  const wrap = document.getElementById(wrapId);
  if (!bar || !wrap) return;
  if (pct === null) { wrap.style.display = 'none'; return; }
  wrap.style.display = '';
  bar.style.width = pct + '%';
}

/**
 * Parse a page-range string like "1, 3-5, 8" into a sorted array of
 * 0-based indices, clamped to [0, total).
 */
function parsePageRanges(str, total) {
  const indices = new Set();
  const parts = str.split(',').map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(s => parseInt(s.trim(), 10));
      if (isNaN(a) || isNaN(b)) return null;
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
        if (i >= 1 && i <= total) indices.add(i - 1);
      }
    } else {
      const n = parseInt(part, 10);
      if (isNaN(n)) return null;
      if (n >= 1 && n <= total) indices.add(n - 1);
    }
  }
  return [...indices].sort((a, b) => a - b);
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload  = () => resolve(fr.result);
    fr.onerror = () => reject(new Error('Failed to read file'));
    fr.readAsArrayBuffer(file);
  });
}

function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
}

function stemName(file) {
  return file.name.replace(/\.pdf$/i, '');
}

function makeFileItem(name, size, onRemove, draggable) {
  const div = document.createElement('div');
  div.className = 'file-item';
  if (draggable) {
    const handle = document.createElement('span');
    handle.className = 'file-item-handle';
    handle.textContent = '⠿';
    handle.title = 'Drag to reorder';
    div.appendChild(handle);
  }
  const nameSpan = document.createElement('span');
  nameSpan.className = 'file-item-name';
  nameSpan.textContent = name;
  const sizeSpan = document.createElement('span');
  sizeSpan.className = 'file-item-size';
  sizeSpan.textContent = fmtBytes(size);
  const btn = document.createElement('button');
  btn.className = 'file-item-remove';
  btn.textContent = '✕';
  btn.title = 'Remove';
  btn.onclick = onRemove;
  div.appendChild(nameSpan);
  div.appendChild(sizeSpan);
  div.appendChild(btn);
  return div;
}

/** Render a single PDF.js page to a canvas at given scale */
async function renderPDFPage(pdfDoc, pageNum, canvas, scale) {
  const page     = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  canvas.width   = viewport.width;
  canvas.height  = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
}

/* hex color (#rrggbb) to rgb floats 0-1 */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}

/* ====================================================================
   1. MERGE / COMBINE PDF
==================================================================== */
const mergeFiles = [];

function mergeDrop(files) { mergeAdd(files); }

function mergeAdd(files) {
  for (const f of files) {
    if (!f.name.toLowerCase().endsWith('.pdf') && f.type !== 'application/pdf') continue;
    mergeFiles.push(f);
  }
  // Reset input so same files can be re-added after clearing
  document.getElementById('merge-input').value = '';
  mergeRenderList();
}

function mergeRenderList() {
  const list = document.getElementById('merge-file-list');
  list.innerHTML = '';
  mergeFiles.forEach((f, i) => {
    const item = makeFileItem(f.name, f.size, () => { mergeFiles.splice(i, 1); mergeRenderList(); }, true);
    item.setAttribute('draggable', 'true');
    item.dataset.index = i;
    item.addEventListener('dragstart', mergeDragStart);
    item.addEventListener('dragover',  mergeDragOver);
    item.addEventListener('dragleave', mergeDragLeave);
    item.addEventListener('drop',      mergeDragDrop);
    item.addEventListener('dragend',   mergeDragEnd);
    list.appendChild(item);
  });
  setMsg('merge-msg', mergeFiles.length ? mergeFiles.length + ' file(s) loaded. Ready to merge.' : '', '');
}

let mergeDragSrcIdx = null;

function mergeDragStart(e) {
  mergeDragSrcIdx = parseInt(this.dataset.index, 10);
  this.classList.add('drag-source');
  e.dataTransfer.effectAllowed = 'move';
}
function mergeDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  this.classList.add('drag-over-item');
}
function mergeDragLeave() { this.classList.remove('drag-over-item'); }
function mergeDragDrop(e) {
  e.stopPropagation();
  const targetIdx = parseInt(this.dataset.index, 10);
  if (mergeDragSrcIdx !== null && mergeDragSrcIdx !== targetIdx) {
    const moved = mergeFiles.splice(mergeDragSrcIdx, 1)[0];
    mergeFiles.splice(targetIdx, 0, moved);
    mergeRenderList();
  }
}
function mergeDragEnd() {
  document.querySelectorAll('#merge-file-list .file-item').forEach(el => {
    el.classList.remove('drag-source', 'drag-over-item');
  });
  mergeDragSrcIdx = null;
}

async function mergePDFs() {
  if (mergeFiles.length < 2) { setMsg('merge-msg', 'Please add at least 2 PDF files.', 'err'); return; }
  setMsg('merge-msg', 'Merging…', '');
  setProgress('merge-prog', 'merge-prog-wrap', 5);
  try {
    const { PDFDocument } = PDFLib;
    const merged = await PDFDocument.create();
    for (let i = 0; i < mergeFiles.length; i++) {
      const buf  = await readFileAsArrayBuffer(mergeFiles[i]);
      const src  = await PDFDocument.load(buf, { ignoreEncryption: false });
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach(p => merged.addPage(p));
      setProgress('merge-prog', 'merge-prog-wrap', 5 + Math.round(90 * (i + 1) / mergeFiles.length));
    }
    const bytes = await merged.save();
    setProgress('merge-prog', 'merge-prog-wrap', 100);
    downloadBytes(bytes, 'merged.pdf');
    setMsg('merge-msg', 'Done! ' + fmtBytes(bytes.length) + ' saved.', 'ok');
    setTimeout(() => setProgress('merge-prog', 'merge-prog-wrap', null), 1500);
  } catch (err) {
    setProgress('merge-prog', 'merge-prog-wrap', null);
    setMsg('merge-msg', 'Error: ' + err.message, 'err');
  }
}

function mergeClear() {
  mergeFiles.length = 0;
  mergeRenderList();
  setMsg('merge-msg', '', '');
  setProgress('merge-prog', 'merge-prog-wrap', null);
}

/* ====================================================================
   2. SPLIT PDF
==================================================================== */
let splitFile = null;
let splitPageCount = 0;

function splitDrop(files) { splitLoad(files[0]); }

async function splitLoad(file) {
  if (!file) return;
  splitFile = file;
  try {
    const buf = await readFileAsArrayBuffer(file);
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(buf);
    splitPageCount = doc.getPageCount();
    const info = document.getElementById('split-file-info');
    info.innerHTML = '';
    info.appendChild(makeFileItem(file.name, file.size, splitClear));
    setMsg('split-msg', splitPageCount + ' page(s) loaded.', '');
    document.getElementById('split-input').value = '';
  } catch (err) {
    setMsg('split-msg', 'Error loading PDF: ' + err.message, 'err');
    splitFile = null;
  }
}

function splitModeChange() {
  const mode = document.querySelector('input[name="split-mode"]:checked').value;
  document.getElementById('split-ranges-group').style.display = mode === 'ranges' ? '' : 'none';
}

async function splitPDF() {
  if (!splitFile) { setMsg('split-msg', 'Please upload a PDF first.', 'err'); return; }
  const mode = document.querySelector('input[name="split-mode"]:checked').value;
  const { PDFDocument } = PDFLib;
  setProgress('split-prog', 'split-prog-wrap', 5);
  try {
    const buf = await readFileAsArrayBuffer(splitFile);
    const src = await PDFDocument.load(buf);
    const totalPages = src.getPageCount();

    let ranges = [];
    if (mode === 'all') {
      for (let i = 0; i < totalPages; i++) ranges.push([i]);
    } else {
      const str = document.getElementById('split-ranges').value.trim();
      if (!str) { setMsg('split-ranges-msg', 'Enter page ranges.', 'err'); setProgress('split-prog', 'split-prog-wrap', null); return; }
      const parts = str.split(',').map(s => s.trim()).filter(Boolean);
      for (const part of parts) {
        if (part.includes('-')) {
          const [a, b] = part.split('-').map(s => parseInt(s.trim(), 10));
          if (isNaN(a) || isNaN(b)) { setMsg('split-ranges-msg', 'Invalid range: ' + part, 'err'); setProgress('split-prog', 'split-prog-wrap', null); return; }
          const arr = [];
          for (let i = Math.min(a, b); i <= Math.max(a, b); i++) if (i >= 1 && i <= totalPages) arr.push(i - 1);
          ranges.push(arr);
        } else {
          const n = parseInt(part, 10);
          if (isNaN(n) || n < 1 || n > totalPages) { setMsg('split-ranges-msg', 'Invalid page: ' + part, 'err'); setProgress('split-prog', 'split-prog-wrap', null); return; }
          ranges.push([n - 1]);
        }
      }
      setMsg('split-ranges-msg', '', '');
    }

    const stem = stemName(splitFile);
    for (let r = 0; r < ranges.length; r++) {
      const newDoc = await PDFDocument.create();
      const copied = await newDoc.copyPages(src, ranges[r]);
      copied.forEach(p => newDoc.addPage(p));
      const bytes = await newDoc.save();
      const label = mode === 'all'
        ? 'p' + (ranges[r][0] + 1)
        : 'part' + (r + 1);
      downloadBytes(bytes, stem + '_' + label + '.pdf');
      setProgress('split-prog', 'split-prog-wrap', 5 + Math.round(95 * (r + 1) / ranges.length));
    }
    setMsg('split-msg', ranges.length + ' file(s) downloaded.', 'ok');
    setTimeout(() => setProgress('split-prog', 'split-prog-wrap', null), 1500);
  } catch (err) {
    setProgress('split-prog', 'split-prog-wrap', null);
    setMsg('split-msg', 'Error: ' + err.message, 'err');
  }
}

function splitClear() {
  splitFile = null;
  splitPageCount = 0;
  document.getElementById('split-file-info').innerHTML = '';
  document.getElementById('split-input').value = '';
  setMsg('split-msg', '', '');
  setProgress('split-prog', 'split-prog-wrap', null);
}

/* ====================================================================
   3. EXTRACT PAGES
==================================================================== */
let extractFile = null;

function extractDrop(files) { extractLoad(files[0]); }

async function extractLoad(file) {
  if (!file) return;
  extractFile = file;
  try {
    const buf = await readFileAsArrayBuffer(file);
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(buf);
    const info = document.getElementById('extract-file-info');
    info.innerHTML = '';
    info.appendChild(makeFileItem(file.name, file.size, extractClear));
    setMsg('extract-msg', doc.getPageCount() + ' page(s) loaded.', '');
    document.getElementById('extract-input').value = '';
  } catch (err) {
    setMsg('extract-msg', 'Error loading PDF: ' + err.message, 'err');
    extractFile = null;
  }
}

async function extractPages() {
  if (!extractFile) { setMsg('extract-msg', 'Please upload a PDF first.', 'err'); return; }
  const str = document.getElementById('extract-pages').value.trim();
  if (!str) { setMsg('extract-msg', 'Enter page numbers or ranges.', 'err'); return; }
  try {
    const { PDFDocument } = PDFLib;
    const buf   = await readFileAsArrayBuffer(extractFile);
    const src   = await PDFDocument.load(buf);
    const total = src.getPageCount();
    const idxs  = parsePageRanges(str, total);
    if (!idxs || idxs.length === 0) { setMsg('extract-msg', 'No valid pages found in that range.', 'err'); return; }
    const newDoc = await PDFDocument.create();
    const copied = await newDoc.copyPages(src, idxs);
    copied.forEach(p => newDoc.addPage(p));
    const bytes = await newDoc.save();
    downloadBytes(bytes, stemName(extractFile) + '_extracted.pdf');
    setMsg('extract-msg', idxs.length + ' page(s) extracted — ' + fmtBytes(bytes.length) + '.', 'ok');
  } catch (err) {
    setMsg('extract-msg', 'Error: ' + err.message, 'err');
  }
}

function extractClear() {
  extractFile = null;
  document.getElementById('extract-file-info').innerHTML = '';
  document.getElementById('extract-input').value = '';
  document.getElementById('extract-pages').value = '';
  setMsg('extract-msg', '', '');
}

/* ====================================================================
   4. DELETE PAGES
==================================================================== */
let deleteFile = null;

function deleteDrop(files) { deleteLoad(files[0]); }

async function deleteLoad(file) {
  if (!file) return;
  deleteFile = file;
  try {
    const buf = await readFileAsArrayBuffer(file);
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(buf);
    const info = document.getElementById('delete-file-info');
    info.innerHTML = '';
    info.appendChild(makeFileItem(file.name, file.size, deleteClear));
    setMsg('delete-msg', doc.getPageCount() + ' page(s) loaded.', '');
    document.getElementById('delete-input').value = '';
  } catch (err) {
    setMsg('delete-msg', 'Error loading PDF: ' + err.message, 'err');
    deleteFile = null;
  }
}

async function deletePages() {
  if (!deleteFile) { setMsg('delete-msg', 'Please upload a PDF first.', 'err'); return; }
  const str = document.getElementById('delete-pages').value.trim();
  if (!str) { setMsg('delete-msg', 'Enter page numbers or ranges to delete.', 'err'); return; }
  try {
    const { PDFDocument } = PDFLib;
    const buf    = await readFileAsArrayBuffer(deleteFile);
    const src    = await PDFDocument.load(buf);
    const total  = src.getPageCount();
    const toDelete = new Set(parsePageRanges(str, total) || []);
    if (toDelete.size === 0) { setMsg('delete-msg', 'No valid pages in that range.', 'err'); return; }
    if (toDelete.size === total) { setMsg('delete-msg', 'Cannot delete all pages.', 'err'); return; }
    const keep = [];
    for (let i = 0; i < total; i++) if (!toDelete.has(i)) keep.push(i);
    const newDoc = await PDFDocument.create();
    const copied = await newDoc.copyPages(src, keep);
    copied.forEach(p => newDoc.addPage(p));
    const bytes = await newDoc.save();
    downloadBytes(bytes, stemName(deleteFile) + '_deleted.pdf');
    setMsg('delete-msg', toDelete.size + ' page(s) removed. ' + fmtBytes(bytes.length) + ' saved.', 'ok');
  } catch (err) {
    setMsg('delete-msg', 'Error: ' + err.message, 'err');
  }
}

function deleteClear() {
  deleteFile = null;
  document.getElementById('delete-file-info').innerHTML = '';
  document.getElementById('delete-input').value = '';
  document.getElementById('delete-pages').value = '';
  setMsg('delete-msg', '', '');
}

/* ====================================================================
   5. ROTATE PDF PAGES
==================================================================== */
let rotateFile = null;

function rotateDrop(files) { rotateLoad(files[0]); }

async function rotateLoad(file) {
  if (!file) return;
  rotateFile = file;
  try {
    const buf = await readFileAsArrayBuffer(file);
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(buf);
    const info = document.getElementById('rotate-file-info');
    info.innerHTML = '';
    info.appendChild(makeFileItem(file.name, file.size, rotateClear));
    setMsg('rotate-msg', doc.getPageCount() + ' page(s) loaded.', '');
    document.getElementById('rotate-input').value = '';
  } catch (err) {
    setMsg('rotate-msg', 'Error loading PDF: ' + err.message, 'err');
    rotateFile = null;
  }
}

document.getElementById('rotate-target').addEventListener('change', function() {
  document.getElementById('rotate-custom-group').style.display = this.value === 'custom' ? '' : 'none';
});

async function rotatePDF() {
  if (!rotateFile) { setMsg('rotate-msg', 'Please upload a PDF first.', 'err'); return; }
  try {
    const { PDFDocument, degrees } = PDFLib;
    const buf    = await readFileAsArrayBuffer(rotateFile);
    const doc    = await PDFDocument.load(buf);
    const total  = doc.getPageCount();
    const angle  = parseInt(document.getElementById('rotate-angle').value, 10);
    const target = document.getElementById('rotate-target').value;

    let idxs = [];
    if (target === 'all') {
      for (let i = 0; i < total; i++) idxs.push(i);
    } else if (target === 'odd') {
      for (let i = 0; i < total; i += 2) idxs.push(i);
    } else if (target === 'even') {
      for (let i = 1; i < total; i += 2) idxs.push(i);
    } else {
      const str = document.getElementById('rotate-custom').value.trim();
      idxs = parsePageRanges(str, total) || [];
      if (idxs.length === 0) { setMsg('rotate-msg', 'No valid pages in custom range.', 'err'); return; }
    }

    idxs.forEach(i => {
      const page      = doc.getPage(i);
      const curAngle  = page.getRotation().angle;
      page.setRotation(degrees((curAngle + angle) % 360));
    });

    const bytes = await doc.save();
    downloadBytes(bytes, stemName(rotateFile) + '_rotated.pdf');
    setMsg('rotate-msg', idxs.length + ' page(s) rotated ' + angle + '°. ' + fmtBytes(bytes.length) + ' saved.', 'ok');
  } catch (err) {
    setMsg('rotate-msg', 'Error: ' + err.message, 'err');
  }
}

function rotateClear() {
  rotateFile = null;
  document.getElementById('rotate-file-info').innerHTML = '';
  document.getElementById('rotate-input').value = '';
  setMsg('rotate-msg', '', '');
}

/* ====================================================================
   6. REARRANGE PAGES
==================================================================== */
let rearrangeFile  = null;
let rearrangePDFjs = null;
let rearrangeTotal = 0;

function rearrangeDrop(files) { rearrangeLoad(files[0]); }

async function rearrangeLoad(file) {
  if (!file) return;
  rearrangeFile = file;
  try {
    const buf = await readFileAsArrayBuffer(file);
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(buf);
    rearrangeTotal = doc.getPageCount();

    const info = document.getElementById('rearrange-file-info');
    info.innerHTML = '';
    info.appendChild(makeFileItem(file.name, file.size, rearrangeClear));

    // Render thumbnails via PDF.js
    const pdfData = new Uint8Array(buf);
    rearrangePDFjs = await pdfjsLib.getDocument({ data: pdfData }).promise;
    await rearrangeRenderThumbs();

    const defaultOrder = Array.from({ length: rearrangeTotal }, (_, i) => i + 1).join(', ');
    document.getElementById('rearrange-order').value = defaultOrder;
    setMsg('rearrange-order-msg', rearrangeTotal + ' page(s). Edit the order above or drag thumbnails.', '');
    setMsg('rearrange-msg', '', '');
    document.getElementById('rearrange-input').value = '';
  } catch (err) {
    setMsg('rearrange-msg', 'Error loading PDF: ' + err.message, 'err');
    rearrangeFile = null;
  }
}

async function rearrangeRenderThumbs() {
  const grid = document.getElementById('rearrange-thumbs');
  grid.innerHTML = '';
  for (let i = 1; i <= rearrangeTotal; i++) {
    const thumb = document.createElement('div');
    thumb.className = 'page-thumb';
    thumb.dataset.page = i;
    const canvas = document.createElement('canvas');
    thumb.appendChild(canvas);
    const lbl = document.createElement('div');
    lbl.className = 'page-thumb-label';
    lbl.textContent = 'Page ' + i;
    thumb.appendChild(lbl);
    grid.appendChild(thumb);

    const page     = await rearrangePDFjs.getPage(i);
    const viewport = page.getViewport({ scale: 0.3 });
    canvas.width   = viewport.width;
    canvas.height  = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

    // Drag-and-drop reorder
    thumb.setAttribute('draggable', 'true');
    thumb.addEventListener('dragstart', rearrangeThumbDragStart);
    thumb.addEventListener('dragover',  rearrangeThumbDragOver);
    thumb.addEventListener('dragleave', rearrangeThumbDragLeave);
    thumb.addEventListener('drop',      rearrangeThumbDrop);
    thumb.addEventListener('dragend',   rearrangeThumbDragEnd);
  }
}

let rearrangeDragSrc = null;

function rearrangeThumbDragStart(e) {
  rearrangeDragSrc = this;
  this.classList.add('drag-source');
  e.dataTransfer.effectAllowed = 'move';
}
function rearrangeThumbDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  this.classList.add('drag-over-thumb');
}
function rearrangeThumbDragLeave() { this.classList.remove('drag-over-thumb'); }
function rearrangeThumbDrop(e) {
  e.stopPropagation();
  if (rearrangeDragSrc && rearrangeDragSrc !== this) {
    const grid = document.getElementById('rearrange-thumbs');
    const thumbs = [...grid.children];
    const srcIdx  = thumbs.indexOf(rearrangeDragSrc);
    const tgtIdx  = thumbs.indexOf(this);
    if (srcIdx < tgtIdx) grid.insertBefore(rearrangeDragSrc, this.nextSibling);
    else                  grid.insertBefore(rearrangeDragSrc, this);
    // Sync order input
    const newOrder = [...grid.children].map(t => t.dataset.page);
    document.getElementById('rearrange-order').value = newOrder.join(', ');
  }
}
function rearrangeThumbDragEnd() {
  document.querySelectorAll('#rearrange-thumbs .page-thumb').forEach(t => {
    t.classList.remove('drag-source', 'drag-over-thumb');
  });
  rearrangeDragSrc = null;
}

async function rearrangePDF() {
  if (!rearrangeFile) { setMsg('rearrange-msg', 'Please upload a PDF first.', 'err'); return; }
  const str   = document.getElementById('rearrange-order').value.trim();
  const parts = str.split(',').map(s => parseInt(s.trim(), 10));
  if (parts.some(isNaN)) { setMsg('rearrange-msg', 'Invalid order — use comma-separated numbers.', 'err'); return; }
  const idxs = parts.map(n => n - 1);
  if (idxs.some(i => i < 0 || i >= rearrangeTotal)) {
    setMsg('rearrange-msg', 'Page number out of range.', 'err');
    return;
  }
  try {
    const { PDFDocument } = PDFLib;
    const buf    = await readFileAsArrayBuffer(rearrangeFile);
    const src    = await PDFDocument.load(buf);
    const newDoc = await PDFDocument.create();
    const copied = await newDoc.copyPages(src, idxs);
    copied.forEach(p => newDoc.addPage(p));
    const bytes = await newDoc.save();
    downloadBytes(bytes, stemName(rearrangeFile) + '_reordered.pdf');
    setMsg('rearrange-msg', 'Saved ' + idxs.length + ' pages (' + fmtBytes(bytes.length) + ').', 'ok');
  } catch (err) {
    setMsg('rearrange-msg', 'Error: ' + err.message, 'err');
  }
}

function rearrangeClear() {
  rearrangeFile  = null;
  rearrangePDFjs = null;
  rearrangeTotal = 0;
  document.getElementById('rearrange-file-info').innerHTML = '';
  document.getElementById('rearrange-thumbs').innerHTML = '';
  document.getElementById('rearrange-order').value = '';
  document.getElementById('rearrange-input').value = '';
  setMsg('rearrange-order-msg', '', '');
  setMsg('rearrange-msg', '', '');
}

/* ====================================================================
   7. ADD WATERMARK
==================================================================== */
let watermarkFile = null;

function watermarkDrop(files) { watermarkLoad(files[0]); }

async function watermarkLoad(file) {
  if (!file) return;
  watermarkFile = file;
  try {
    const buf = await readFileAsArrayBuffer(file);
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(buf);
    const info = document.getElementById('watermark-file-info');
    info.innerHTML = '';
    info.appendChild(makeFileItem(file.name, file.size, watermarkClear));
    setMsg('watermark-msg', doc.getPageCount() + ' page(s) loaded.', '');
    document.getElementById('watermark-input').value = '';
  } catch (err) {
    setMsg('watermark-msg', 'Error loading PDF: ' + err.message, 'err');
    watermarkFile = null;
  }
}

async function addWatermark() {
  if (!watermarkFile) { setMsg('watermark-msg', 'Please upload a PDF first.', 'err'); return; }
  const text    = document.getElementById('wm-text').value.trim();
  if (!text) { setMsg('watermark-msg', 'Enter watermark text.', 'err'); return; }
  const size    = parseFloat(document.getElementById('wm-size').value)    || 48;
  const opacity = parseFloat(document.getElementById('wm-opacity').value) || 0.25;
  const angleDeg = parseFloat(document.getElementById('wm-angle').value)  || 45;
  const hex     = document.getElementById('wm-color').value;
  const { r, g, b } = hexToRgb(hex);

  try {
    const { PDFDocument, rgb, degrees, StandardFonts } = PDFLib;
    const buf   = await readFileAsArrayBuffer(watermarkFile);
    const doc   = await PDFDocument.load(buf);
    const font  = await doc.embedFont(StandardFonts.HelveticaBold);
    const pages = doc.getPages();
    const position = (document.getElementById('wm-position') || {}).value || 'center';
    const margin = 24;

    pages.forEach(page => {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, size);
      let x, y;
      switch (position) {
        case 'top-left':     x = margin;                     y = height - size - margin; break;
        case 'top-right':    x = width - textWidth - margin; y = height - size - margin; break;
        case 'bottom-left':  x = margin;                     y = margin;                 break;
        case 'bottom-right': x = width - textWidth - margin; y = margin;                 break;
        default:             x = (width - textWidth) / 2;    y = (height - size) / 2;   break;
      }
      page.drawText(text, {
        x, y,
        size,
        font,
        color: rgb(r, g, b),
        opacity,
        rotate: degrees(angleDeg),
        blendMode: 'Normal',
      });
    });

    const bytes = await doc.save();
    downloadBytes(bytes, stemName(watermarkFile) + '_watermarked.pdf');
    setMsg('watermark-msg', 'Watermark applied to ' + pages.length + ' page(s). ' + fmtBytes(bytes.length) + ' saved.', 'ok');
  } catch (err) {
    setMsg('watermark-msg', 'Error: ' + err.message, 'err');
  }
}

function watermarkClear() {
  watermarkFile = null;
  document.getElementById('watermark-file-info').innerHTML = '';
  document.getElementById('watermark-input').value = '';
  setMsg('watermark-msg', '', '');
}

/* ====================================================================
   8. ADD PAGE NUMBERS
==================================================================== */
let pnFile = null;

function pnDrop(files) { pnLoad(files[0]); }

async function pnLoad(file) {
  if (!file) return;
  pnFile = file;
  try {
    const buf = await readFileAsArrayBuffer(file);
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(buf);
    const info = document.getElementById('pn-file-info');
    info.innerHTML = '';
    info.appendChild(makeFileItem(file.name, file.size, pnClear));
    setMsg('pn-msg', doc.getPageCount() + ' page(s) loaded.', '');
    document.getElementById('pn-input').value = '';
  } catch (err) {
    setMsg('pn-msg', 'Error loading PDF: ' + err.message, 'err');
    pnFile = null;
  }
}

async function addPageNumbers() {
  if (!pnFile) { setMsg('pn-msg', 'Please upload a PDF first.', 'err'); return; }
  const position = document.getElementById('pn-position').value;
  const startNum = parseInt(document.getElementById('pn-start').value, 10) || 1;
  const fontSize = parseInt(document.getElementById('pn-size').value, 10)  || 12;
  const format   = document.getElementById('pn-format').value;
  const hex      = document.getElementById('pn-color').value;
  const { r, g, b } = hexToRgb(hex);

  try {
    const { PDFDocument, rgb, StandardFonts } = PDFLib;
    const buf   = await readFileAsArrayBuffer(pnFile);
    const doc   = await PDFDocument.load(buf);
    const font  = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();
    const total = pages.length;
    const margin = 24;

    pages.forEach((page, i) => {
      const { width, height } = page.getSize();
      const pageNum = i + startNum;
      let label = '';
      if      (format === 'n')      label = String(pageNum);
      else if (format === 'page-n') label = 'Page ' + pageNum;
      else                          label = pageNum + ' of ' + (total + startNum - 1);

      const textWidth = font.widthOfTextAtSize(label, fontSize);
      let x, y;
      const [vPos, hPos] = position.split('-');

      if      (hPos === 'center') x = (width - textWidth) / 2;
      else if (hPos === 'right')  x = width - textWidth - margin;
      else                        x = margin; // left

      if (vPos === 'bottom') y = margin;
      else                   y = height - fontSize - margin;

      page.drawText(label, { x, y, size: fontSize, font, color: rgb(r, g, b) });
    });

    const bytes = await doc.save();
    downloadBytes(bytes, stemName(pnFile) + '_numbered.pdf');
    setMsg('pn-msg', 'Page numbers added to ' + total + ' page(s). ' + fmtBytes(bytes.length) + '.', 'ok');
  } catch (err) {
    setMsg('pn-msg', 'Error: ' + err.message, 'err');
  }
}

function pnClear() {
  pnFile = null;
  document.getElementById('pn-file-info').innerHTML = '';
  document.getElementById('pn-input').value = '';
  setMsg('pn-msg', '', '');
}

/* ====================================================================
   9. CONVERT IMAGES TO PDF
==================================================================== */
const img2pdfFiles = [];

function img2pdfDrop(files) { img2pdfAdd(files); }

function img2pdfAdd(files) {
  const allowed = ['image/jpeg','image/png','image/gif','image/bmp','image/webp'];
  for (const f of files) {
    if (!allowed.includes(f.type) && !f.name.match(/\.(jpe?g|png|gif|bmp|webp)$/i)) continue;
    img2pdfFiles.push(f);
  }
  document.getElementById('img2pdf-input').value = '';
  img2pdfRenderList();
}

function img2pdfRenderList() {
  const list = document.getElementById('img2pdf-file-list');
  list.innerHTML = '';
  img2pdfFiles.forEach((f, i) => {
    const item = makeFileItem(f.name, f.size, () => { img2pdfFiles.splice(i, 1); img2pdfRenderList(); }, true);
    item.setAttribute('draggable', 'true');
    item.dataset.index = i;
    item.addEventListener('dragstart', img2pdfDragStart);
    item.addEventListener('dragover',  img2pdfDragOver);
    item.addEventListener('dragleave', img2pdfDragLeave);
    item.addEventListener('drop',      img2pdfDragDrop);
    item.addEventListener('dragend',   img2pdfDragEnd);
    list.appendChild(item);
  });
  setMsg('img2pdf-msg', img2pdfFiles.length ? img2pdfFiles.length + ' image(s) loaded.' : '', '');
}

let img2pdfDragSrcIdx = null;
function img2pdfDragStart(e) { img2pdfDragSrcIdx = parseInt(this.dataset.index, 10); this.classList.add('drag-source'); e.dataTransfer.effectAllowed = 'move'; }
function img2pdfDragOver(e)  { e.preventDefault(); this.classList.add('drag-over-item'); }
function img2pdfDragLeave()  { this.classList.remove('drag-over-item'); }
function img2pdfDragDrop(e)  {
  e.stopPropagation();
  const t = parseInt(this.dataset.index, 10);
  if (img2pdfDragSrcIdx !== null && img2pdfDragSrcIdx !== t) {
    const m = img2pdfFiles.splice(img2pdfDragSrcIdx, 1)[0];
    img2pdfFiles.splice(t, 0, m);
    img2pdfRenderList();
  }
}
function img2pdfDragEnd() {
  document.querySelectorAll('#img2pdf-file-list .file-item').forEach(el => el.classList.remove('drag-source','drag-over-item'));
  img2pdfDragSrcIdx = null;
}

const PAGE_SIZES = {
  a4:     [595, 842],
  letter: [612, 792],
  a3:     [842, 1191],
  a5:     [420, 595],
};

function loadImageToBitmap(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = ()  => { URL.revokeObjectURL(url); reject(new Error('Failed to load image: ' + file.name)); };
    img.src = url;
  });
}

async function convertImg2PDF() {
  if (img2pdfFiles.length === 0) { setMsg('img2pdf-msg', 'Please add at least one image.', 'err'); return; }
  const preset  = document.getElementById('img2pdf-size').value;
  const orient  = document.getElementById('img2pdf-orient').value;
  setProgress('img2pdf-prog', 'img2pdf-prog-wrap', 5);
  try {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.create();

    for (let i = 0; i < img2pdfFiles.length; i++) {
      const file = img2pdfFiles[i];
      const buf  = await readFileAsArrayBuffer(file);
      let   pdfImg;

      if (file.type === 'image/jpeg' || file.name.match(/\.jpe?g$/i)) {
        pdfImg = await doc.embedJpg(buf);
      } else {
        // Use canvas to convert non-JPEG to PNG data URL, then embed
        const imgEl   = await loadImageToBitmap(file);
        const canvas  = document.createElement('canvas');
        canvas.width  = imgEl.naturalWidth;
        canvas.height = imgEl.naturalHeight;
        canvas.getContext('2d').drawImage(imgEl, 0, 0);
        const pngDataUrl = canvas.toDataURL('image/png');
        const base64     = pngDataUrl.split(',')[1];
        const pngBuf     = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        pdfImg = await doc.embedPng(pngBuf);
      }

      let pageW, pageH;
      if (preset === 'fit') {
        pageW = pdfImg.width;
        pageH = pdfImg.height;
      } else {
        [pageW, pageH] = PAGE_SIZES[preset];
      }

      // Handle orientation
      if (orient === 'landscape' && pageH > pageW) [pageW, pageH] = [pageH, pageW];
      else if (orient === 'portrait' && pageW > pageH) [pageW, pageH] = [pageH, pageW];
      else if (orient === 'auto' && preset !== 'fit') {
        if (pdfImg.width > pdfImg.height && pageH > pageW) [pageW, pageH] = [pageH, pageW];
      }

      const page = doc.addPage([pageW, pageH]);
      // Scale image to fit page while preserving aspect ratio
      const scale = Math.min(pageW / pdfImg.width, pageH / pdfImg.height);
      const drawnW = pdfImg.width  * scale;
      const drawnH = pdfImg.height * scale;
      page.drawImage(pdfImg, {
        x: (pageW - drawnW) / 2,
        y: (pageH - drawnH) / 2,
        width:  drawnW,
        height: drawnH,
      });

      setProgress('img2pdf-prog', 'img2pdf-prog-wrap', 5 + Math.round(90 * (i + 1) / img2pdfFiles.length));
    }

    const bytes = await doc.save();
    downloadBytes(bytes, 'images.pdf');
    setProgress('img2pdf-prog', 'img2pdf-prog-wrap', 100);
    setMsg('img2pdf-msg', img2pdfFiles.length + ' image(s) → PDF (' + fmtBytes(bytes.length) + ').', 'ok');
    setTimeout(() => setProgress('img2pdf-prog', 'img2pdf-prog-wrap', null), 1500);
  } catch (err) {
    setProgress('img2pdf-prog', 'img2pdf-prog-wrap', null);
    setMsg('img2pdf-msg', 'Error: ' + err.message, 'err');
  }
}

function img2pdfClear() {
  img2pdfFiles.length = 0;
  img2pdfRenderList();
  setMsg('img2pdf-msg', '', '');
  setProgress('img2pdf-prog', 'img2pdf-prog-wrap', null);
}

/* ====================================================================
   10. PDF VIEWER
==================================================================== */
let viewerDoc  = null;
let viewerPage = 1;
let viewerTotal = 0;

async function viewerLoad(file) {
  if (!file) return;
  document.getElementById('viewer-placeholder') && (document.getElementById('viewer-placeholder').style.display = 'none');
  try {
    const buf       = await readFileAsArrayBuffer(file);
    const pdfData   = new Uint8Array(buf);
    viewerDoc       = await pdfjsLib.getDocument({ data: pdfData }).promise;
    viewerTotal     = viewerDoc.numPages;
    viewerPage      = 1;
    document.getElementById('viewer-filename').textContent = file.name;
    document.getElementById('viewer-input').value = '';
    viewerUpdateInfo();
    viewerRender();
  } catch (err) {
    alert('Could not open PDF: ' + err.message);
  }
}

function viewerUpdateInfo() {
  document.getElementById('viewer-page-info').textContent = viewerPage + ' / ' + viewerTotal;
}

async function viewerRender() {
  if (!viewerDoc) return;
  const zoom     = parseFloat(document.getElementById('viewer-zoom').value);
  document.getElementById('viewer-zoom-label').textContent = Math.round(zoom * 100) + '%';
  const wrap     = document.getElementById('viewer-canvas-wrap');
  // Remove old canvases
  [...wrap.querySelectorAll('canvas')].forEach(c => c.remove());
  const page     = await viewerDoc.getPage(viewerPage);
  const viewport = page.getViewport({ scale: zoom });
  const canvas   = document.createElement('canvas');
  canvas.width   = viewport.width;
  canvas.height  = viewport.height;
  wrap.appendChild(canvas);
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
}

function viewerPrev() {
  if (!viewerDoc || viewerPage <= 1) return;
  viewerPage--;
  viewerUpdateInfo();
  viewerRender();
}

function viewerNext() {
  if (!viewerDoc || viewerPage >= viewerTotal) return;
  viewerPage++;
  viewerUpdateInfo();
  viewerRender();
}

/* ====================================================================
   11. COMPRESS PDF
==================================================================== */
let compressFile = null;

function compressDrop(files) { compressLoad(files[0]); }

async function compressLoad(file) {
  if (!file) return;
  compressFile = file;
  const info = document.getElementById('compress-file-info');
  info.innerHTML = '';
  info.appendChild(makeFileItem(file.name, file.size, compressClear));
  setMsg('compress-msg', 'Original size: ' + fmtBytes(file.size), '');
  document.getElementById('compress-input').value = '';
}

async function compressPDF() {
  if (!compressFile) { setMsg('compress-msg', 'Please upload a PDF first.', 'err'); return; }
  try {
    const { PDFDocument } = PDFLib;
    const buf = await readFileAsArrayBuffer(compressFile);
    const doc = await PDFDocument.load(buf, { ignoreEncryption: false });

    if (document.getElementById('compress-meta').checked) {
      doc.setTitle('');
      doc.setAuthor('');
      doc.setSubject('');
      doc.setKeywords([]);
      doc.setCreator('');
      doc.setProducer('');
    }

    // Use objectsPerTick and useObjectStreams options to optimize output
    const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
    const saved = compressFile.size - bytes.length;
    downloadBytes(bytes, stemName(compressFile) + '_compressed.pdf');
    const pctStr = compressFile.size > 0 ? ' (' + Math.round(saved / compressFile.size * 100) + '% reduction)' : '';
    setMsg('compress-msg',
      'Done! Original: ' + fmtBytes(compressFile.size) + ' → Compressed: ' + fmtBytes(bytes.length) + pctStr, 'ok');
  } catch (err) {
    setMsg('compress-msg', 'Error: ' + err.message, 'err');
  }
}

function compressClear() {
  compressFile = null;
  document.getElementById('compress-file-info').innerHTML = '';
  document.getElementById('compress-input').value = '';
  setMsg('compress-msg', '', '');
}

/* ====================================================================
   12. CROP PDF PAGES
==================================================================== */
let cropFile = null;

function cropDrop(files) { cropLoad(files[0]); }

async function cropLoad(file) {
  if (!file) return;
  cropFile = file;
  try {
    const buf = await readFileAsArrayBuffer(file);
    const { PDFDocument } = PDFLib;
    const doc  = await PDFDocument.load(buf);
    const info = document.getElementById('crop-file-info');
    info.innerHTML = '';
    info.appendChild(makeFileItem(file.name, file.size, cropClear));
    const firstPage     = doc.getPage(0);
    const { width, height } = firstPage.getSize();
    setMsg('crop-dims', 'First page size: ' + Math.round(width) + ' × ' + Math.round(height) + ' pt (' + doc.getPageCount() + ' pages)', '');
    setMsg('crop-msg', '', '');
    document.getElementById('crop-input').value = '';
  } catch (err) {
    setMsg('crop-msg', 'Error loading PDF: ' + err.message, 'err');
    cropFile = null;
  }
}

document.getElementById('crop-target').addEventListener('change', function() {
  document.getElementById('crop-custom-group').style.display = this.value === 'custom' ? '' : 'none';
});

async function cropPDF() {
  if (!cropFile) { setMsg('crop-msg', 'Please upload a PDF first.', 'err'); return; }
  const left   = parseFloat(document.getElementById('crop-left').value)   || 0;
  const right  = parseFloat(document.getElementById('crop-right').value)  || 0;
  const top    = parseFloat(document.getElementById('crop-top').value)    || 0;
  const bottom = parseFloat(document.getElementById('crop-bottom').value) || 0;
  try {
    const { PDFDocument } = PDFLib;
    const buf    = await readFileAsArrayBuffer(cropFile);
    const doc    = await PDFDocument.load(buf);
    const total  = doc.getPageCount();
    const target = document.getElementById('crop-target').value;
    let idxs = [];
    if (target === 'all') {
      for (let i = 0; i < total; i++) idxs.push(i);
    } else {
      const str = document.getElementById('crop-custom').value.trim();
      idxs = parsePageRanges(str, total) || [];
      if (idxs.length === 0) { setMsg('crop-msg', 'No valid pages in custom range.', 'err'); return; }
    }

    idxs.forEach(i => {
      const page          = doc.getPage(i);
      const { width, height } = page.getSize();
      page.setCropBox(left, bottom, width - left - right, height - top - bottom);
    });

    const bytes = await doc.save();
    downloadBytes(bytes, stemName(cropFile) + '_cropped.pdf');
    setMsg('crop-msg', 'Cropped ' + idxs.length + ' page(s). ' + fmtBytes(bytes.length) + ' saved.', 'ok');
  } catch (err) {
    setMsg('crop-msg', 'Error: ' + err.message, 'err');
  }
}

function cropClear() {
  cropFile = null;
  document.getElementById('crop-file-info').innerHTML = '';
  document.getElementById('crop-input').value = '';
  setMsg('crop-dims', '', '');
  setMsg('crop-msg', '', '');
}

/* ====================================================================
   13. RESIZE PDF PAGES
==================================================================== */
let resizeFile = null;

function resizeDrop(files) { resizeLoad(files[0]); }

async function resizeLoad(file) {
  if (!file) return;
  resizeFile = file;
  const info = document.getElementById('resize-file-info');
  info.innerHTML = '';
  info.appendChild(makeFileItem(file.name, file.size, resizeClear));
  setMsg('resize-msg', '', '');
  document.getElementById('resize-input').value = '';
}

function resizePresetChange() {
  const preset = document.getElementById('resize-preset').value;
  document.getElementById('resize-custom-group').style.display = preset === 'custom' ? '' : 'none';
}

async function resizePDF() {
  if (!resizeFile) { setMsg('resize-msg', 'Please upload a PDF first.', 'err'); return; }
  const { PDFDocument } = PDFLib;
  const preset = document.getElementById('resize-preset').value;
  const orient = document.getElementById('resize-orient').value;

  let targetW, targetH;
  if (preset === 'custom') {
    targetW = parseFloat(document.getElementById('resize-w').value) || 595;
    targetH = parseFloat(document.getElementById('resize-h').value) || 842;
  } else {
    [targetW, targetH] = PAGE_SIZES[preset] || [595, 842];
  }
  if (orient === 'landscape' && targetH > targetW) [targetW, targetH] = [targetH, targetW];
  if (orient === 'portrait'  && targetW > targetH) [targetW, targetH] = [targetH, targetW];

  try {
    const buf  = await readFileAsArrayBuffer(resizeFile);
    const src  = await PDFDocument.load(buf);
    const dest = await PDFDocument.create();
    const pages = src.getPages();

    for (let i = 0; i < pages.length; i++) {
      const copied = (await dest.copyPages(src, [i]))[0];
      dest.addPage(copied);
      const newPage     = dest.getPages()[i];
      const { width: origW, height: origH } = newPage.getSize();
      const scale = Math.min(targetW / origW, targetH / origH);
      const offsetX = (targetW - origW * scale) / 2;
      const offsetY = (targetH - origH * scale) / 2;
      newPage.setSize(targetW, targetH);
      newPage.scaleContent(scale, scale);
      newPage.translateContent(offsetX, offsetY);
    }

    const bytes = await dest.save();
    downloadBytes(bytes, stemName(resizeFile) + '_resized.pdf');
    setMsg('resize-msg', pages.length + ' page(s) resized to ' + Math.round(targetW) + '×' + Math.round(targetH) + ' pt. ' + fmtBytes(bytes.length) + '.', 'ok');
  } catch (err) {
    setMsg('resize-msg', 'Error: ' + err.message, 'err');
  }
}

function resizeClear() {
  resizeFile = null;
  document.getElementById('resize-file-info').innerHTML = '';
  document.getElementById('resize-input').value = '';
  setMsg('resize-msg', '', '');
}

/* ====================================================================
   14. FLATTEN PDF
==================================================================== */
let flattenFile = null;

function flattenDrop(files) { flattenLoad(files[0]); }

async function flattenLoad(file) {
  if (!file) return;
  flattenFile = file;
  const info = document.getElementById('flatten-file-info');
  info.innerHTML = '';
  info.appendChild(makeFileItem(file.name, file.size, flattenClear));
  setMsg('flatten-msg', 'Ready to flatten.', '');
  document.getElementById('flatten-input').value = '';
}

async function flattenPDF() {
  if (!flattenFile) { setMsg('flatten-msg', 'Please upload a PDF first.', 'err'); return; }
  try {
    const { PDFDocument } = PDFLib;
    const buf = await readFileAsArrayBuffer(flattenFile);
    const doc = await PDFDocument.load(buf);

    // Flatten: remove all AcroForm fields by setting their appearances and
    // removing the interactive form object so fields become static content.
    const form = doc.getForm();
    form.flatten();

    const bytes = await doc.save();
    downloadBytes(bytes, stemName(flattenFile) + '_flattened.pdf');
    setMsg('flatten-msg', 'Flattened successfully. ' + fmtBytes(bytes.length) + ' saved.', 'ok');
  } catch (err) {
    setMsg('flatten-msg', 'Error: ' + err.message, 'err');
  }
}

function flattenClear() {
  flattenFile = null;
  document.getElementById('flatten-file-info').innerHTML = '';
  document.getElementById('flatten-input').value = '';
  setMsg('flatten-msg', '', '');
}

/* ====================================================================
   15. REMOVE PDF METADATA → merged into tool 20 (Sanitize PDF)
   See section 20 below.
====================================================================
(removed — functionality consolidated into Sanitize PDF)
*/ /* placeholder kept to preserve section numbering */

/* ====================================================================
   16. ADD PASSWORD (+ Lock Permissions)
==================================================================== */
let addpwFile = null;

document.getElementById('addpw-user').addEventListener('input', function() {
  const strength = passwordStrength(this.value);
  const fill  = document.getElementById('addpw-strength-fill');
  const label = document.getElementById('addpw-strength-label');
  const colors = ['var(--danger)', '#f97316', 'var(--warn)', 'var(--success)'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const pct    = [25, 50, 75, 100];
  fill.style.width      = pct[strength] + '%';
  fill.style.background = colors[strength];
  label.textContent     = this.value.length ? 'Password strength: ' + labels[strength] : '';
});

function passwordStrength(pw) {
  if (pw.length === 0) return 0;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(3, Math.floor(score * 3 / 5));
}

function addpwDrop(files) { addpwLoad(files[0]); }

async function addpwLoad(file) {
  if (!file) return;
  addpwFile = file;
  const info = document.getElementById('addpw-file-info');
  info.innerHTML = '';
  info.appendChild(makeFileItem(file.name, file.size, addpwClear));
  setMsg('addpw-msg', '', '');
  document.getElementById('addpw-input').value = '';
}

async function addPassword() {
  if (!addpwFile) { setMsg('addpw-msg', 'Please upload a PDF first.', 'err'); return; }
  const userPw  = document.getElementById('addpw-user').value;
  const ownerPw = document.getElementById('addpw-owner').value || userPw;
  if (!userPw && !ownerPw) { setMsg('addpw-msg', 'Enter at least a user password or an owner password.', 'err'); return; }
  const noPrint = document.getElementById('addpw-no-print').checked;
  const noCopy  = document.getElementById('addpw-no-copy').checked;
  const noEdit  = document.getElementById('addpw-no-edit').checked;
  const noAnnot = document.getElementById('addpw-no-annot').checked;
  try {
    const { PDFDocument } = PDFLib;
    const buf = await readFileAsArrayBuffer(addpwFile);
    const doc = await PDFDocument.load(buf);
    const saveOpts = {
      permissions: {
        printing:             noPrint ? 'none' : 'highResolution',
        modifying:            !noEdit,
        copying:              !noCopy,
        annotating:           !noAnnot,
        fillingForms:         !noEdit,
        contentAccessibility: true,
        documentAssembly:     !noEdit,
        encryptionType:       'aes256',
      },
    };
    if (userPw)  saveOpts.userPassword  = userPw;
    if (ownerPw) saveOpts.ownerPassword = ownerPw;
    const bytes = await doc.save(saveOpts);
    downloadBytes(bytes, stemName(addpwFile) + '_protected.pdf');
    setMsg('addpw-msg', 'PDF encrypted and downloaded. ' + fmtBytes(bytes.length), 'ok');
  } catch (err) {
    setMsg('addpw-msg', 'Error: ' + err.message, 'err');
  }
}

function addpwClear() {
  addpwFile = null;
  document.getElementById('addpw-file-info').innerHTML = '';
  document.getElementById('addpw-input').value = '';
  document.getElementById('addpw-user').value  = '';
  document.getElementById('addpw-owner').value = '';
  document.getElementById('addpw-strength-fill').style.width = '0%';
  document.getElementById('addpw-strength-label').textContent = '';
  document.getElementById('addpw-no-print').checked = false;
  document.getElementById('addpw-no-copy').checked  = false;
  document.getElementById('addpw-no-edit').checked  = false;
  document.getElementById('addpw-no-annot').checked = false;
  setMsg('addpw-msg', '', '');
}

/* ====================================================================
   17. REMOVE PASSWORD
==================================================================== */
let rmpwFile = null;

function rmpwDrop(files) { rmpwLoad(files[0]); }

async function rmpwLoad(file) {
  if (!file) return;
  rmpwFile = file;
  const info = document.getElementById('rmpw-file-info');
  info.innerHTML = '';
  info.appendChild(makeFileItem(file.name, file.size, rmpwClear));
  setMsg('rmpw-msg', '', '');
  document.getElementById('rmpw-input').value = '';
}

async function removePassword() {
  if (!rmpwFile) { setMsg('rmpw-msg', 'Please upload a PDF first.', 'err'); return; }
  const pw = document.getElementById('rmpw-pw').value;
  if (!pw) { setMsg('rmpw-msg', 'Enter the PDF password.', 'err'); return; }
  setMsg('rmpw-msg', 'Decrypting\u2026', '');
  try {
    const { PDFDocument } = PDFLib;
    const buf = await readFileAsArrayBuffer(rmpwFile);
    // @cantoo/pdf-lib supports loading encrypted PDFs with { password }
    const doc = await PDFDocument.load(buf, { password: pw, ignoreEncryption: false });
    // Save without any encryption options to produce an unencrypted PDF
    const bytes = await doc.save({ useObjectStreams: false });
    downloadBytes(bytes, stemName(rmpwFile) + '_unlocked.pdf');
    setMsg('rmpw-msg', 'Password removed. ' + fmtBytes(bytes.length) + ' saved.', 'ok');
  } catch (err) {
    const msg = (err.message || '').toLowerCase();
    if (msg.includes('password') || msg.includes('decrypt') || msg.includes('encrypt') || msg.includes('incorrect')) {
      setMsg('rmpw-msg', 'Incorrect password or unsupported encryption format.', 'err');
    } else {
      setMsg('rmpw-msg', 'Error: ' + err.message, 'err');
    }
  }
}

function rmpwClear() {
  rmpwFile = null;
  document.getElementById('rmpw-file-info').innerHTML = '';
  document.getElementById('rmpw-input').value  = '';
  document.getElementById('rmpw-pw').value     = '';
  setMsg('rmpw-msg', '', '');
}

/* ====================================================================
   18. LOCK PDF (READ-ONLY) → merged into tool 16 (Add Password)
   Permission checkboxes are now part of the Add Password tool.
====================================================================
(removed — functionality consolidated into Add Password)
*/

/* ====================================================================
   19. REDACT PDF
==================================================================== */
let redactFile     = null;
let redactPDFjs    = null;
let redactLibDoc   = null;
let redactPage     = 1;
let redactTotal    = 0;
// Redaction boxes per page: { [pageNum]: [{x,y,w,h,color},...] }
const redactBoxes  = {};
let redactDrawing  = false;
let redactStartX   = 0;
let redactStartY   = 0;
let redactScale    = 1.5;

function redactDrop(files) { redactLoad(files[0]); }

async function redactLoad(file) {
  if (!file) return;
  redactFile = file;
  try {
    const buf      = await readFileAsArrayBuffer(file);
    const pdfData  = new Uint8Array(buf);
    redactPDFjs    = await pdfjsLib.getDocument({ data: pdfData }).promise;
    redactTotal    = redactPDFjs.numPages;
    redactLibDoc   = buf;
    redactPage     = 1;

    document.getElementById('redact-drop').style.display    = 'none';
    document.getElementById('redact-controls').style.display = '';
    document.getElementById('redact-page-info').textContent = 'Page ' + redactPage + ' / ' + redactTotal;
    document.getElementById('redact-input').value = '';
    await redactRenderPage();
  } catch (err) {
    setMsg('redact-msg', 'Error loading PDF: ' + err.message, 'err');
    redactFile = null;
  }
}

async function redactRenderPage() {
  const bg       = document.getElementById('redact-canvas-bg');
  const overlay  = document.getElementById('redact-canvas-overlay');
  const page     = await redactPDFjs.getPage(redactPage);
  const viewport = page.getViewport({ scale: redactScale });
  bg.width = overlay.width = viewport.width;
  bg.height = overlay.height = viewport.height;
  await page.render({ canvasContext: bg.getContext('2d'), viewport }).promise;
  redactRedrawOverlay();
}

function redactRedrawOverlay() {
  const overlay = document.getElementById('redact-canvas-overlay');
  const ctx     = overlay.getContext('2d');
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  const boxes   = redactBoxes[redactPage] || [];
  boxes.forEach(b => {
    ctx.fillStyle = b.color || '#000000';
    ctx.fillRect(b.x, b.y, b.w, b.h);
  });
}

// Draw redaction boxes
(function setupRedactCanvas() {
  function getOverlay() { return document.getElementById('redact-canvas-overlay'); }

  document.addEventListener('mousedown', function(e) {
    const overlay = getOverlay();
    if (e.target !== overlay) return;
    const rect = overlay.getBoundingClientRect();
    redactDrawing = true;
    redactStartX  = e.clientX - rect.left;
    redactStartY  = e.clientY - rect.top;
  });

  document.addEventListener('mousemove', function(e) {
    if (!redactDrawing) return;
    const overlay = getOverlay();
    const rect    = overlay.getBoundingClientRect();
    const curX    = e.clientX - rect.left;
    const curY    = e.clientY - rect.top;
    redactRedrawOverlay();
    const ctx = overlay.getContext('2d');
    ctx.fillStyle = document.getElementById('redact-color').value;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(redactStartX, redactStartY, curX - redactStartX, curY - redactStartY);
    ctx.globalAlpha = 1;
  });

  document.addEventListener('mouseup', function(e) {
    if (!redactDrawing) return;
    redactDrawing = false;
    const overlay = getOverlay();
    const rect    = overlay.getBoundingClientRect();
    const endX    = e.clientX - rect.left;
    const endY    = e.clientY - rect.top;
    const x = Math.min(redactStartX, endX);
    const y = Math.min(redactStartY, endY);
    const w = Math.abs(endX - redactStartX);
    const h = Math.abs(endY - redactStartY);
    if (w > 2 && h > 2) {
      if (!redactBoxes[redactPage]) redactBoxes[redactPage] = [];
      redactBoxes[redactPage].push({ x, y, w, h, color: document.getElementById('redact-color').value });
    }
    redactRedrawOverlay();
  });
})();

function redactPrevPage() {
  if (!redactPDFjs || redactPage <= 1) return;
  redactPage--;
  document.getElementById('redact-page-info').textContent = 'Page ' + redactPage + ' / ' + redactTotal;
  redactRenderPage();
}
function redactNextPage() {
  if (!redactPDFjs || redactPage >= redactTotal) return;
  redactPage++;
  document.getElementById('redact-page-info').textContent = 'Page ' + redactPage + ' / ' + redactTotal;
  redactRenderPage();
}
function redactClearBoxes() {
  redactBoxes[redactPage] = [];
  redactRedrawOverlay();
}

async function applyRedactions() {
  if (!redactFile) return;
  const hasRedactions = Object.values(redactBoxes).some(arr => arr.length > 0);
  if (!hasRedactions) { setMsg('redact-msg', 'No redaction boxes drawn.', 'err'); return; }
  try {
    const { PDFDocument, rgb } = PDFLib;
    const buf   = await readFileAsArrayBuffer(redactFile);
    const doc   = await PDFDocument.load(buf);
    const pages = doc.getPages();

    for (const [pageNumStr, boxes] of Object.entries(redactBoxes)) {
      const pageIdx = parseInt(pageNumStr, 10) - 1;
      if (pageIdx < 0 || pageIdx >= pages.length || !boxes.length) continue;
      const page          = pages[pageIdx];
      const { width: pw, height: ph } = page.getSize();
      const scaleX  = pw / document.getElementById('redact-canvas-bg').width;
      const scaleY  = ph / document.getElementById('redact-canvas-bg').height;

      boxes.forEach(b => {
        const { r, g, bv } = (() => {
          const c = hexToRgb(b.color);
          return { r: c.r, g: c.g, bv: c.b };
        })();
        // PDF coordinate origin is bottom-left; canvas is top-left
        const pdfX = b.x * scaleX;
        const pdfY = ph - (b.y + b.h) * scaleY;
        const pdfW = b.w * scaleX;
        const pdfH = b.h * scaleY;
        page.drawRectangle({
          x: pdfX, y: pdfY, width: pdfW, height: pdfH,
          color: rgb(r, g, bv),
          opacity: 1,
        });
      });
    }

    const bytes = await doc.save();
    downloadBytes(bytes, stemName(redactFile) + '_redacted.pdf');
    setMsg('redact-msg', 'Redactions applied and downloaded.', 'ok');
  } catch (err) {
    setMsg('redact-msg', 'Error: ' + err.message, 'err');
  }
}

function redactClear() {
  redactFile   = null;
  redactPDFjs  = null;
  redactLibDoc = null;
  redactPage   = 1;
  redactTotal  = 0;
  for (const k in redactBoxes) delete redactBoxes[k];
  document.getElementById('redact-drop').style.display     = '';
  document.getElementById('redact-controls').style.display = 'none';
  document.getElementById('redact-input').value = '';
  setMsg('redact-msg', '', '');
}

/* ====================================================================
   20. SANITIZE PDF (Remove Metadata + Remove Hidden Data combined)
==================================================================== */
let hiddenFile = null;

function hiddenDrop(files) { hiddenLoad(files[0]); }

async function hiddenLoad(file) {
  if (!file) return;
  hiddenFile = file;
  const info = document.getElementById('hidden-file-info');
  info.innerHTML = '';
  info.appendChild(makeFileItem(file.name, file.size, hiddenClear));
  document.getElementById('hidden-input').value = '';
  const review = document.getElementById('hidden-review');
  if (review) review.style.display = 'none';
  setMsg('hidden-msg', 'Scanning PDF…', '');

  try {
    const buf = await readFileAsArrayBuffer(file);
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(buf, { ignoreEncryption: false });

    // Show metadata preview
    const metaFields = {
      Title:    doc.getTitle()    || '',
      Author:   doc.getAuthor()   || '',
      Subject:  doc.getSubject()  || '',
      Keywords: doc.getKeywords() || '',
      Creator:  doc.getCreator()  || '',
      Producer: doc.getProducer() || '',
    };
    const metaPre = document.getElementById('hidden-meta-pre');
    if (metaPre) {
      metaPre.textContent = Object.entries(metaFields)
        .map(([k, v]) => k + ': ' + (v || '—')).join('\n');
    }

    // Detect other hidden items
    const detected = [];
    try {
      const catalog = doc.catalog;
      if (catalog.has(PDFLib.PDFName.of('Metadata'))) detected.push('XMP metadata stream');
      const namesKey = PDFLib.PDFName.of('Names');
      if (catalog.has(namesKey)) {
        const namesDict = catalog.lookup(namesKey);
        if (namesDict && namesDict.has) {
          if (namesDict.has(PDFLib.PDFName.of('JavaScript')))     detected.push('Embedded JavaScript');
          if (namesDict.has(PDFLib.PDFName.of('EmbeddedFiles'))) detected.push('Embedded files/attachments');
        }
      }
    } catch (_) { /* catalog access not always available */ }

    const detectedEl = document.getElementById('hidden-detected');
    if (detectedEl) {
      if (detected.length > 0) {
        detectedEl.textContent = '\u26a0 Detected: ' + detected.join(', ');
        detectedEl.className = 'tool-msg warn';
      } else {
        detectedEl.textContent = '\u2713 No embedded JavaScript or files detected.';
        detectedEl.className = 'tool-msg ok';
      }
    }

    if (review) review.style.display = '';
    setMsg('hidden-msg', 'PDF scanned. Select items to remove, then click Sanitize.', 'ok');
  } catch (err) {
    setMsg('hidden-msg', 'File loaded. Ready to sanitize.', '');
  }
}

async function removeHiddenData() {
  if (!hiddenFile) { setMsg('hidden-msg', 'Please upload a PDF first.', 'err'); return; }
  try {
    const { PDFDocument } = PDFLib;
    const buf = await readFileAsArrayBuffer(hiddenFile);
    const doc = await PDFDocument.load(buf, { ignoreEncryption: false });

    if (document.getElementById('hidden-meta').checked) {
      doc.setTitle('');
      doc.setAuthor('');
      doc.setSubject('');
      doc.setKeywords([]);
      doc.setCreator('');
      doc.setProducer('');
    }

    // Remove XMP stream via low-level catalog access
    if (document.getElementById('hidden-xmp').checked) {
      try {
        const catalog = doc.catalog;
        const metaKey = PDFLib.PDFName.of('Metadata');
        if (catalog.has(metaKey)) catalog.delete(metaKey);
      } catch (_) { /* not available in all versions */ }
    }

    // Remove embedded JavaScript (via Names tree)
    if (document.getElementById('hidden-js').checked) {
      try {
        const catalog  = doc.catalog;
        const namesKey = PDFLib.PDFName.of('Names');
        if (catalog.has(namesKey)) {
          const namesDict = catalog.lookup(namesKey);
          if (namesDict && namesDict.has) {
            const jsKey = PDFLib.PDFName.of('JavaScript');
            if (namesDict.has(jsKey)) namesDict.delete(jsKey);
          }
        }
      } catch (_) { /* no-op */ }
    }

    // Remove embedded files
    if (document.getElementById('hidden-embeds').checked) {
      try {
        const catalog  = doc.catalog;
        const namesKey = PDFLib.PDFName.of('Names');
        if (catalog.has(namesKey)) {
          const namesDict = catalog.lookup(namesKey);
          if (namesDict && namesDict.has) {
            const efKey = PDFLib.PDFName.of('EmbeddedFiles');
            if (namesDict.has(efKey)) namesDict.delete(efKey);
          }
        }
      } catch (_) { /* no-op */ }
    }

    const bytes = await doc.save({ useObjectStreams: true });
    downloadBytes(bytes, stemName(hiddenFile) + '_sanitized.pdf');
    setMsg('hidden-msg', 'Hidden data removed. ' + fmtBytes(bytes.length) + ' saved.', 'ok');
  } catch (err) {
    setMsg('hidden-msg', 'Error: ' + err.message, 'err');
  }
}

function hiddenClear() {
  hiddenFile = null;
  document.getElementById('hidden-file-info').innerHTML = '';
  document.getElementById('hidden-input').value = '';
  const review = document.getElementById('hidden-review');
  if (review) review.style.display = 'none';
  setMsg('hidden-msg', '', '');
}
