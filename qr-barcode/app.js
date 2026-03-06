'use strict';

/* ── Tool labels ───────────────────────────── */
const TOOL_LABELS = {
  qr:      'QR Code Generator',
  barcode: 'Barcode Generator',
};

/* ── Tab navigation ────────────────────────── */
function showTool(id) {
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  document.querySelector(`.tab-btn[data-tab="${id}"]`).classList.add('active');
  document.getElementById('sb-tool').textContent = TOOL_LABELS[id] || id;
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
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.getElementById('theme-btn').textContent = isDark ? '\u2600 Light' : '\u263e Dark';
}
updateThemeBtn();

/* ── Messages ──────────────────────────────── */
function setMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className   = 'tool-msg' + (type ? ' ' + type : '');
  if (text && (type === 'ok' || type === 'err')) {
    setTimeout(() => { if (el.textContent === text) { el.textContent = ''; el.className = 'tool-msg'; } }, 3000);
  }
}

/* ═══════════════════════════════════════════
   QR CODE GENERATOR
═══════════════════════════════════════════ */

let qrInstance = null;

function qrContainer() { return document.getElementById('qr-output'); }

function qrGenerate() {
  const text  = document.getElementById('qr-input').value;
  const size  = parseInt(document.getElementById('qr-size').value, 10);
  const ecl   = document.getElementById('qr-ecl').value;
  const dark  = document.getElementById('qr-dark').value;
  const light = document.getElementById('qr-light').value;

  const container = qrContainer();
  const hint      = document.getElementById('qr-hint');

  container.innerHTML = '';
  qrInstance = null;

  if (!text.trim()) {
    hint.style.display = '';
    setMsg('qr-msg', '', '');
    return;
  }
  hint.style.display = 'none';

  if (typeof QRCode === 'undefined') {
    setMsg('qr-msg', 'QRCode library failed to load — check your internet connection', 'err');
    return;
  }

  try {
    qrInstance = new QRCode(container, {
      text,
      width:        size,
      height:       size,
      colorDark:    dark,
      colorLight:   light,
      correctLevel: QRCode.CorrectLevel[ecl],
    });
    setMsg('qr-msg', '', '');
  } catch (e) {
    container.innerHTML = '';
    hint.style.display  = '';
    setMsg('qr-msg', 'Error: ' + e.message, 'err');
  }
}

function qrUpdateSize(v) {
  document.getElementById('qr-size-label').textContent = v + 'px';
  qrGenerate();
}

function qrDownload() {
  const canvas = qrContainer().querySelector('canvas');
  if (!canvas) { setMsg('qr-msg', 'Generate a QR code first', 'err'); return; }
  const a = document.createElement('a');
  a.download = 'qrcode.png';
  a.href     = canvas.toDataURL('image/png');
  a.click();
  setMsg('qr-msg', 'Downloaded!', 'ok');
}

function qrClear() {
  document.getElementById('qr-input').value = '';
  qrContainer().innerHTML = '';
  document.getElementById('qr-hint').style.display = '';
  qrInstance = null;
  setMsg('qr-msg', '', '');
}

/* ═══════════════════════════════════════════
   BARCODE GENERATOR
═══════════════════════════════════════════ */

function bcGenerate() {
  const value   = document.getElementById('bc-input').value.trim();
  const format  = document.getElementById('bc-format').value;
  const color   = document.getElementById('bc-color').value;
  const width   = parseFloat(document.getElementById('bc-width').value);
  const height  = parseInt(document.getElementById('bc-height').value, 10);
  const display = document.getElementById('bc-display-value').checked;
  const flat    = document.getElementById('bc-flat').checked;

  const svg  = document.getElementById('bc-output');
  const hint = document.getElementById('bc-hint');

  if (!value) {
    svg.innerHTML = '';
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    hint.style.display = '';
    setMsg('bc-msg', '', '');
    return;
  }
  hint.style.display = 'none';

  if (typeof JsBarcode === 'undefined') {
    setMsg('bc-msg', 'JsBarcode library failed to load — check your internet connection', 'err');
    return;
  }

  try {
    JsBarcode(svg, value, {
      format,
      lineColor:    color,
      background:   '#ffffff',
      width,
      height,
      displayValue: display,
      flat,
      margin:       10,
    });
    setMsg('bc-msg', '', '');
  } catch (e) {
    svg.innerHTML = '';
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    hint.style.display = '';
    setMsg('bc-msg', 'Error: ' + e.message, 'err');
  }
}

function bcUpdateWidth(v) {
  document.getElementById('bc-width-label').textContent = v;
  bcGenerate();
}

function bcUpdateHeight(v) {
  document.getElementById('bc-height-label').textContent = v + 'px';
  bcGenerate();
}

function bcDownloadSVG() {
  const svg = document.getElementById('bc-output');
  if (!svg.querySelector('rect, path')) { setMsg('bc-msg', 'Generate a barcode first', 'err'); return; }
  const serial = new XMLSerializer();
  const svgStr = serial.serializeToString(svg);
  const blob   = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const a      = document.createElement('a');
  a.download   = 'barcode.svg';
  a.href       = URL.createObjectURL(blob);
  a.click();
  URL.revokeObjectURL(a.href);
  setMsg('bc-msg', 'SVG downloaded!', 'ok');
}

function bcDownloadPNG() {
  const svg = document.getElementById('bc-output');
  if (!svg.querySelector('rect, path')) { setMsg('bc-msg', 'Generate a barcode first', 'err'); return; }

  const w = svg.width?.baseVal?.value || svg.getBoundingClientRect().width  || 400;
  const h = svg.height?.baseVal?.value || svg.getBoundingClientRect().height || 150;

  const serial  = new XMLSerializer();
  const svgStr  = serial.serializeToString(svg);
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url     = URL.createObjectURL(svgBlob);
  const img     = new Image();

  img.onload = () => {
    const canvas  = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    const a = document.createElement('a');
    a.download = 'barcode.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    setMsg('bc-msg', 'PNG downloaded!', 'ok');
  };
  img.onerror = () => { URL.revokeObjectURL(url); setMsg('bc-msg', 'PNG export failed', 'err'); };
  img.src = url;
}

function bcClear() {
  document.getElementById('bc-input').value = '';
  const svg = document.getElementById('bc-output');
  svg.innerHTML = '';
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  document.getElementById('bc-hint').style.display = '';
  setMsg('bc-msg', '', '');
}
