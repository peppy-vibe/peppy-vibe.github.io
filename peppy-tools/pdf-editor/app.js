/* ═══════════════════════════════════════════════════════════
   PEPPY PDF STUDIO — app.js
   Non-destructive visual PDF editor — 100% client-side.

   Architecture:
   • sources  — loaded PDF/image files (bytes are never mutated)
   • pages    — ordered lightweight page model {source, page, rotation}
                → reorder / rotate / delete / duplicate are instant
   • steps    — non-destructive edit pipeline (watermark, page numbers,
                text, crop, resize, redact). Each step can be toggled,
                edited or removed at any time; previews update live.
   • export   — the only place a real PDF is built (pdf-lib), applying
                the page model and every enabled step.
   Rendering: PDF.js draws base pages into a cache; steps are composited
   on canvas, so live preview never re-parses or re-saves the PDF.
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
const S = {
  sources: new Map(),   // srcId -> {name, bytes, pdfjs(Promise), lib(Promise|null), pageCount, isImage}
  pages: [],            // [{uid, srcId, srcPage, rot}] — rot is the user delta (0/90/180/270)
                        // blank page: {uid, srcId:null, w, h, rot}
  steps: [],            // [{id, type, enabled, params, target:{mode:'all'|'uids', uids:[]}}]
  meta: null,           // {title, author, subject, keywords, creator, strip} — applied at export
  sel: new Set(),       // selected page uids
  fileName: 'edited.pdf',
};

let _uidCounter = 1;
let _srcCounter = 1;
let _stepCounter = 1;
const newUid = () => _uidCounter++;

let currentView = 'grid';    // 'grid' | 'reader'
let readerUid = null;        // uid of page shown in reader
let readerScale = 1;
let thumbH = 200;            // thumbnail height in px
let redactMode = false;
let editingStepId = null;    // step being edited via a dialog (null = creating)

/* ────────────────────────────────────────────────────────────
   UNDO / REDO — snapshots of the lightweight model (cheap)
──────────────────────────────────────────────────────────── */
const undoStack = [];
const redoStack = [];
const MAX_UNDO = 100;

function snapshot() {
  return {
    pages: S.pages.map(p => ({ ...p })),
    steps: JSON.parse(JSON.stringify(S.steps)),
    meta:  S.meta ? { ...S.meta } : null,
    fileName: S.fileName,
  };
}
function restore(snap) {
  S.pages = snap.pages.map(p => ({ ...p }));
  S.steps = JSON.parse(JSON.stringify(snap.steps));
  S.meta  = snap.meta ? { ...snap.meta } : null;
  S.fileName = snap.fileName;
  S.sel.clear();
  refreshAll();
}
function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack.length = 0;
  updateUndoRedoUI();
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  updateUndoRedoUI();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  updateUndoRedoUI();
}
function updateUndoRedoUI() {
  const u = document.getElementById('btn-undo');
  const r = document.getElementById('btn-redo');
  if (u) u.disabled = !undoStack.length;
  if (r) r.disabled = !redoStack.length;
}

/* ────────────────────────────────────────────────────────────
   TOAST + DIALOG HELPERS
──────────────────────────────────────────────────────────── */
let toastTimer = null;
function toast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3000);
}
function openDialog(id)  { document.getElementById(id).style.display = ''; }
function closeDialog(id) { document.getElementById(id).style.display = 'none'; }
function closeAnyDialog() {
  let closed = false;
  document.querySelectorAll('.dialog-overlay').forEach(d => {
    if (d.style.display !== 'none') { d.style.display = 'none'; closed = true; }
  });
  return closed;
}

/* ────────────────────────────────────────────────────────────
   PASSWORD PROMPT (encrypted PDFs on open)
──────────────────────────────────────────────────────────── */
let _pwPromptResolve = null;
function promptForPDFPassword(filename) {
  return new Promise((resolve) => {
    _pwPromptResolve = resolve;
    const msg = document.getElementById('pw-prompt-msg');
    if (msg) msg.textContent = '“' + filename + '” is password protected. Enter the password to unlock it.';
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

async function loadPDFHandlingPassword(buf, filename) {
  const { PDFDocument } = PDFLib;
  try {
    return await PDFDocument.load(buf);
  } catch (e) {
    const m = (e.message || '').toLowerCase();
    if (m.includes('encrypt') || m.includes('password') || m.includes('decrypt')) {
      const pw = await promptForPDFPassword(filename);
      if (pw === null) throw new Error('cancelled');
      return await PDFDocument.load(buf, { password: pw, ignoreEncryption: false });
    }
    throw e;
  }
}

/* ────────────────────────────────────────────────────────────
   SOURCES — loading files
──────────────────────────────────────────────────────────── */
async function addSourceFromPDF(file) {
  const buf = await readFileAsArrayBuffer(file);
  // Load with pdf-lib (handles password), then re-save so stored bytes are
  // always unencrypted — PDF.js can then render them without a password.
  const lib = await loadPDFHandlingPassword(buf, file.name);
  const bytes = await lib.save({ useObjectStreams: false });
  const srcId = _srcCounter++;
  const src = {
    name: file.name,
    bytes,
    pageCount: lib.getPageCount(),
    pdfjs: null,   // lazy Promise
    lib: null,     // lazy Promise (fresh doc for export copying)
    isImage: false,
  };
  S.sources.set(srcId, src);
  return { srcId, pageCount: src.pageCount };
}

/* Wrap an image file into a single-page PDF source */
async function addSourceFromImage(file) {
  const buf = await readFileAsArrayBuffer(file);
  const { PDFDocument } = PDFLib;
  const doc = await PDFDocument.create();
  const bytes8 = new Uint8Array(buf);
  const img = /\.png$/i.test(file.name) || file.type === 'image/png'
    ? await doc.embedPng(bytes8)
    : await doc.embedJpg(bytes8);
  const page = doc.addPage([img.width, img.height]);
  page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  const bytes = await doc.save({ useObjectStreams: false });
  const srcId = _srcCounter++;
  S.sources.set(srcId, {
    name: file.name, bytes, pageCount: 1, pdfjs: null, lib: null, isImage: true,
  });
  return { srcId, pageCount: 1 };
}

function getPdfjsDoc(srcId) {
  const src = S.sources.get(srcId);
  if (!src.pdfjs) {
    src.pdfjs = pdfjsLib.getDocument({ data: src.bytes.slice() }).promise;
  }
  return src.pdfjs;
}

function getLibDoc(srcId) {
  const src = S.sources.get(srcId);
  if (!src.lib) {
    src.lib = PDFLib.PDFDocument.load(src.bytes);
  }
  return src.lib;
}

/* ────────────────────────────────────────────────────────────
   FILE INTAKE
──────────────────────────────────────────────────────────── */
function addFilesClick() { document.getElementById('file-input-add').click(); }

async function handleAddFiles(files, insertAt) {
  if (!files || !files.length) return;
  const list = [...files].filter(f => {
    const ok = /\.pdf$/i.test(f.name) || f.type === 'application/pdf' ||
               /\.(jpe?g|png)$/i.test(f.name) || /^image\/(jpeg|png)$/.test(f.type);
    if (!ok) toast('Skipped ' + f.name + ' (only PDF, JPEG, PNG supported)', 'error');
    return ok;
  });
  if (!list.length) return;

  const hadPages = S.pages.length > 0;
  if (hadPages) pushUndo();

  setBusy(true, 'Loading files…');
  let added = 0;
  try {
    const newPages = [];
    for (const f of list) {
      const isImage = !(/\.pdf$/i.test(f.name) || f.type === 'application/pdf');
      const { srcId, pageCount } = isImage
        ? await addSourceFromImage(f)
        : await addSourceFromPDF(f);
      for (let i = 0; i < pageCount; i++) {
        newPages.push({ uid: newUid(), srcId, srcPage: i, rot: 0 });
      }
      added++;
    }
    const at = (insertAt == null || insertAt > S.pages.length) ? S.pages.length : insertAt;
    S.pages.splice(at, 0, ...newPages);
    if (!hadPages) {
      S.fileName = list.length === 1 ? list[0].name.replace(/\.(jpe?g|png)$/i, '.pdf') : 'merged.pdf';
      const fn = document.getElementById('export-filename');
      if (fn) fn.value = S.fileName;
    }
    refreshAll();
    toast('Added ' + newPages.length + ' page(s) from ' + added + ' file(s)', 'success');
  } catch (err) {
    if (err.message !== 'cancelled') toast('Error: ' + err.message, 'error');
    else if (!hadPages) { /* user cancelled password on first open */ }
    if (hadPages && added === 0) { undoStack.pop(); updateUndoRedoUI(); }
    refreshAll();
  }
  setBusy(false);
  document.getElementById('file-input-add').value = '';
}

function addBlankPage() {
  if (!S.pages.length) { toast('Open a PDF first', 'error'); return; }
  pushUndo();
  // Match size of last selected page, else last page, else A4
  let w = 595.28, h = 841.89;
  const refUid = S.sel.size ? [...S.sel].pop() : (S.pages.length ? S.pages[S.pages.length - 1].uid : null);
  const refPg = S.pages.find(p => p.uid === refUid);
  const insert = () => {
    const idx = refPg ? S.pages.indexOf(refPg) + 1 : S.pages.length;
    S.pages.splice(idx, 0, { uid: newUid(), srcId: null, w, h, rot: 0 });
    refreshAll();
    toast('Blank page added', 'success');
  };
  if (refPg && refPg.srcId != null) {
    getPdfjsDoc(refPg.srcId).then(doc => doc.getPage(refPg.srcPage + 1)).then(p => {
      const vp = p.getViewport({ scale: 1 });
      w = vp.width; h = vp.height;
      insert();
    }).catch(insert);
  } else {
    insert();
  }
}

/* ────────────────────────────────────────────────────────────
   BUSY OVERLAY
──────────────────────────────────────────────────────────── */
function setBusy(on, msg) {
  const el = document.getElementById('busy-overlay');
  if (!el) return;
  el.style.display = on ? 'flex' : 'none';
  const t = document.getElementById('busy-msg');
  if (t && msg) t.textContent = msg;
}

/* ────────────────────────────────────────────────────────────
   GEOMETRY — the single source of truth for how a page looks
   after rotation + crop + resize. Used by preview AND export.
──────────────────────────────────────────────────────────── */

/** Enabled steps of the pipeline that target page uid, in order. */
function stepsForPage(uid) {
  return S.steps.filter(st => st.enabled &&
    (st.target.mode === 'all' || st.target.uids.includes(uid)));
}

/**
 * Compute geometry for a page.
 * @param pg          page model entry
 * @param baseW/baseH UNROTATED source page size in pt
 * @param srcRot      /Rotate of the source page (0/90/180/270)
 */
function computeGeometry(pg, baseW, baseH, srcRot) {
  const R  = ((srcRot + pg.rot) % 360 + 360) % 360;
  const vw = (R === 90 || R === 270) ? baseH : baseW;   // rotated (visual) size
  const vh = (R === 90 || R === 270) ? baseW : baseH;

  let cl = 0, cr = 0, ct = 0, cb = 0;   // accumulated visual crop margins
  let resize = null;

  for (const st of stepsForPage(pg.uid)) {
    if (st.type === 'crop') {
      cl += st.params.left; cr += st.params.right;
      ct += st.params.top;  cb += st.params.bottom;
    } else if (st.type === 'resize') {
      resize = { W: st.params.w, H: st.params.h };
    }
  }
  // Clamp crop so at least 24pt of page remains
  const cw = Math.max(24, vw - cl - cr);
  const ch = Math.max(24, vh - ct - cb);

  const hasCrop = (cl || cr || ct || cb) ? true : false;
  const W = resize ? resize.W : cw;
  const H = resize ? resize.H : ch;

  // Content placement when resizing: uniform scale to fit, centered
  let s = 1, ox = 0, oy = 0;
  if (resize) {
    s  = Math.min(W / cw, H / ch);
    ox = (W - cw * s) / 2;
    oy = (H - ch * s) / 2;
  }
  return { R, vw, vh, cl, cr, ct, cb, cw, ch, hasCrop, resize, W, H, s, ox, oy };
}

/* ────────────────────────────────────────────────────────────
   BASE RENDER CACHE — PDF.js page renders (rotated, uncropped)
──────────────────────────────────────────────────────────── */
const baseCache = new Map();   // key -> {canvas, pxW}
const BASE_CACHE_MAX = 80;

async function getBaseRender(pg, R, minPxW) {
  if (pg.srcId == null) return null;  // blank page
  const key = pg.srcId + ':' + pg.srcPage + ':' + R;
  const hit = baseCache.get(key);
  if (hit && hit.pxW >= minPxW) return hit.canvas;

  const doc = await getPdfjsDoc(pg.srcId);
  const page = await doc.getPage(pg.srcPage + 1);
  const rotAbs = ((page.rotate + pg.rot) % 360 + 360) % 360;
  const vp1 = page.getViewport({ scale: 1, rotation: rotAbs });
  const scale = Math.min(4, minPxW / vp1.width);
  const vp = page.getViewport({ scale, rotation: rotAbs });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(vp.width));
  canvas.height = Math.max(1, Math.round(vp.height));
  await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;

  baseCache.delete(key);
  baseCache.set(key, { canvas, pxW: canvas.width });
  while (baseCache.size > BASE_CACHE_MAX) {
    baseCache.delete(baseCache.keys().next().value);
  }
  return canvas;
}
function invalidateBaseCache() { baseCache.clear(); }

/** Unrotated source size + source rotation for a page (async). */
async function getPageBaseInfo(pg) {
  if (pg.srcId == null) return { baseW: pg.w, baseH: pg.h, srcRot: 0 };
  const doc = await getPdfjsDoc(pg.srcId);
  const page = await doc.getPage(pg.srcPage + 1);
  const vp0 = page.getViewport({ scale: 1, rotation: 0 });
  return { baseW: vp0.width, baseH: vp0.height, srcRot: page.rotate || 0 };
}

/* ────────────────────────────────────────────────────────────
   COMPOSITE — draw final page (geometry + overlay steps) onto
   a canvas at `pxPerPt` device pixels per PDF point.
──────────────────────────────────────────────────────────── */
async function compositePage(pg, canvas, pxPerPt) {
  const info = await getPageBaseInfo(pg);
  const g = computeGeometry(pg, info.baseW, info.baseH, info.srcRot);

  const px = (v) => v * pxPerPt;
  canvas.width  = Math.max(1, Math.round(px(g.W)));
  canvas.height = Math.max(1, Math.round(px(g.H)));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 1) base content (rotated render, cropped, placed)
  if (pg.srcId != null) {
    const base = await getBaseRender(pg, g.R, Math.max(64, Math.round(px(g.vw))));
    if (base) {
      const bs = base.width / g.vw;                  // base px per pt
      const sx = g.cl * bs;
      const sy = g.ct * bs;                          // canvas top-down: top margin
      const sw = g.cw * bs;
      const sh = g.ch * bs;
      if (g.resize) {
        ctx.drawImage(base, sx, sy, sw, sh,
          px(g.ox), px(g.H - g.oy - g.ch * g.s), px(g.cw * g.s), px(g.ch * g.s));
      } else {
        ctx.drawImage(base, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      }
    }
  }

  // 2) overlay steps in pipeline order
  const docIndex = S.pages.indexOf(pg);
  for (const st of stepsForPage(pg.uid)) {
    drawOverlayStep(ctx, st, g, pxPerPt, docIndex);
  }
  return g;
}

function setCtxFont(ctx, sizePx) {
  ctx.font = sizePx + 'px Helvetica, Arial, sans-serif';
}

function drawOverlayStep(ctx, st, g, k, docIndex) {
  const p = st.params;
  const W = g.W, H = g.H;
  const toX = (x) => x * k;
  const toY = (y) => (H - y) * k;   // PDF bottom-up → canvas top-down

  if (st.type === 'watermark') {
    setCtxFont(ctx, p.size * k);
    const tw = ctx.measureText(p.text).width / k;
    const { x, y } = anchorPos(p.position, W, H, p.size, tw, true);
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.translate(toX(x), toY(y));
    ctx.rotate(-p.angle * Math.PI / 180);
    ctx.fillText(p.text, 0, 0);
    ctx.restore();

  } else if (st.type === 'pagenum') {
    const label = pageNumLabel(p, docIndex);
    setCtxFont(ctx, p.size * k);
    const tw = ctx.measureText(label).width / k;
    const { x, y } = marginPos(p.position, W, H, p.size, tw, 36);
    ctx.fillStyle = p.color;
    ctx.fillText(label, toX(x), toY(y));

  } else if (st.type === 'text') {
    setCtxFont(ctx, p.size * k);
    const tw = ctx.measureText(p.text).width / k;
    const { x, y } = marginPos(p.position, W, H, p.size, tw, 20);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, toX(x), toY(y));

  } else if (st.type === 'redact') {
    ctx.fillStyle = '#000000';
    for (const r of p.rects) {
      if (r.uid !== undefined && r.uid !== null) {
        // rect belongs to a specific page — checked by caller via target uids,
        // but a shared step keeps per-rect page association:
        const pgUid = S.pages[docIndex] ? S.pages[docIndex].uid : null;
        if (r.uid !== pgUid) continue;
      }
      ctx.fillRect(r.x * k, r.y * k, r.w * k, r.h * k);   // r.y is top-down pt
    }
  }
}

/* Watermark anchor (center rotates about text center) */
function anchorPos(position, W, H, size, tw, centered) {
  switch (position) {
    case 'top-left':     return { x: size, y: H - size * 1.5 };
    case 'top-right':    return { x: Math.max(4, W - size - tw), y: H - size * 1.5 };
    case 'bottom-left':  return { x: size, y: size };
    case 'bottom-right': return { x: Math.max(4, W - size - tw), y: size };
    default:             return { x: W / 2 - tw / 2, y: H / 2 - size * 0.35 };
  }
}
/* Margin-based position for page numbers / text */
function marginPos(position, W, H, size, tw, margin) {
  switch (position) {
    case 'bottom-left':   return { x: margin, y: margin };
    case 'bottom-right':  return { x: W - margin - tw, y: margin };
    case 'bottom-center': return { x: (W - tw) / 2, y: margin };
    case 'top-left':      return { x: margin, y: H - margin - size };
    case 'top-center':    return { x: (W - tw) / 2, y: H - margin - size };
    case 'top-right':     return { x: W - margin - tw, y: H - margin - size };
    case 'center':        return { x: (W - tw) / 2, y: (H - size) / 2 };
    default:              return { x: (W - tw) / 2, y: margin };
  }
}
function pageNumLabel(p, docIndex) {
  const num = p.start + docIndex;
  const total = S.pages.length + p.start - 1;
  switch (p.format) {
    case 'pn':   return 'Page ' + num;
    case 'dash': return '- ' + num + ' -';
    case 'of':   return num + ' of ' + total;
    default:     return String(num);
  }
}

/* ────────────────────────────────────────────────────────────
   REFRESH ORCHESTRATION
──────────────────────────────────────────────────────────── */
let _renderSeq = 0;

function refreshAll() {
  renderStepsPanel();
  updateTopBar();
  updateEmptyState();
  if (currentView === 'grid') renderGrid();
  else renderReader();
}

/** Re-composite existing thumbnails without rebuilding the grid DOM.
    Used when only steps changed (geometry may change canvas size too). */
async function recompositeThumbs() {
  const seq = ++_renderSeq;
  const cards = document.querySelectorAll('#page-grid .page-card');
  for (const card of cards) {
    if (seq !== _renderSeq) return;
    const uid = parseInt(card.dataset.uid);
    const pg = S.pages.find(p => p.uid === uid);
    if (!pg) continue;
    const canvas = card.querySelector('canvas');
    try {
      await compositeThumb(pg, canvas);
    } catch (_) {}
  }
}

async function compositeThumb(pg, canvas) {
  const info = await getPageBaseInfo(pg);
  const g = computeGeometry(pg, info.baseW, info.baseH, info.srcRot);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const pxPerPt = (thumbH / g.H) * dpr;
  await compositePage(pg, canvas, pxPerPt);
  canvas.style.height = thumbH + 'px';
  canvas.style.width = Math.round(thumbH * g.W / g.H) + 'px';
  return g;
}

function updateTopBar() {
  const nameDisp = document.getElementById('file-name-display');
  if (!nameDisp) return;
  if (!S.pages.length) { nameDisp.textContent = ''; return; }
  const enabled = S.steps.filter(s => s.enabled).length;
  nameDisp.textContent = S.fileName + ' · ' + S.pages.length + ' page(s)' +
    (enabled ? ' · ' + enabled + ' step(s)' : '');
}

function updateEmptyState() {
  const has = S.pages.length > 0;
  document.getElementById('workspace-empty').style.display = has ? 'none' : '';
  document.getElementById('workspace-toolbar').style.display = has ? '' : 'none';
  document.getElementById('steps-panel').style.display = has ? '' : 'none';
  if (!has) {
    document.getElementById('page-grid').innerHTML = '';
    document.getElementById('reader-view').style.display = 'none';
    document.getElementById('page-grid').style.display = '';
    currentView = 'grid';
    setViewButtons();
  }
}

/* ────────────────────────────────────────────────────────────
   GRID VIEW
──────────────────────────────────────────────────────────── */
async function renderGrid() {
  const seq = ++_renderSeq;
  const grid = document.getElementById('page-grid');
  grid.innerHTML = '';
  if (!S.pages.length) { updateSelBar(); return; }

  // Build all cards with placeholders first (instant layout)
  const frag = document.createDocumentFragment();
  S.pages.forEach((pg, i) => frag.appendChild(buildPageCard(pg, i)));
  grid.appendChild(frag);
  updateSelBar();

  // Then composite thumbnails sequentially
  for (const pg of [...S.pages]) {
    if (seq !== _renderSeq) return;
    const card = grid.querySelector('.page-card[data-uid="' + pg.uid + '"]');
    if (!card) continue;
    const canvas = card.querySelector('canvas');
    try {
      await compositeThumb(pg, canvas);
      card.classList.remove('loading');
      const dims = card.querySelector('.page-dims');
      if (dims) {
        const info = await getPageBaseInfo(pg);
        const g = computeGeometry(pg, info.baseW, info.baseH, info.srcRot);
        dims.textContent = Math.round(g.W) + '×' + Math.round(g.H) + ' pt';
      }
    } catch (err) {
      card.classList.remove('loading');
      card.classList.add('error');
    }
  }
}

function buildPageCard(pg, index) {
  const card = document.createElement('div');
  card.className = 'page-card loading' + (S.sel.has(pg.uid) ? ' selected' : '');
  card.dataset.uid = pg.uid;
  card.setAttribute('draggable', 'true');

  const thumbWrap = document.createElement('div');
  thumbWrap.className = 'page-card-thumb';
  thumbWrap.style.height = thumbH + 'px';
  const canvas = document.createElement('canvas');
  canvas.style.height = thumbH + 'px';
  thumbWrap.appendChild(canvas);
  card.appendChild(thumbWrap);

  // selection check
  const check = document.createElement('div');
  check.className = 'page-card-check';
  check.innerHTML = '<i class="bi bi-check-lg"></i>';
  check.title = 'Select page';
  check.addEventListener('click', (e) => { e.stopPropagation(); toggleSelect(pg.uid); });
  card.appendChild(check);

  // hover actions
  const actions = document.createElement('div');
  actions.className = 'page-card-actions';
  const mkBtn = (icon, title, fn) => {
    const b = document.createElement('button');
    b.innerHTML = '<i class="bi bi-' + icon + '"></i>';
    b.title = title;
    b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
    return b;
  };
  actions.appendChild(mkBtn('arrow-counterclockwise', 'Rotate left', () => rotatePageUids([pg.uid], -90)));
  actions.appendChild(mkBtn('arrow-clockwise', 'Rotate right', () => rotatePageUids([pg.uid], 90)));
  actions.appendChild(mkBtn('copy', 'Duplicate page (double-click opens page view)', () => duplicatePageUid(pg.uid)));
  const del = mkBtn('trash', 'Delete page', () => deletePageUids([pg.uid]));
  del.className = 'danger';
  actions.appendChild(del);
  card.appendChild(actions);

  // label
  const label = document.createElement('div');
  label.className = 'page-card-label';
  const num = document.createElement('span');
  num.className = 'page-num';
  num.textContent = String(index + 1);
  const dims = document.createElement('span');
  dims.className = 'page-dims';
  dims.textContent = '…';
  label.appendChild(num);
  label.appendChild(dims);
  card.appendChild(label);

  // interactions
  card.addEventListener('click', (e) => {
    if (e.shiftKey && _lastClickedUid != null) {
      rangeSelect(_lastClickedUid, pg.uid);
    } else if (e.ctrlKey || e.metaKey) {
      toggleSelect(pg.uid);
      _lastClickedUid = pg.uid;
    } else {
      toggleSelect(pg.uid);
      _lastClickedUid = pg.uid;
    }
  });
  card.addEventListener('dblclick', () => { readerUid = pg.uid; switchView('reader'); });

  card.addEventListener('dragstart', cardDragStart);
  card.addEventListener('dragover', cardDragOver);
  card.addEventListener('dragleave', cardDragLeave);
  card.addEventListener('drop', cardDrop);
  card.addEventListener('dragend', cardDragEnd);

  return card;
}

/* ────────────────────────────────────────────────────────────
   SELECTION
──────────────────────────────────────────────────────────── */
let _lastClickedUid = null;

function toggleSelect(uid) {
  if (S.sel.has(uid)) S.sel.delete(uid);
  else S.sel.add(uid);
  updateSelectionUI();
}
function rangeSelect(fromUid, toUid) {
  const a = S.pages.findIndex(p => p.uid === fromUid);
  const b = S.pages.findIndex(p => p.uid === toUid);
  if (a === -1 || b === -1) return;
  for (let i = Math.min(a, b); i <= Math.max(a, b); i++) S.sel.add(S.pages[i].uid);
  updateSelectionUI();
}
function selectAllPages() {
  S.pages.forEach(p => S.sel.add(p.uid));
  updateSelectionUI();
}
function deselectAllPages() {
  S.sel.clear();
  updateSelectionUI();
}
function updateSelectionUI() {
  document.querySelectorAll('#page-grid .page-card').forEach(c => {
    c.classList.toggle('selected', S.sel.has(parseInt(c.dataset.uid)));
  });
  updateSelBar();
}
function updateSelBar() {
  const el = document.getElementById('sel-count');
  if (el) el.textContent = S.sel.size ? S.sel.size + ' selected' : '';
}

/* ────────────────────────────────────────────────────────────
   PAGE OPERATIONS — instant, model-level
──────────────────────────────────────────────────────────── */
function selUidsOrToast() {
  if (!S.pages.length) { toast('No PDF loaded', 'error'); return null; }
  if (currentView === 'reader' && readerUid != null && !S.sel.size) return [readerUid];
  const uids = [...S.sel];
  if (!uids.length) { toast('Select pages first (click thumbnails)', 'error'); return null; }
  return uids;
}

function rotateSelected(deg) {
  const uids = selUidsOrToast();
  if (uids) rotatePageUids(uids, deg);
}
function rotatePageUids(uids, deg) {
  pushUndo();
  uids.forEach(uid => {
    const pg = S.pages.find(p => p.uid === uid);
    if (pg) pg.rot = ((pg.rot + deg) % 360 + 360) % 360;
  });
  if (currentView === 'grid') renderGrid(); else renderReader();
  updateTopBar();
}

function deleteSelected() {
  const uids = selUidsOrToast();
  if (uids) deletePageUids(uids);
}
function deletePageUids(uids) {
  if (uids.length >= S.pages.length) { toast('Cannot delete all pages', 'error'); return; }
  pushUndo();
  const set = new Set(uids);
  S.pages = S.pages.filter(p => !set.has(p.uid));
  uids.forEach(u => S.sel.delete(u));
  if (set.has(readerUid)) readerUid = S.pages.length ? S.pages[0].uid : null;
  refreshAll();
  toast('Deleted ' + uids.length + ' page(s)', 'success');
}

function duplicateSelected() {
  const uids = selUidsOrToast();
  if (uids) {
    pushUndo();
    // insert each copy right after its original, preserving order
    const ordered = S.pages.filter(p => uids.includes(p.uid));
    ordered.reverse().forEach(pg => {
      const idx = S.pages.indexOf(pg);
      S.pages.splice(idx + 1, 0, { ...pg, uid: newUid() });
    });
    refreshAll();
    toast('Duplicated ' + uids.length + ' page(s)', 'success');
  }
}
function duplicatePageUid(uid) {
  const pg = S.pages.find(p => p.uid === uid);
  if (!pg) return;
  pushUndo();
  S.pages.splice(S.pages.indexOf(pg) + 1, 0, { ...pg, uid: newUid() });
  refreshAll();
}

/* ────────────────────────────────────────────────────────────
   DRAG & DROP — rearrange (multi-page aware, insertion marker)
──────────────────────────────────────────────────────────── */
let dragUids = null;

function cardDragStart(e) {
  const uid = parseInt(this.dataset.uid);
  dragUids = S.sel.has(uid) && S.sel.size > 1
    ? S.pages.filter(p => S.sel.has(p.uid)).map(p => p.uid)
    : [uid];
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  try { e.dataTransfer.setData('text/plain', 'pages'); } catch (_) {}
}
function cardDragOver(e) {
  if (!dragUids) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const rect = this.getBoundingClientRect();
  const before = (e.clientX - rect.left) < rect.width / 2;
  this.classList.toggle('drop-before', before);
  this.classList.toggle('drop-after', !before);
}
function cardDragLeave() {
  this.classList.remove('drop-before', 'drop-after');
}
function cardDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  const before = this.classList.contains('drop-before');
  this.classList.remove('drop-before', 'drop-after');
  if (!dragUids) return;
  const targetUid = parseInt(this.dataset.uid);
  if (dragUids.includes(targetUid)) return;

  pushUndo();
  const moving = S.pages.filter(p => dragUids.includes(p.uid));
  S.pages = S.pages.filter(p => !dragUids.includes(p.uid));
  let idx = S.pages.findIndex(p => p.uid === targetUid);
  if (!before) idx++;
  S.pages.splice(idx, 0, ...moving);
  refreshAll();
}
function cardDragEnd() {
  dragUids = null;
  document.querySelectorAll('.page-card').forEach(c =>
    c.classList.remove('dragging', 'drop-before', 'drop-after'));
}

/* ────────────────────────────────────────────────────────────
   VIEW SWITCHING + ZOOM
──────────────────────────────────────────────────────────── */
function setViewButtons() {
  document.getElementById('vt-grid').classList.toggle('active', currentView === 'grid');
  document.getElementById('vt-reader').classList.toggle('active', currentView === 'reader');
}
function switchView(view) {
  if (!S.pages.length && view === 'reader') { toast('Open a PDF first', 'error'); return; }
  currentView = view;
  setViewButtons();
  document.getElementById('page-grid').style.display = view === 'grid' ? '' : 'none';
  document.getElementById('reader-view').style.display = view === 'reader' ? '' : 'none';
  if (view === 'reader') {
    if (readerUid == null || !S.pages.find(p => p.uid === readerUid)) {
      readerUid = S.sel.size ? [...S.sel][0] : (S.pages[0] && S.pages[0].uid);
    }
    renderReader();
  } else {
    if (redactMode) toggleRedactMode();  // leaving reader exits redact mode
    renderGrid();
  }
  updateZoomLabel();
}

function zoom(dir) {
  if (currentView === 'reader') {
    readerScale = Math.max(0.25, Math.min(4, readerScale + dir * 0.25));
    renderReader();
  } else {
    thumbH = Math.max(110, Math.min(480, thumbH + dir * 40));
    renderGrid();
  }
  updateZoomLabel();
}
function updateZoomLabel() {
  const el = document.getElementById('zoom-label');
  if (el) {
    el.textContent = currentView === 'reader'
      ? Math.round(readerScale * 100) + '%'
      : Math.round(thumbH / 2) + 'px';
  }
}

/* ────────────────────────────────────────────────────────────
   READER VIEW
──────────────────────────────────────────────────────────── */
async function renderReader() {
  if (!S.pages.length) return;
  const seq = ++_renderSeq;
  let idx = S.pages.findIndex(p => p.uid === readerUid);
  if (idx === -1) { idx = 0; readerUid = S.pages[0].uid; }
  const pg = S.pages[idx];

  const input = document.getElementById('reader-page-input');
  if (input) { input.value = idx + 1; input.max = S.pages.length; }
  const totalEl = document.getElementById('reader-page-total');
  if (totalEl) totalEl.textContent = '/ ' + S.pages.length;
  updateZoomLabel();

  const canvas = document.getElementById('reader-canvas');
  try {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const g = await compositePage(pg, canvas, readerScale * dpr);
    if (seq !== _renderSeq) return;
    canvas.style.width = Math.round(g.W * readerScale) + 'px';
    canvas.style.height = Math.round(g.H * readerScale) + 'px';

    // redact overlay matches the canvas CSS size
    const overlay = document.getElementById('redact-overlay');
    overlay.setAttribute('width', Math.round(g.W * readerScale));
    overlay.setAttribute('height', Math.round(g.H * readerScale));
    overlay.style.width = Math.round(g.W * readerScale) + 'px';
    overlay.style.height = Math.round(g.H * readerScale) + 'px';
    overlay.innerHTML = '';
  } catch (err) {
    toast('Error rendering page: ' + err.message, 'error');
  }
}
function readerGoto(idx) {
  if (idx < 0) idx = 0;
  if (idx >= S.pages.length) idx = S.pages.length - 1;
  readerUid = S.pages[idx].uid;
  renderReader();
}
function readerPrev() { readerGoto(S.pages.findIndex(p => p.uid === readerUid) - 1); }
function readerNext() { readerGoto(S.pages.findIndex(p => p.uid === readerUid) + 1); }

/* ────────────────────────────────────────────────────────────
   STEPS — creation / editing via dialogs
──────────────────────────────────────────────────────────── */
const STEP_META = {
  watermark: { icon: 'droplet',        title: 'Watermark' },
  pagenum:   { icon: 'hash',           title: 'Page Numbers' },
  text:      { icon: 'fonts',          title: 'Text' },
  crop:      { icon: 'scissors',       title: 'Crop' },
  resize:    { icon: 'arrows-expand',  title: 'Resize' },
  redact:    { icon: 'square-fill',    title: 'Redact' },
};

function newStep(type, params, target) {
  return { id: _stepCounter++, type, enabled: true, params, target };
}

function readTarget(applySelId, rangesId) {
  const mode = document.getElementById(applySelId).value;
  if (mode === 'selected') {
    if (!S.sel.size) { toast('No pages selected', 'error'); return null; }
    return { mode: 'uids', uids: [...S.sel] };
  }
  if (mode === 'ranges') {
    const r = parsePageRanges(document.getElementById(rangesId).value.trim(), S.pages.length);
    if (!r || !r.length) { toast('Invalid or empty page ranges', 'error'); return null; }
    return { mode: 'uids', uids: r.map(i => S.pages[i].uid) };
  }
  return { mode: 'all', uids: [] };
}

function setTargetControls(applySelId, rangesWrapId, rangesId, target) {
  const sel = document.getElementById(applySelId);
  const wrap = document.getElementById(rangesWrapId);
  if (target && target.mode === 'uids') {
    sel.value = 'ranges';
    wrap.style.display = '';
    const idxs = target.uids.map(u => S.pages.findIndex(p => p.uid === u)).filter(i => i >= 0).sort((a, b) => a - b);
    document.getElementById(rangesId).value = idxsToRangeStr(idxs);
  } else {
    sel.value = 'all';
    wrap.style.display = 'none';
    document.getElementById(rangesId).value = '';
  }
}

function idxsToRangeStr(idxs) {
  if (!idxs.length) return '';
  const parts = [];
  let s = idxs[0], e = idxs[0];
  for (let i = 1; i <= idxs.length; i++) {
    if (i < idxs.length && idxs[i] === e + 1) { e = idxs[i]; continue; }
    parts.push(s === e ? String(s + 1) : (s + 1) + '-' + (e + 1));
    if (i < idxs.length) { s = e = idxs[i]; }
  }
  return parts.join(', ');
}

function targetSummary(target) {
  if (target.mode === 'all') return 'all pages';
  const idxs = target.uids.map(u => S.pages.findIndex(p => p.uid === u)).filter(i => i >= 0).sort((a, b) => a - b);
  if (!idxs.length) return 'no pages';
  return 'p. ' + idxsToRangeStr(idxs);
}

function requireDoc() {
  if (!S.pages.length) { toast('Open a PDF first', 'error'); return false; }
  return true;
}

/* — Watermark — */
function openWatermarkDialog(step) {
  if (!requireDoc()) return;
  editingStepId = step ? step.id : null;
  if (step) {
    const p = step.params;
    document.getElementById('wm-text').value = p.text;
    document.getElementById('wm-size').value = p.size;
    document.getElementById('wm-opacity').value = p.opacity;
    document.getElementById('wm-opacity-val').textContent = p.opacity;
    document.getElementById('wm-color').value = p.color;
    document.getElementById('wm-angle').value = p.angle;
    document.getElementById('wm-position').value = p.position;
    setTargetControls('wm-apply', 'wm-ranges-wrap', 'wm-ranges', step.target);
  } else {
    setTargetControls('wm-apply', 'wm-ranges-wrap', 'wm-ranges', null);
    if (S.sel.size) document.getElementById('wm-apply').value = 'selected';
  }
  document.getElementById('wm-dlg-apply').textContent = step ? 'Save Step' : 'Add Step';
  openDialog('dlg-watermark');
}

function applyWatermark() {
  const text = document.getElementById('wm-text').value.trim();
  if (!text) { toast('Enter watermark text', 'error'); return; }
  const target = readTarget('wm-apply', 'wm-ranges');
  if (!target) return;
  const params = {
    text,
    size: clampNum('wm-size', 10, 200, 50),
    opacity: parseFloat(document.getElementById('wm-opacity').value) || 0.3,
    color: document.getElementById('wm-color').value,
    angle: clampNum('wm-angle', -180, 180, 45),
    position: document.getElementById('wm-position').value,
  };
  commitStep('watermark', params, target);
  closeDialog('dlg-watermark');
}

/* — Page numbers — */
function openPageNumbersDialog(step) {
  if (!requireDoc()) return;
  editingStepId = step ? step.id : null;
  if (step) {
    const p = step.params;
    document.getElementById('pn-format').value = p.format;
    document.getElementById('pn-position').value = p.position;
    document.getElementById('pn-size').value = p.size;
    document.getElementById('pn-color').value = p.color;
    document.getElementById('pn-start').value = p.start;
  }
  document.getElementById('pn-dlg-apply').textContent = step ? 'Save Step' : 'Add Step';
  openDialog('dlg-pagenumbers');
}

function applyPageNumbers() {
  const params = {
    format: document.getElementById('pn-format').value,
    position: document.getElementById('pn-position').value,
    size: clampNum('pn-size', 6, 36, 12),
    color: document.getElementById('pn-color').value,
    start: clampNum('pn-start', 1, 99999, 1),
  };
  commitStep('pagenum', params, { mode: 'all', uids: [] });
  closeDialog('dlg-pagenumbers');
}

/* — Text — */
function openAnnotationDialog(step) {
  if (!requireDoc()) return;
  editingStepId = step ? step.id : null;
  if (step) {
    const p = step.params;
    document.getElementById('annot-text').value = p.text;
    document.getElementById('annot-size').value = p.size;
    document.getElementById('annot-color').value = p.color;
    document.getElementById('annot-position').value = p.position;
    setTargetControls('annot-apply', 'annot-ranges-wrap', 'annot-ranges', step.target);
  } else {
    setTargetControls('annot-apply', 'annot-ranges-wrap', 'annot-ranges', null);
    if (S.sel.size) document.getElementById('annot-apply').value = 'selected';
  }
  document.getElementById('annot-dlg-apply').textContent = step ? 'Save Step' : 'Add Step';
  openDialog('dlg-annotation');
}

function applyAnnotation() {
  const text = document.getElementById('annot-text').value.trim();
  if (!text) { toast('Enter annotation text', 'error'); return; }
  const target = readTarget('annot-apply', 'annot-ranges');
  if (!target) return;
  const params = {
    text,
    size: clampNum('annot-size', 6, 72, 14),
    color: document.getElementById('annot-color').value,
    position: document.getElementById('annot-position').value,
  };
  commitStep('text', params, target);
  closeDialog('dlg-annotation');
}

/* — Crop — */
function openCropDialog(step) {
  if (!requireDoc()) return;
  editingStepId = step ? step.id : null;
  if (step) {
    const p = step.params;
    document.getElementById('crop-top').value = p.top;
    document.getElementById('crop-bottom').value = p.bottom;
    document.getElementById('crop-left').value = p.left;
    document.getElementById('crop-right').value = p.right;
    setTargetControls('crop-apply', 'crop-ranges-wrap', 'crop-ranges', step.target);
  } else {
    setTargetControls('crop-apply', 'crop-ranges-wrap', 'crop-ranges', null);
    if (S.sel.size) document.getElementById('crop-apply').value = 'selected';
  }
  document.getElementById('crop-dlg-apply').textContent = step ? 'Save Step' : 'Add Step';
  openDialog('dlg-crop');
}

function applyCrop() {
  const target = readTarget('crop-apply', 'crop-ranges');
  if (!target) return;
  const params = {
    top:    Math.max(0, parseFloat(document.getElementById('crop-top').value) || 0),
    bottom: Math.max(0, parseFloat(document.getElementById('crop-bottom').value) || 0),
    left:   Math.max(0, parseFloat(document.getElementById('crop-left').value) || 0),
    right:  Math.max(0, parseFloat(document.getElementById('crop-right').value) || 0),
  };
  if (!params.top && !params.bottom && !params.left && !params.right) {
    toast('Set at least one crop margin', 'error');
    return;
  }
  commitStep('crop', params, target);
  closeDialog('dlg-crop');
}

/* — Resize — */
function openResizeDialog(step) {
  if (!requireDoc()) return;
  editingStepId = step ? step.id : null;
  if (step) {
    const p = step.params;
    document.getElementById('resize-preset').value = p.preset;
    document.getElementById('resize-custom').style.display = p.preset === 'custom' ? '' : 'none';
    document.getElementById('resize-w').value = p.w;
    document.getElementById('resize-h').value = p.h;
    setTargetControls('resize-apply', 'resize-ranges-wrap', 'resize-ranges', step.target);
  } else {
    setTargetControls('resize-apply', 'resize-ranges-wrap', 'resize-ranges', null);
    if (S.sel.size) document.getElementById('resize-apply').value = 'selected';
  }
  document.getElementById('resize-dlg-apply').textContent = step ? 'Save Step' : 'Add Step';
  openDialog('dlg-resize');
}

function applyResize() {
  const target = readTarget('resize-apply', 'resize-ranges');
  if (!target) return;
  const preset = document.getElementById('resize-preset').value;
  let w, h;
  if (preset === 'custom') {
    w = Math.max(72, Math.min(3000, parseFloat(document.getElementById('resize-w').value) || 612));
    h = Math.max(72, Math.min(3000, parseFloat(document.getElementById('resize-h').value) || 792));
  } else {
    [w, h] = PAGE_SIZES[preset] || PAGE_SIZES.A4;
  }
  commitStep('resize', { preset, w, h }, target);
  closeDialog('dlg-resize');
}

function clampNum(id, min, max, def) {
  const v = parseFloat(document.getElementById(id).value);
  if (isNaN(v)) return def;
  return Math.max(min, Math.min(max, v));
}

/** Create a new step or save the one being edited, then refresh previews. */
function commitStep(type, params, target) {
  pushUndo();
  if (editingStepId != null) {
    const st = S.steps.find(s => s.id === editingStepId);
    if (st) { st.params = params; st.target = target; }
    editingStepId = null;
    toast(STEP_META[type].title + ' step updated', 'success');
  } else {
    S.steps.push(newStep(type, params, target));
    toast(STEP_META[type].title + ' step added — toggle or edit it in the Steps panel', 'success');
  }
  renderStepsPanel();
  updateTopBar();
  if (currentView === 'grid') recompositeThumbs(); else renderReader();
}

/* ────────────────────────────────────────────────────────────
   STEPS PANEL
──────────────────────────────────────────────────────────── */
function stepSummary(st) {
  const p = st.params;
  switch (st.type) {
    case 'watermark': return '“' + p.text + '” · ' + p.angle + '° · ' + targetSummary(st.target);
    case 'pagenum':   return pageNumLabel(p, 0) + '… · ' + p.position.replace('-', ' ');
    case 'text':      return '“' + p.text + '” · ' + p.position.replace('-', ' ') + ' · ' + targetSummary(st.target);
    case 'crop':      return 'T' + p.top + ' B' + p.bottom + ' L' + p.left + ' R' + p.right + ' pt · ' + targetSummary(st.target);
    case 'resize':    return (p.preset === 'custom' ? Math.round(p.w) + '×' + Math.round(p.h) + ' pt' : p.preset) + ' · ' + targetSummary(st.target);
    case 'redact':    return p.rects.length + ' area(s)';
    default:          return '';
  }
}

function renderStepsPanel() {
  const list = document.getElementById('steps-list');
  const empty = document.getElementById('steps-empty');
  if (!list) return;
  list.innerHTML = '';
  empty.style.display = S.steps.length ? 'none' : '';

  S.steps.forEach((st, i) => {
    const item = document.createElement('div');
    item.className = 'step-item' + (st.enabled ? '' : ' disabled');

    const icon = document.createElement('div');
    icon.className = 'step-icon';
    icon.innerHTML = '<i class="bi bi-' + STEP_META[st.type].icon + '"></i>';
    item.appendChild(icon);

    const info = document.createElement('div');
    info.className = 'step-info';
    const title = document.createElement('div');
    title.className = 'step-title';
    title.textContent = (i + 1) + '. ' + STEP_META[st.type].title;
    const sum = document.createElement('div');
    sum.className = 'step-summary';
    sum.textContent = stepSummary(st);
    info.appendChild(title);
    info.appendChild(sum);
    item.appendChild(info);

    const controls = document.createElement('div');
    controls.className = 'step-controls';
    const mk = (icon2, title2, fn) => {
      const b = document.createElement('button');
      b.innerHTML = '<i class="bi bi-' + icon2 + '"></i>';
      b.title = title2;
      b.addEventListener('click', fn);
      return b;
    };
    controls.appendChild(mk(st.enabled ? 'eye' : 'eye-slash', st.enabled ? 'Disable step (hide effect)' : 'Enable step', () => toggleStep(st.id)));
    if (st.type !== 'redact') {
      controls.appendChild(mk('pencil', 'Edit step', () => editStep(st.id)));
    }
    if (S.steps.length > 1) {
      const up = mk('chevron-up', 'Move step up', () => moveStep(st.id, -1));
      up.disabled = i === 0;
      const dn = mk('chevron-down', 'Move step down', () => moveStep(st.id, 1));
      dn.disabled = i === S.steps.length - 1;
      controls.appendChild(up);
      controls.appendChild(dn);
    }
    const rm = mk('x-lg', 'Remove step', () => removeStep(st.id));
    rm.className = 'danger';
    controls.appendChild(rm);
    item.appendChild(controls);

    list.appendChild(item);
  });
}

function toggleStep(id) {
  pushUndo();
  const st = S.steps.find(s => s.id === id);
  if (st) st.enabled = !st.enabled;
  renderStepsPanel();
  updateTopBar();
  if (currentView === 'grid') recompositeThumbs(); else renderReader();
}
function removeStep(id) {
  pushUndo();
  S.steps = S.steps.filter(s => s.id !== id);
  renderStepsPanel();
  updateTopBar();
  if (currentView === 'grid') recompositeThumbs(); else renderReader();
}
function moveStep(id, dir) {
  const i = S.steps.findIndex(s => s.id === id);
  const j = i + dir;
  if (i === -1 || j < 0 || j >= S.steps.length) return;
  pushUndo();
  [S.steps[i], S.steps[j]] = [S.steps[j], S.steps[i]];
  renderStepsPanel();
  if (currentView === 'grid') recompositeThumbs(); else renderReader();
}
function editStep(id) {
  const st = S.steps.find(s => s.id === id);
  if (!st) return;
  switch (st.type) {
    case 'watermark': openWatermarkDialog(st); break;
    case 'pagenum':   openPageNumbersDialog(st); break;
    case 'text':      openAnnotationDialog(st); break;
    case 'crop':      openCropDialog(st); break;
    case 'resize':    openResizeDialog(st); break;
  }
}

/* ────────────────────────────────────────────────────────────
   REDACT — draw on reader view; rects live in a redact step
──────────────────────────────────────────────────────────── */
let redactDrawing = false;
let redactStart = null;

function toggleRedactMode() {
  if (!S.pages.length) { toast('Open a PDF first', 'error'); return; }
  if (!redactMode && currentView !== 'reader') switchView('reader');
  redactMode = !redactMode;
  const overlay = document.getElementById('redact-overlay');
  overlay.classList.toggle('active', redactMode);
  const btn = document.getElementById('redact-toggle');
  if (btn) btn.classList.toggle('active', redactMode);
  const sbtn = document.getElementById('sidebar-redact');
  if (sbtn) sbtn.classList.toggle('active', redactMode);
  if (redactMode) toast('Redact mode — drag rectangles over content to black out. Esc to finish.', 'success');
}

function getRedactStep() {
  let st = S.steps.find(s => s.type === 'redact');
  if (!st) {
    st = newStep('redact', { rects: [] }, { mode: 'all', uids: [] });
    S.steps.push(st);
  }
  return st;
}

function initRedactListeners() {
  const overlay = document.getElementById('redact-overlay');
  if (!overlay) return;

  overlay.addEventListener('mousedown', (e) => {
    if (!redactMode) return;
    const rect = overlay.getBoundingClientRect();
    redactDrawing = true;
    redactStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  });
  overlay.addEventListener('mousemove', (e) => {
    if (!redactDrawing || !redactStart) return;
    const rect = overlay.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    let prev = overlay.querySelector('.redact-preview');
    if (!prev) {
      prev = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      prev.classList.add('redact-preview');
      overlay.appendChild(prev);
    }
    prev.setAttribute('x', Math.min(redactStart.x, x));
    prev.setAttribute('y', Math.min(redactStart.y, y));
    prev.setAttribute('width', Math.abs(x - redactStart.x));
    prev.setAttribute('height', Math.abs(y - redactStart.y));
  });
  overlay.addEventListener('mouseup', (e) => {
    if (!redactDrawing || !redactStart) return;
    const rect = overlay.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const rx = Math.min(redactStart.x, x) / readerScale;
    const ry = Math.min(redactStart.y, y) / readerScale;
    const rw = Math.abs(x - redactStart.x) / readerScale;
    const rh = Math.abs(y - redactStart.y) / readerScale;
    redactDrawing = false;
    redactStart = null;
    const prev = overlay.querySelector('.redact-preview');
    if (prev) prev.remove();
    if (rw > 4 && rh > 4) {
      pushUndo();
      // rects are stored in final-page pt, top-down y, tied to page uid
      getRedactStep().params.rects.push({ uid: readerUid, x: rx, y: ry, w: rw, h: rh });
      renderStepsPanel();
      updateTopBar();
      renderReader();
    }
  });
}

/* ────────────────────────────────────────────────────────────
   DOCUMENT INFO
──────────────────────────────────────────────────────────── */
async function openDocInfoDialog() {
  if (!requireDoc()) return;
  try {
    let m = S.meta;
    if (!m) {
      // read from first PDF source
      const firstPdf = S.pages.find(p => p.srcId != null && !S.sources.get(p.srcId).isImage);
      m = { title: '', author: '', subject: '', keywords: '', creator: '', strip: false };
      if (firstPdf) {
        const lib = await getLibDoc(firstPdf.srcId);
        m.title = lib.getTitle() || '';
        m.author = lib.getAuthor() || '';
        m.subject = lib.getSubject() || '';
        m.keywords = lib.getKeywords() || '';
        m.creator = lib.getCreator() || '';
      }
    }
    document.getElementById('doc-title').value = m.title;
    document.getElementById('doc-author').value = m.author;
    document.getElementById('doc-subject').value = m.subject;
    document.getElementById('doc-keywords').value = m.keywords;
    document.getElementById('doc-creator').value = m.creator;
    const stats = document.getElementById('doc-info-stats');
    stats.textContent = '';
    const b = document.createElement('b');
    b.textContent = 'Pages: ';
    stats.appendChild(b);
    stats.appendChild(document.createTextNode(S.pages.length + ' · Sources: ' + S.sources.size));
    openDialog('dlg-docinfo');
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

function applyDocInfo() {
  pushUndo();
  S.meta = {
    title: document.getElementById('doc-title').value,
    author: document.getElementById('doc-author').value,
    subject: document.getElementById('doc-subject').value,
    keywords: document.getElementById('doc-keywords').value,
    creator: document.getElementById('doc-creator').value,
    strip: false,
  };
  closeDialog('dlg-docinfo');
  toast('Document info will be applied at export', 'success');
}

function removeMetadataAction() {
  pushUndo();
  S.meta = { title: '', author: '', subject: '', keywords: '', creator: '', strip: true };
  closeDialog('dlg-docinfo');
  toast('Metadata will be stripped at export', 'success');
}

/* ────────────────────────────────────────────────────────────
   EXPORT — build the real PDF from model + steps
──────────────────────────────────────────────────────────── */

/** Map a visual-space rect/point to unrotated page coordinates.
    fx, fy are in FULL rotated-page space (pt, bottom-up). */
function visualToPageXY(R, w, h, mx, my, fx, fy) {
  switch (R) {
    case 90:  return { X: mx + w - fy, Y: my + fx };
    case 180: return { X: mx + w - fx, Y: my + h - fy };
    case 270: return { X: mx + fy,     Y: my + h - fx };
    default:  return { X: mx + fx,     Y: my + fy };
  }
}

/**
 * Build the final PDFDocument. Returns { doc, pageRefs } where pageRefs[i]
 * gives the built PDFPage for S.pages[i].
 */
async function buildFinalPDF() {
  const { PDFDocument, rgb, degrees, StandardFonts } = PDFLib;
  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);

  // 1) Copy source pages grouped per source (in encounter order)
  const perSrc = new Map();  // srcId -> {indices: [], cursor: 0, pages: []}
  for (const pg of S.pages) {
    if (pg.srcId == null) continue;
    if (!perSrc.has(pg.srcId)) perSrc.set(pg.srcId, { indices: [], cursor: 0, pages: null });
    perSrc.get(pg.srcId).indices.push(pg.srcPage);
  }
  for (const [srcId, entry] of perSrc) {
    const lib = await getLibDoc(srcId);
    entry.pages = await out.copyPages(lib, entry.indices);
  }

  const built = [];  // per final page: {page, geom, rebuilt, mx, my, baseW, baseH}
  for (const pg of S.pages) {
    if (pg.srcId == null) {
      // Blank page — geometry still applies (rot swaps dims, crop/resize apply)
      const g = computeGeometry(pg, pg.w, pg.h, 0);
      const page = out.addPage([g.W, g.H]);
      built.push({ pg, page, g, rebuilt: true, mx: 0, my: 0 });
      continue;
    }
    const entry = perSrc.get(pg.srcId);
    const copied = entry.pages[entry.cursor++];
    const mb = copied.getMediaBox();
    const srcRot = ((copied.getRotation().angle % 360) + 360) % 360;
    const g = computeGeometry(pg, mb.width, mb.height, srcRot);

    if (g.resize) {
      // Rebuild: embed (cropped) source page and draw scaled+rotated into
      // a fresh page of the target size. Interactive elements are flattened.
      const box = visualCropToBox(g, mb);
      const emb = await out.embedPage(copied, box);
      const page = out.addPage([g.W, g.H]);
      const s = g.s;
      const pw = g.cw * s, ph = g.ch * s;
      let x, y;
      switch (g.R) {
        case 90:  x = g.ox;      y = g.oy + ph; break;
        case 180: x = g.ox + pw; y = g.oy + ph; break;
        case 270: x = g.ox + pw; y = g.oy;      break;
        default:  x = g.ox;      y = g.oy;
      }
      page.drawPage(emb, { x, y, xScale: s, yScale: s, rotate: degrees(-g.R) });
      built.push({ pg, page, g, rebuilt: true, mx: 0, my: 0 });
    } else {
      const page = copied;
      page.setRotation(degrees(g.R));
      if (g.hasCrop) {
        const box = visualCropToBox(g, mb);
        page.setCropBox(box.left, box.bottom, box.right - box.left, box.top - box.bottom);
      }
      out.addPage(page);
      built.push({ pg, page, g, rebuilt: false, mx: mb.x, my: mb.y });
    }
  }

  // 2) Overlay steps
  for (let i = 0; i < built.length; i++) {
    const { pg, page, g, rebuilt, mx, my } = built[i];
    const active = stepsForPage(pg.uid);

    /** Draw text at final-visual (vx, vy) bottom-up pt with extra rotation. */
    const drawTextVisual = (text, vx, vy, size, colorHex, extraRot, opacity) => {
      const c = hexToRgb(colorHex);
      if (rebuilt) {
        page.drawText(text, {
          x: vx, y: vy, size, font,
          color: rgb(c.r, c.g, c.b),
          opacity: opacity == null ? 1 : opacity,
          rotate: degrees(extraRot || 0),
        });
      } else {
        // shift by crop offset into full-visual space, then map through rotation
        const fx = vx + g.cl, fy = vy + g.cb;
        const un = visualToPageXY(g.R,
          (g.R === 90 || g.R === 270) ? g.vh : g.vw,   // unrotated width
          (g.R === 90 || g.R === 270) ? g.vw : g.vh,   // unrotated height
          mx, my, fx, fy);
        page.drawText(text, {
          x: un.X, y: un.Y, size, font,
          color: rgb(c.r, c.g, c.b),
          opacity: opacity == null ? 1 : opacity,
          rotate: degrees((extraRot || 0) + g.R),
        });
      }
    };

    const drawRectVisual = (vx, vyTop, w, h) => {
      // convert top-down y to bottom-up
      const vy = g.H - vyTop - h;
      const c1 = { fx: vx + g.cl, fy: vy + g.cb };
      const c2 = { fx: vx + w + g.cl, fy: vy + h + g.cb };
      if (rebuilt) {
        page.drawRectangle({ x: vx, y: vy, width: w, height: h, color: rgb(0, 0, 0) });
      } else {
        const uw = (g.R === 90 || g.R === 270) ? g.vh : g.vw;
        const uh = (g.R === 90 || g.R === 270) ? g.vw : g.vh;
        const a = visualToPageXY(g.R, uw, uh, mx, my, c1.fx, c1.fy);
        const b = visualToPageXY(g.R, uw, uh, mx, my, c2.fx, c2.fy);
        page.drawRectangle({
          x: Math.min(a.X, b.X), y: Math.min(a.Y, b.Y),
          width: Math.abs(a.X - b.X), height: Math.abs(a.Y - b.Y),
          color: rgb(0, 0, 0),
        });
      }
    };

    for (const st of active) {
      const p = st.params;
      if (st.type === 'watermark') {
        const tw = font.widthOfTextAtSize(p.text, p.size);
        const pos = anchorPos(p.position, g.W, g.H, p.size, tw, true);
        drawTextVisual(p.text, pos.x, pos.y, p.size, p.color, p.angle, p.opacity);
      } else if (st.type === 'pagenum') {
        const label = pageNumLabel(p, i);
        const tw = font.widthOfTextAtSize(label, p.size);
        const pos = marginPos(p.position, g.W, g.H, p.size, tw, 36);
        drawTextVisual(label, pos.x, pos.y, p.size, p.color, 0, 1);
      } else if (st.type === 'text') {
        const tw = font.widthOfTextAtSize(p.text, p.size);
        const pos = marginPos(p.position, g.W, g.H, p.size, tw, 20);
        drawTextVisual(p.text, pos.x, pos.y, p.size, p.color, 0, 1);
      } else if (st.type === 'redact') {
        for (const r of p.rects) {
          if (r.uid !== pg.uid) continue;
          drawRectVisual(r.x, r.y, r.w, r.h);
        }
      }
    }
  }

  // 3) Metadata
  const m = S.meta;
  if (m) {
    out.setTitle(m.title); out.setAuthor(m.author); out.setSubject(m.subject);
    out.setKeywords(m.keywords.split(',').map(s => s.trim()).filter(Boolean));
    out.setCreator(m.creator);
    if (m.strip) out.setProducer('');
  }
  return out;
}

/** boundingBox for embedPage / setCropBox from visual crop margins. */
function visualCropToBox(g, mb) {
  const w = mb.width, h = mb.height, mx = mb.x, my = mb.y;
  const l = g.cl, r = g.cr, t = g.ct, b = g.cb;
  switch (g.R) {
    case 90:  return { left: mx + t, bottom: my + l, right: mx + w - b, top: my + h - r };
    case 180: return { left: mx + r, bottom: my + t, right: mx + w - l, top: my + h - b };
    case 270: return { left: mx + b, bottom: my + r, right: mx + w - t, top: my + h - l };
    default:  return { left: mx + l, bottom: my + b, right: mx + w - r, top: my + h - t };
  }
}

/* ── Export panel ── */
function openExportPanel() {
  if (!requireDoc()) return;
  const fn = document.getElementById('export-filename');
  if (fn && !fn.value) fn.value = S.fileName;
  const info = document.getElementById('export-info');
  if (info) {
    const enabled = S.steps.filter(s => s.enabled).length;
    info.textContent = 'Pages: ' + S.pages.length +
      (enabled ? ' · ' + enabled + ' edit step(s) will be applied' : '');
  }
  // enable/disable "selected pages" option
  const selRadio = document.getElementById('export-mode-selected');
  if (selRadio) {
    selRadio.disabled = !S.sel.size;
    const lbl = document.getElementById('export-mode-selected-label');
    if (lbl) lbl.textContent = 'Selected pages' + (S.sel.size ? ' (' + S.sel.size + ')' : '');
  }
  openDialog('dlg-export-panel');
}

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

async function doExport() {
  if (!S.pages.length) return;
  const mode = document.querySelector('input[name="export-mode"]:checked')?.value || 'all';
  let filename = (document.getElementById('export-filename')?.value || '').trim() || S.fileName;
  if (!/\.pdf$/i.test(filename)) filename += '.pdf';
  const flatten   = document.getElementById('export-flatten')?.checked;
  const compress  = document.getElementById('export-compress')?.checked;
  const removeHidden = document.getElementById('export-hidden')?.checked;

  const protectEnabled = document.getElementById('export-protect-enable')?.checked;
  let saveOpts = compress ? { useObjectStreams: true } : {};
  if (protectEnabled) {
    const userPw = document.getElementById('export-pw-user')?.value || '';
    if (!userPw) { toast('Enter a user password for protection', 'error'); return; }
    const ownerPw = document.getElementById('export-pw-owner')?.value || userPw;
    const restrictPrint = document.getElementById('export-pw-restrict-print')?.checked;
    const restrictCopy  = document.getElementById('export-pw-restrict-copy')?.checked ?? true;
    const restrictEdit  = document.getElementById('export-pw-restrict-edit')?.checked ?? true;
    const readOnly      = document.getElementById('export-pw-read-only')?.checked;
    saveOpts = {
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

  setBusy(true, 'Building PDF…');
  try {
    const { PDFDocument, PDFName } = PDFLib;
    const full = await buildFinalPDF();
    if (flatten) { try { full.getForm().flatten(); } catch (_) {} }
    if (removeHidden) stripHiddenData(full);

    const finish = (n) => {
      closeDialog('dlg-export-panel');
      toast(n + ' file(s) downloaded', 'success');
    };

    if (mode === 'all') {
      const bytes = await full.save(saveOpts);
      downloadBytes(bytes, filename);
      closeDialog('dlg-export-panel');
      toast('PDF exported (' + fmtBytes(bytes.length) + ')', 'success');

    } else if (mode === 'selected' || mode === 'pages') {
      let indices;
      if (mode === 'selected') {
        indices = S.pages.map((p, i) => S.sel.has(p.uid) ? i : -1).filter(i => i >= 0);
      } else {
        const str = (document.getElementById('export-pages-input')?.value || '').trim();
        if (!str) { toast('Enter page numbers to export', 'error'); setBusy(false); return; }
        indices = parsePageRanges(str, S.pages.length);
      }
      if (!indices || !indices.length) { toast('Invalid page range', 'error'); setBusy(false); return; }
      const sub = await PDFDocument.create();
      const copied = await sub.copyPages(full, indices);
      copied.forEach(p => sub.addPage(p));
      const bytes = await sub.save(saveOpts);
      downloadBytes(bytes, filename);
      closeDialog('dlg-export-panel');
      toast('Exported ' + indices.length + ' page(s) (' + fmtBytes(bytes.length) + ')', 'success');

    } else if (mode === 'split') {
      const splitMode = document.querySelector('input[name="split-sub-mode"]:checked')?.value || 'all';
      const total = S.pages.length;
      const stem = stemName(filename);
      let ranges = [];
      if (splitMode === 'all') {
        for (let i = 0; i < total; i++) ranges.push([i]);
      } else {
        const str = (document.getElementById('export-split-ranges')?.value || '').trim();
        if (!str) { toast('Enter page ranges', 'error'); setBusy(false); return; }
        const parsed = parseCustomRanges(str, total);
        if (!parsed || !parsed.length) { toast('Invalid range format', 'error'); setBusy(false); return; }
        ranges = parsed;
      }
      for (let r = 0; r < ranges.length; r++) {
        const part = await PDFDocument.create();
        const copied = await part.copyPages(full, ranges[r]);
        copied.forEach(p => part.addPage(p));
        const bytes = await part.save(saveOpts);
        const label = splitMode === 'all' ? 'p' + (ranges[r][0] + 1) : 'part' + (r + 1);
        downloadBytes(bytes, stem + '_' + label + '.pdf');
      }
      finish(ranges.length);
    }
  } catch (err) {
    toast('Export error: ' + err.message, 'error');
  }
  setBusy(false);
}

function stripHiddenData(doc) {
  const { PDFName } = PDFLib;
  try {
    const catalog = doc.context.lookup(doc.context.trailerInfo.Root);
    if (catalog && catalog.get) {
      if (catalog.get(PDFName.of('Metadata'))) catalog.delete(PDFName.of('Metadata'));
      const names = catalog.get(PDFName.of('Names'));
      if (names && names.get) {
        if (names.get(PDFName.of('JavaScript'))) names.delete(PDFName.of('JavaScript'));
        if (names.get(PDFName.of('EmbeddedFiles'))) names.delete(PDFName.of('EmbeddedFiles'));
      }
    }
    doc.getPages().forEach(page => {
      const dict = page.node;
      if (dict.get && dict.get(PDFName.of('Annots'))) dict.delete(PDFName.of('Annots'));
    });
  } catch (_) {}
}

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

function toggleRangesInput(wrapId, value) {
  const el = document.getElementById(wrapId);
  if (el) el.style.display = value === 'ranges' ? '' : 'none';
}

/* ────────────────────────────────────────────────────────────
   INIT
──────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initRedactListeners();
  updateUndoRedoUI();
  updateEmptyState();

  /* global drag & drop to add files */
  const body = document.body;
  let dragDepth = 0;
  body.addEventListener('dragenter', (e) => {
    if (dragUids) return;                 // internal page rearrange
    if (![...(e.dataTransfer?.types || [])].includes('Files')) return;
    dragDepth++;
    document.getElementById('global-drop-hint').classList.add('visible');
  });
  body.addEventListener('dragleave', () => {
    if (dragUids) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) document.getElementById('global-drop-hint').classList.remove('visible');
  });
  body.addEventListener('dragover', (e) => e.preventDefault());
  body.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragDepth = 0;
    document.getElementById('global-drop-hint').classList.remove('visible');
    if (dragUids) return;                 // handled by card drop
    const files = e.dataTransfer.files;
    if (files && files.length) await handleAddFiles(files);
  });

  /* reader page input */
  const readerInput = document.getElementById('reader-page-input');
  if (readerInput) {
    const go = () => {
      const n = parseInt(readerInput.value, 10);
      if (!isNaN(n)) readerGoto(n - 1);
    };
    readerInput.addEventListener('change', go);
    readerInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  }

  /* resize preset toggle */
  const resizePreset = document.getElementById('resize-preset');
  if (resizePreset) {
    resizePreset.addEventListener('change', () => {
      document.getElementById('resize-custom').style.display =
        resizePreset.value === 'custom' ? '' : 'none';
    });
  }

  /* watermark opacity display */
  const wmOp = document.getElementById('wm-opacity');
  if (wmOp) {
    wmOp.addEventListener('input', () => {
      document.getElementById('wm-opacity-val').textContent = wmOp.value;
    });
  }

  /* password prompt enter */
  const pwInput = document.getElementById('pw-prompt-input');
  if (pwInput) pwInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') pwPromptSubmit(); });

  /* keyboard shortcuts */
  document.addEventListener('keydown', (e) => {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    if (e.key === 'Escape') {
      if (redactMode) { toggleRedactMode(); return; }
      if (closeAnyDialog()) return;
      if (S.sel.size) { deselectAllPages(); return; }
    }
    if (typing) return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'a' && S.pages.length && currentView === 'grid') { e.preventDefault(); selectAllPages(); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel.size && currentView === 'grid') { e.preventDefault(); deletePageUids([...S.sel]); }
    else if (currentView === 'reader' && e.key === 'ArrowLeft') { readerPrev(); }
    else if (currentView === 'reader' && e.key === 'ArrowRight') { readerNext(); }
  });
});
