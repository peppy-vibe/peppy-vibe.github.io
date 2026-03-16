/* ═══════════════════════════════════════════
   QR & BARCODE TOOLS — app.js
═══════════════════════════════════════════ */
'use strict';

// ──────────────────────────────────────────
// Theme
// ──────────────────────────────────────────
function toggleTheme() {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('stp-theme', next);
  document.getElementById('theme-btn').textContent = next === 'dark' ? '\u2600' : '\u263E';
}
(function initTheme() {
  const t = localStorage.getItem('stp-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = t === 'dark' ? '\u2600' : '\u263E';
})();

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

// ──────────────────────────────────────────
// Navigation
// ──────────────────────────────────────────
function showTool(id) {
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(id);
  if (panel) panel.classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('onclick') === `showTool('${id}')`);
  });
  closeMobileMenu();
}

function toggleGroup(grpId) {
  document.getElementById(grpId).classList.toggle('collapsed');
}

function jumpGroup(grpId, btn) {
  document.querySelectorAll('.grp-nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const group = document.getElementById(grpId);
  if (group) {
    group.classList.remove('collapsed');
    const firstBtn = group.querySelector('.tab-btn');
    if (firstBtn) firstBtn.click();
  }
}

// ──────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────
function downloadBlob(blob, filename) {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename });
  a.click();
  URL.revokeObjectURL(a.href);
}

function fmtDate() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function setMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className   = 'tool-msg' + (type ? ' ' + type : '');
}

// ══════════════════════════════════════════════════════════
// QR CODE GENERATOR
// ══════════════════════════════════════════════════════════
let qrInstance  = null;
let qrCurrentType = 'url';
let qrLogoDataUrl = null;
const qrGenHistory = [];

const QR_FORMAT_HINTS = {
  L: 'L — 7% correction. Smallest code.',
  M: 'M — 15% correction. Recommended.',
  Q: 'Q — 25% correction. Good for scanning.',
  H: 'H — 30% correction. Required for logo overlay.'
};

// ── Type selection ──────────────────────────────────────
function qrSetType(type, btn) {
  qrCurrentType = type;
  document.querySelectorAll('.qr-types .qr-type-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.qr-input-block').forEach(b => b.classList.remove('active'));
  const block = document.getElementById('qri-' + type);
  if (block) block.classList.add('active');
  qrGenerate();
}

// ── Build QR string from current type ───────────────────
function qrBuildString() {
  switch (qrCurrentType) {
    case 'url': {
      const v = (document.getElementById('qr-url-val')?.value || '').trim();
      return v || null;
    }
    case 'text': {
      const v = (document.getElementById('qr-text-val')?.value || '').trim();
      return v || null;
    }
    case 'wifi': {
      const ssid   = (document.getElementById('qr-wifi-ssid')?.value || '').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/"/g,'\\"').replace(/,/g,'\\,');
      const pass   = (document.getElementById('qr-wifi-pass')?.value || '').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/"/g,'\\"').replace(/,/g,'\\,');
      const sec    = document.getElementById('qr-wifi-sec')?.value || 'WPA';
      const hidden = document.getElementById('qr-wifi-hidden')?.checked ? 'true' : 'false';
      if (!ssid) return null;
      return `WIFI:T:${sec};S:${ssid};P:${pass};H:${hidden};;`;
    }
    case 'vcard': {
      const fn  = (document.getElementById('qr-vc-fname')?.value || '').trim();
      const ln  = (document.getElementById('qr-vc-lname')?.value || '').trim();
      const tel = (document.getElementById('qr-vc-phone')?.value || '').trim();
      const em  = (document.getElementById('qr-vc-email')?.value || '').trim();
      const org = (document.getElementById('qr-vc-org')?.value  || '').trim();
      const url = (document.getElementById('qr-vc-url')?.value  || '').trim();
      if (!fn && !ln && !tel && !em) return null;
      return [
        'BEGIN:VCARD', 'VERSION:3.0',
        `N:${ln};${fn}`,
        `FN:${fn} ${ln}`.trim(),
        tel ? `TEL:${tel}` : '',
        em  ? `EMAIL:${em}` : '',
        org ? `ORG:${org}` : '',
        url ? `URL:${url}` : '',
        'END:VCARD'
      ].filter(Boolean).join('\n');
    }
    case 'email': {
      const to   = (document.getElementById('qr-em-to')?.value   || '').trim();
      const sub  = (document.getElementById('qr-em-sub')?.value  || '').trim();
      const body = (document.getElementById('qr-em-body')?.value || '').trim();
      if (!to) return null;
      let s = `mailto:${encodeURIComponent(to)}`;
      const params = [];
      if (sub)  params.push('subject=' + encodeURIComponent(sub));
      if (body) params.push('body='    + encodeURIComponent(body));
      if (params.length) s += '?' + params.join('&');
      return s;
    }
    case 'sms': {
      const num = (document.getElementById('qr-sms-num')?.value || '').trim();
      const msg = (document.getElementById('qr-sms-msg')?.value || '').trim();
      if (!num) return null;
      return msg ? `smsto:${num}:${msg}` : `smsto:${num}`;
    }
    case 'phone': {
      const v = (document.getElementById('qr-phone-val')?.value || '').trim();
      if (!v) return null;
      return `tel:${v}`;
    }
    default: return null;
  }
}

// ── Generate ─────────────────────────────────────────────
function qrGenerate() {
  const content = qrBuildString();
  const hint    = document.getElementById('qr-hint');
  if (!content) {
    if (qrInstance) { qrInstance.clear(); qrInstance = null; }
    document.getElementById('qr-output').innerHTML = '';
    if (hint) hint.textContent = 'Enter content above to generate a QR code.';
    return;
  }

  const size = parseInt(document.getElementById('qr-size')?.value) || 256;
  const ecl  = document.getElementById('qr-ecl')?.value    || 'M';
  const dark  = document.getElementById('qr-dark')?.value  || '#000000';
  const light = document.getElementById('qr-light')?.value || '#ffffff';

  const outputEl = document.getElementById('qr-output');
  outputEl.innerHTML = '';

  try {
    qrInstance = new QRCode(outputEl, {
      text: content,
      width:  size,
      height: size,
      colorDark:  dark,
      colorLight: light,
      correctLevel: QRCode.CorrectLevel[ecl] ?? QRCode.CorrectLevel.M
    });
  } catch (e) {
    outputEl.innerHTML = `<span style="color:#e05252;font-size:12px">Cannot encode: ${e.message || 'invalid input'}</span>`;
    if (hint) hint.textContent = '';
    return;
  }

  if (hint) hint.textContent = '';

  // If we have a logo, apply overlay after QR renders
  if (qrLogoDataUrl) {
    // The qrcodejs lib renders asynchronously via a timeout; give it a tick
    setTimeout(() => applyLogoOverlay(outputEl, size), 120);
  }
}

// ── Logo overlay ──────────────────────────────────────────
function loadLogo(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    qrLogoDataUrl = e.target.result;
    const preview = document.getElementById('logo-preview');
    if (preview) { preview.src = qrLogoDataUrl; preview.style.display = 'block'; }
    qrGenerate();
  };
  reader.readAsDataURL(file);
}

function clearLogo() {
  qrLogoDataUrl = null;
  const preview = document.getElementById('logo-preview');
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
  const input = document.getElementById('logo-input');
  if (input) input.value = '';
  qrGenerate();
}

function applyLogoOverlay(containerEl, size) {
  const canvas = containerEl.querySelector('canvas');
  if (!canvas || !qrLogoDataUrl) return;

  const ctx  = canvas.getContext('2d');
  const img  = new Image();
  img.onload = () => {
    const logoSize = Math.round(size * 0.22);
    const x = Math.round((size - logoSize) / 2);
    const y = Math.round((size - logoSize) / 2);
    // White padding
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 4, y - 4, logoSize + 8, logoSize + 8);
    ctx.drawImage(img, x, y, logoSize, logoSize);
  };
  img.src = qrLogoDataUrl;
}

// ── Size update ──────────────────────────────────────────
function qrUpdateSize(val) {
  const slider = document.getElementById('qr-size');
  if (slider) slider.value = val;
  const lbl = document.getElementById('qr-size-lbl');
  if (lbl) lbl.textContent = val + ' px';
  qrGenerate();
}

// ── Download PNG ─────────────────────────────────────────
function qrDownload() {
  const canvas = document.querySelector('#qr-output canvas');
  if (!canvas) { alert('Generate a QR code first.'); return; }
  canvas.toBlob(blob => downloadBlob(blob, 'qrcode_' + fmtDate() + '.png'), 'image/png');
}

// ── Copy to clipboard ────────────────────────────────────
async function qrCopyClipboard() {
  const canvas = document.querySelector('#qr-output canvas');
  if (!canvas) { alert('Generate a QR code first.'); return; }
  try {
    canvas.toBlob(async blob => {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      const hint = document.getElementById('qr-hint');
      if (hint) { hint.textContent = 'Copied to clipboard!'; setTimeout(() => hint.textContent = '', 2000); }
    });
  } catch (e) {
    alert('Clipboard copy is not supported in this browser. Use Download instead.');
  }
}

// ── Clear ────────────────────────────────────────────────
function qrClear() {
  document.querySelectorAll('.qr-input-block input, .qr-input-block textarea').forEach(el => { el.value = ''; });
  if (qrInstance) { qrInstance.clear(); qrInstance = null; }
  document.getElementById('qr-output').innerHTML = '';
  const hint = document.getElementById('qr-hint');
  if (hint) hint.textContent = 'Enter content above to generate a QR code.';
}

// ── Generation history ───────────────────────────────────
function renderQrGenHistory() {
  const el = document.getElementById('qr-gen-history');
  if (!el) return;
  el.innerHTML = qrGenHistory.slice().reverse().map((h, i) => {
    const num = qrGenHistory.length - i;
    const preview = h.text.length > 60 ? h.text.slice(0, 57) + '...' : h.text;
    return `<div class="history-item"><span class="h-num">#${num}</span><span class="h-type">${h.type}</span> ${escapeHtml(preview)} <span class="h-time">${h.time}</span></div>`;
  }).join('');
}
function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ══════════════════════════════════════════════════════════
// BATCH QR GENERATOR
// ══════════════════════════════════════════════════════════
const batchQrInstances = [];

function batchGenerate() {
  batchQrInstances.length = 0;
  const lines = (document.getElementById('batch-input')?.value || '')
    .split('\n').map(s => s.trim()).filter(Boolean);
  if (!lines.length) { alert('Enter at least one value.'); return; }

  const size = parseInt(document.getElementById('batch-size')?.value) || 192;
  const ecl  = document.getElementById('batch-ecl')?.value || 'M';

  const grid = document.getElementById('batch-results');
  if (!grid) return;
  grid.innerHTML = '';

  lines.forEach((line, idx) => {
    // Build DOM nodes safely (no innerHTML with user data — prevents XSS)
    const labelEl = document.createElement('div');
    labelEl.className = 'batch-label';
    labelEl.textContent = line;

    const qrEl = document.createElement('div');
    qrEl.id = 'bqr-' + idx;

    const dlBtn = document.createElement('button');
    dlBtn.textContent = '↓ Download';
    dlBtn.addEventListener('click', () => batchDownloadOne(idx, line));

    const wrapper = document.createElement('div');
    wrapper.className = 'batch-item';
    wrapper.append(labelEl, qrEl, dlBtn);
    grid.appendChild(wrapper);

    try {
      const instance = new QRCode(qrEl, {
        text: line,
        width:  size, height: size,
        colorDark: '#000000', colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel[ecl] ?? QRCode.CorrectLevel.M
      });
      batchQrInstances.push({ instance, el: 'bqr-' + idx });
    } catch (e) {
      const errEl = document.createElement('span');
      errEl.style.cssText = 'color:#e05252;font-size:11px';
      errEl.textContent = 'Error: ' + (e.message || 'invalid input');
      qrEl.appendChild(errEl);
    }
  });

  const info = document.getElementById('batch-info');
  if (info) info.textContent = `Generated ${lines.length} QR code${lines.length !== 1 ? 's' : ''}.`;
  const dlAll = document.getElementById('batch-dl-all');
  if (dlAll) dlAll.disabled = false;
}

function batchDownloadOne(idx, rawLabel) {
  setTimeout(() => {
    const canvas = document.querySelector(`#bqr-${idx} canvas`);
    if (!canvas) { alert('QR canvas not found.'); return; }
    const label = rawLabel.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    canvas.toBlob(blob => downloadBlob(blob, `qr_${label}_${idx}.png`), 'image/png');
  }, 50);
}

async function batchDownloadAll() {
  const canvases = document.querySelectorAll('#batch-results canvas');
  if (!canvases.length) { alert('Generate QR codes first.'); return; }
  for (let i = 0; i < canvases.length; i++) {
    await new Promise(resolve => {
      canvases[i].toBlob(blob => {
        downloadBlob(blob, `qr_batch_${i + 1}.png`);
        setTimeout(resolve, 200);
      }, 'image/png');
    });
  }
}

function clearBatch() {
  batchQrInstances.length = 0;
  const grid = document.getElementById('batch-results');
  if (grid) grid.innerHTML = '';
  const info = document.getElementById('batch-info');
  if (info) info.textContent = '';
  const dlAll = document.getElementById('batch-dl-all');
  if (dlAll) dlAll.disabled = true;
  const inp = document.getElementById('batch-input');
  if (inp) inp.value = '';
}

// ══════════════════════════════════════════════════════════
// QR SCANNER (MediaDevices API)
// ══════════════════════════════════════════════════════════
let scanStream  = null;
let scanRafId   = null;
let scanHistory = [];

function startScanner() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setMsg('scan-status', '⚠ Camera API not available in this browser or context.', 'err');
    return;
  }
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => {
      scanStream = stream;
      const video = document.getElementById('scan-video');
      video.srcObject = stream;
      video.play();
      document.getElementById('scan-start-btn').disabled = true;
      document.getElementById('scan-stop-btn').disabled  = false;
      setMsg('scan-status', '📷 Camera active — point at a QR code…');
      scanLoop();
    })
    .catch(err => {
      setMsg('scan-status', '⚠ Camera access denied: ' + err.message, 'err');
    });
}

function stopScanner() {
  if (scanRafId) { cancelAnimationFrame(scanRafId); scanRafId = null; }
  if (scanStream) { scanStream.getTracks().forEach(t => t.stop()); scanStream = null; }
  const video = document.getElementById('scan-video');
  video.srcObject = null;
  document.getElementById('scan-start-btn').disabled = false;
  document.getElementById('scan-stop-btn').disabled  = true;
  setMsg('scan-status', 'Camera is off.');
}

function scanLoop() {
  const video  = document.getElementById('scan-video');
  const canvas = document.getElementById('scan-canvas');
  if (!video || !canvas || !scanStream) return;

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);

    if (typeof BarcodeDetector !== 'undefined') {
      // Use native BarcodeDetector if available (Chrome 83+)
      const detector = new BarcodeDetector({ formats: ['qr_code'] });
      detector.detect(canvas).then(results => {
        if (results.length) {
          const value = results[0].rawValue;
          onScanResult(value);
        }
      }).catch(() => {});
    } else {
      // Fallback: jsQR if available
      const imageData = ctx.getImageData(0, 0, w, h);
      if (typeof jsQR !== 'undefined') {
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) onScanResult(code.data);
      } else {
        setMsg('scan-status', 'ℹ BarcodeDetector not available in this browser. Try Chrome on desktop/Android.', '');
        stopScanner();
        return;
      }
    }
  }
  scanRafId = requestAnimationFrame(scanLoop);
}

// Safely create a link element only for http/https URLs; fall back to plain text.
function _safeScanNode(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      const a = document.createElement('a');
      a.href      = url.href;          // set via property, not attr interpolation
      a.textContent = value;
      a.target    = '_blank';
      a.rel       = 'noopener noreferrer';
      return a;
    }
  } catch (_) { /* not a URL */ }
  const span = document.createElement('span');
  span.textContent = value;            // safe — no innerHTML
  return span;
}

function onScanResult(value) {
  const result = document.getElementById('scan-result');
  if (result) {
    result.textContent = '';           // clear first
    result.appendChild(_safeScanNode(value));
  }
  setMsg('scan-status', '✅ QR code detected!', 'ok');

  // Add to history (avoid duplicates in a row)
  if (!scanHistory.length || scanHistory[0] !== value) {
    scanHistory.unshift(value);
    renderScanHistory();
  }
}

function renderScanHistory() {
  const wrap = document.getElementById('scan-history');
  if (!wrap) return;
  wrap.textContent = ''; // clear safely
  scanHistory.slice(0, 20).forEach((v, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'font-size:12px;padding:4px 10px;background:var(--bg2);border:1px solid var(--border);border-radius:4px;word-break:break-all;color:var(--text2)';
    const num = document.createElement('span');
    num.style.cssText = 'color:var(--accent);font-weight:600;margin-right:6px';
    num.textContent = '#' + (i + 1);
    row.appendChild(num);
    row.appendChild(_safeScanNode(v)); // safe — protocol-validated or textContent
    wrap.appendChild(row);
  });
}

function copyScanResult() {
  const result = document.getElementById('scan-result');
  if (!result || !result.textContent.trim() || result.textContent === 'Waiting for scan…') {
    alert('No scan result yet.'); return;
  }
  navigator.clipboard.writeText(result.textContent).then(() => {
    setMsg('scan-status', 'Copied!', 'ok');
    setTimeout(() => setMsg('scan-status', scanStream ? '📷 Camera active…' : 'Camera is off.'), 2000);
  }).catch(() => alert('Could not copy.'));
}

function openScanResult() {
  const a = document.querySelector('#scan-result a');
  if (a) { window.open(a.href, '_blank', 'noopener,noreferrer'); }
  else   { alert('No URL detected in scan result.'); }
}

function clearScanResult() {
  const result = document.getElementById('scan-result');
  if (result) result.textContent = 'Waiting for scan…';
  scanHistory = [];
  renderScanHistory();
  setMsg('scan-status', scanStream ? '📷 Camera active…' : 'Camera is off.');
}

// ══════════════════════════════════════════════════════════
// BARCODE GENERATOR
// ══════════════════════════════════════════════════════════
const BC_FORMAT_HINTS = {
  CODE128: 'Encodes any ASCII text. Most flexible.',
  CODE39:  'Upper-case A-Z and 0-9. Allowed: - . $ / + % space',
  EAN13:   'Exactly 12 digits (13th is check digit).',
  EAN8:    'Exactly 7 digits.',
  UPC:     'Exactly 11 digits (UPC-A).',
  UPCE:    '6 digits (UPC-E compressed).',
  ITF14:   '13 digits + check digit.',
  ITF:     'Even number of digits.',
  pharmacode: 'Integer between 3 and 131070.',
  codabar: 'Starts and ends with A, B, C, or D.',
  EAN5:    '5 digits.',
  EAN2:    '2 digits.',
};

function bcFormatChanged() {
  const fmt  = document.getElementById('bc-format')?.value || 'CODE128';
  const hint = document.getElementById('bc-format-hint');
  if (hint) hint.textContent = BC_FORMAT_HINTS[fmt] || '';
  bcGenerate();
}

function bcGenerate() {
  const input    = document.getElementById('bc-input')?.value || '';
  const svgEl    = document.getElementById('bc-output');
  const hint     = document.getElementById('bc-hint');
  const msgEl    = document.getElementById('bc-msg');

  if (!input.trim()) {
    if (svgEl) svgEl.innerHTML = '';
    if (hint)  hint.textContent = 'Enter a value above to generate a barcode.';
    if (msgEl) msgEl.textContent = '';
    return;
  }

  const format      = document.getElementById('bc-format')?.value    || 'CODE128';
  const barWidth    = parseFloat(document.getElementById('bc-width')?.value) || 2;
  const barHeight   = parseInt(document.getElementById('bc-height')?.value)  || 100;
  const barColor    = document.getElementById('bc-color')?.value             || '#000000';
  const bgColor     = document.getElementById('bc-bg')?.value               || '#ffffff';
  const displayVal  = document.getElementById('bc-display-val')?.checked    ?? true;
  const flat        = document.getElementById('bc-flat')?.checked           ?? false;
  const fontSize    = parseInt(document.getElementById('bc-font-size')?.value) || 16;

  if (hint)  hint.textContent = '';
  if (msgEl) msgEl.textContent = '';

  try {
    JsBarcode(svgEl, input, {
      format,
      width:        barWidth,
      height:       barHeight,
      lineColor:    barColor,
      background:   bgColor,
      displayValue: displayVal,
      flat,
      fontSize,
      margin: 10,
      valid: () => {}
    });
  } catch (e) {
    if (svgEl) svgEl.innerHTML = '';
    if (hint)  hint.textContent = '';
    if (msgEl) {
      msgEl.textContent = `Error: ${e.message || 'invalid value for this format'}`;
      msgEl.className   = 'tool-msg err';
    }
  }
}

function bcUpdateWidth(val) {
  const lbl = document.getElementById('bc-width-lbl');
  if (lbl) lbl.textContent = val;
  bcGenerate();
}

function bcUpdateHeight(val) {
  const lbl = document.getElementById('bc-height-lbl');
  if (lbl) lbl.textContent = val + ' px';
  bcGenerate();
}

function bcDownloadSVG() {
  const svgEl = document.getElementById('bc-output');
  if (!svgEl || !svgEl.innerHTML) { alert('Generate a barcode first.'); return; }
  const svgData = new XMLSerializer().serializeToString(svgEl);
  downloadBlob(new Blob([svgData], { type: 'image/svg+xml' }), 'barcode_' + fmtDate() + '.svg');
}

function bcDownloadPNG() {
  const svgEl = document.getElementById('bc-output');
  if (!svgEl || !svgEl.innerHTML) { alert('Generate a barcode first.'); return; }

  const svgData = new XMLSerializer().serializeToString(svgEl);
  const img     = new Image();
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url     = URL.createObjectURL(svgBlob);

  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width  = img.width  || 400;
    canvas.height = img.height || 150;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob(blob => downloadBlob(blob, 'barcode_' + fmtDate() + '.png'), 'image/png');
  };
  img.src = url;
}

function bcClear() {
  const input = document.getElementById('bc-input');
  if (input) input.value = '';
  const svgEl = document.getElementById('bc-output');
  if (svgEl) svgEl.innerHTML = '';
  const hint  = document.getElementById('bc-hint');
  if (hint)   hint.textContent = 'Enter a value above to generate a barcode.';
  setMsg('bc-msg', '');
}

// ══════════════════════════════════════════════════════════
// BATCH BARCODE GENERATOR
// ══════════════════════════════════════════════════════════
function bcBatchGenerate() {
  const lines  = (document.getElementById('bcbatch-input')?.value || '')
    .split('\n').map(s => s.trim()).filter(Boolean);
  if (!lines.length) { alert('Enter at least one value.'); return; }

  const format = document.getElementById('bcbatch-format')?.value  || 'CODE128';
  const height = parseInt(document.getElementById('bcbatch-height')?.value) || 80;

  const grid = document.getElementById('bcbatch-results');
  if (!grid) return;
  grid.innerHTML = '';

  lines.forEach((line, idx) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'batch-item';
    const svgId = 'bcbatch-svg-' + idx;
    // Build elements safely — no innerHTML with user data
    const label = document.createElement('div');
    label.className  = 'batch-label';
    label.textContent = line;          // safe
    const svg   = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id      = svgId;
    const btn   = document.createElement('button');
    btn.textContent = '↓ SVG';
    btn.addEventListener('click', () => bcBatchDownload(svgId, encodeURIComponent(line)));
    wrapper.appendChild(label);
    wrapper.appendChild(svg);
    wrapper.appendChild(btn);
    grid.appendChild(wrapper);

    const svgEl = document.getElementById(svgId);
    try {
      JsBarcode(svgEl, line, { format, height, width: 2, margin: 8, displayValue: true, fontSize: 12 });
    } catch (e) {
      if (svgEl) svgEl.outerHTML = `<span style="color:#e05252;font-size:11px">Error: ${e.message}</span>`;
    }
  });
}

function bcBatchDownload(svgId, encodedLabel) {
  const svgEl = document.getElementById(svgId);
  if (!svgEl) return;
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const label   = decodeURIComponent(encodedLabel).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  downloadBlob(new Blob([svgData], { type: 'image/svg+xml' }), `bc_${label}.svg`);
}

function clearBcBatch() {
  const grid = document.getElementById('bcbatch-results');
  if (grid) grid.innerHTML = '';
  const inp  = document.getElementById('bcbatch-input');
  if (inp)   inp.value = '';
}

// ──────────────────────────────────────────
// Auto-generate toggles
// ──────────────────────────────────────────
let qrAutoGen = true;
let bcAutoGen = true;

function toggleQrAutoGen() {
  qrAutoGen = document.getElementById('qr-auto-gen')?.checked ?? true;
  const genBtn = document.getElementById('qr-gen-btn');
  if (genBtn) genBtn.style.display = qrAutoGen ? 'none' : '';
  // Update oninput handlers on all QR inputs
  document.querySelectorAll('.qr-input-block input, .qr-input-block textarea, #qr-ecl, #qr-dark, #qr-light, #qr-wifi-sec, #qr-wifi-hidden').forEach(el => {
    if (qrAutoGen) {
      el.setAttribute('oninput', 'qrGenerate()');
      el.setAttribute('onchange', 'qrGenerate()');
    } else {
      el.removeAttribute('oninput');
      el.removeAttribute('onchange');
    }
  });
}

function toggleBcAutoGen() {
  bcAutoGen = document.getElementById('bc-auto-gen')?.checked ?? true;
  const genBtn = document.getElementById('bc-gen-btn');
  if (genBtn) genBtn.style.display = bcAutoGen ? 'none' : '';
  const ids = ['bc-input', 'bc-color', 'bc-bg', 'bc-font-size'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (bcAutoGen) el.setAttribute('oninput', 'bcGenerate()');
    else el.removeAttribute('oninput');
  });
  document.querySelectorAll('#panel-barcode input[type=checkbox]').forEach(el => {
    if (bcAutoGen) el.setAttribute('onchange', 'bcGenerate()');
    else el.removeAttribute('onchange');
  });
}

// ──────────────────────────────────────────
// Init
// ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Pre-generate barcode with default value
  bcGenerate();
  // Show format hint for default
  bcFormatChanged();
  // Pre-generate QR with default URL
  qrGenerate();
});
