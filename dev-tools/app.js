'use strict';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PEPPY DEV TOOLS â€” COMBINED â€” app.js
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

/* â”€â”€ Tool labels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const ALL_TOOL_LABELS = {
  /* Encoding & Security */
  base64:    'Base64 Encoder / Decoder',
  url:       'URL Encoder / Decoder',
  hash:      'Hash Generator',
  password:  'Password Generator',
  uuid:      'UUID Generator',
  jwt:       'JWT Decoder',
  'html-ent':'HTML Entity Encoder / Decoder',
  /* Text Tools */
  diff:      'Text Diff Checker',
  sort:      'Text Sorter',
  dedup:     'Duplicate Line Remover',
  rand:      'Random String Generator',
  lorem:     'Lorem Ipsum Generator',
  stats:     'Text Statistics',
  /* JSON / Data */
  jf:        'JSON Formatter',
  jv:        'JSON Viewer (Tree)',
  jval:      'JSON Validator',
  jcsv:      'JSON â†’ CSV Converter',
  jy:        'JSON â†’ YAML Converter',
  yj:        'YAML â†’ JSON Converter',
  xf:        'XML Formatter',
  xj:        'XML â†’ JSON Converter',
  /* Colors */
  convert:   'Color Converter',
  picker:    'Color Picker',
  contrast:  'Contrast Checker (WCAG 2.1)',
  palette:   'Palette Generator',
  /* Timestamps */
  unix:      'Unix Timestamp Converter',
  calc:      'Date Calculator',
  format:    'Date Formatter',
  /* Regex */
  tester:    'Pattern Tester',
  replace:   'Find & Replace',
  ref:       'Reference',
};

/* â”€â”€ Tool â†’ Group mapping â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const TOOL_GROUP_MAP = {
  base64: 'encoding', url: 'encoding', hash: 'encoding',
  password: 'encoding', uuid: 'encoding', jwt: 'encoding', 'html-ent': 'encoding',
  diff: 'text', sort: 'text', dedup: 'text', rand: 'text', lorem: 'text', stats: 'text',
  jf: 'json', jv: 'json', jval: 'json', jcsv: 'json', jy: 'json', yj: 'json', xf: 'json', xj: 'json',
  convert: 'colors', picker: 'colors', contrast: 'colors', palette: 'colors',
  unix: 'time', calc: 'time', format: 'time',
  tester: 'regex', replace: 'regex', ref: 'regex',
};

/* â”€â”€ Tab navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function showTool(id) {
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('panel-' + id);
  if (panel) panel.classList.add('active');
  const btn = document.querySelector(`.tab-btn[data-tool="${id}"]`);
  if (btn) btn.classList.add('active');
  const sb = document.getElementById('sb-tool');
  if (sb) sb.textContent = ALL_TOOL_LABELS[id] || id;
  const grpId = TOOL_GROUP_MAP[id];
  if (grpId) setActiveGroup(grpId);
  closeMobileMenu();
}

function setActiveGroup(grpId) {
  document.querySelectorAll('.grp-nav-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.grp-nav-btn[data-grp="${grpId}"]`);
  if (btn) btn.classList.add('active');
}

function toggleGroup(grpId) {
  const grp = document.getElementById('grp-' + grpId);
  if (grp) grp.classList.toggle('collapsed');
}

function jumpGroup(grpId) {
  const grp = document.getElementById('grp-' + grpId);
  if (grp) {
    grp.classList.remove('collapsed');
    grp.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  setActiveGroup(grpId);
}

/* Theme, fullscreen, mobile menu loaded from shared-ui.js */

/* â”€â”€ Shared helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function setMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  clearTimeout(el._msgTimer);
  el.textContent = text;
  el.className   = 'tool-msg' + (type ? ' ' + type : '');
  if (text && (type === 'ok' || type === 'err')) {
    el._msgTimer = setTimeout(() => { el.textContent = ''; el.className = 'tool-msg'; }, 2500);
  }
}

function flashMsg(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.textContent = ''; }, 1500);
}

function _fbCopy(text, msgId) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    setMsg(msgId, 'Copied!', 'ok');
  } catch { setMsg(msgId, 'Copy failed', 'err'); }
}

function copyTA(taId, msgId) {
  const val = document.getElementById(taId)?.value;
  if (!val) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(val)
      .then(() => setMsg(msgId, 'Copied!', 'ok'))
      .catch(() => _fbCopy(val, msgId));
  } else {
    _fbCopy(val, msgId);
  }
}

function copyVal(spanId, msgId) {
  const text = document.getElementById(spanId)?.textContent;
  if (!text) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
      .then(() => setMsg(msgId, 'Copied!', 'ok'))
      .catch(() => _fbCopy(text, msgId));
  } else { _fbCopy(text, msgId); }
}

function copyEl(id, msgId) {
  const val = document.getElementById(id)?.textContent?.trim();
  if (!val) return;
  navigator.clipboard.writeText(val).then(() => flashMsg(msgId, 'Copied!'));
}

function copyText(text, msgId) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => setMsg(msgId, 'Copied ' + text, 'ok'));
  } else { _fbCopy(text, msgId); }
}

function writeClipboard(text, msgId) {
  const show = (ok) => {
    const el = document.getElementById(msgId);
    if (!el) return;
    el.textContent = ok ? 'Copied!' : 'Copy failed';
    el.className   = 'tool-msg ' + (ok ? 'ok' : 'err');
    setTimeout(() => { el.textContent = ''; el.className = 'tool-msg'; }, 2000);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => show(true)).catch(() => show(false));
  } else {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      show(true);
    } catch { show(false); }
  }
}

function copyOutput(outId, msgId) {
  const val = document.getElementById(outId)?.value;
  if (!val) return;
  writeClipboard(val, msgId);
}

function copyResult(inputId, msgId) {
  const val = document.getElementById(inputId)?.value;
  if (!val) return;
  writeClipboard(val, msgId);
}

function clearTool(inId, outId, msgId) {
  document.getElementById(inId).value  = '';
  document.getElementById(outId).value = '';
  const el = document.getElementById(msgId);
  if (el) { el.textContent = ''; el.className = 'tool-msg'; }
}

function swapIO(inId, outId) {
  const a = document.getElementById(inId).value;
  const b = document.getElementById(outId).value;
  document.getElementById(inId).value  = b;
  document.getElementById(outId).value = a;
}

function clearPair(inId, outId, msgId) {
  document.getElementById(inId).value  = '';
  document.getElementById(outId).value = '';
  setMsg(msgId, '', '');
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ENCODING TOOLS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

/* â”€â”€ Base64 â”€â”€ */
function b64Encode() {
  const input = document.getElementById('b64-in').value;
  try {
    const encoded = btoa(unescape(encodeURIComponent(input)));
    document.getElementById('b64-out').value = encoded;
    setMsg('b64-msg', '', '');
  } catch (err) {
    setMsg('b64-msg', 'Encode error: ' + err.message, 'err');
  }
}

function b64Decode() {
  const input = document.getElementById('b64-in').value.trim();
  try {
    const decoded = decodeURIComponent(escape(atob(input)));
    document.getElementById('b64-out').value = decoded;
    setMsg('b64-msg', '', '');
  } catch {
    setMsg('b64-msg', 'Invalid Base64 input', 'err');
  }
}

function b64Swap() {
  const a = document.getElementById('b64-in').value;
  const b = document.getElementById('b64-out').value;
  document.getElementById('b64-in').value  = b;
  document.getElementById('b64-out').value = a;
  setMsg('b64-msg', '', '');
}

/* â”€â”€ URL Encoder / Decoder â”€â”€ */
function urlEncode() {
  const input = document.getElementById('url-in').value;
  try {
    document.getElementById('url-out').value = encodeURIComponent(input);
    setMsg('url-msg', '', '');
  } catch (err) {
    setMsg('url-msg', 'Encode error: ' + err.message, 'err');
  }
}

function urlDecode() {
  const input = document.getElementById('url-in').value;
  try {
    document.getElementById('url-out').value = decodeURIComponent(input);
    setMsg('url-msg', '', '');
  } catch {
    setMsg('url-msg', 'Invalid URL-encoded input', 'err');
  }
}

function urlSwap() {
  const a = document.getElementById('url-in').value;
  const b = document.getElementById('url-out').value;
  document.getElementById('url-in').value  = b;
  document.getElementById('url-out').value = a;
  setMsg('url-msg', '', '');
}

/* â”€â”€ Hash Generator â”€â”€ */
function computeMD5(str) {
  function safeAdd(x, y) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function rol(n, c)               { return (n << c) | (n >>> (32 - c)); }
  function cmn(q, a, b, x, s, t)  { return safeAdd(rol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
  function ff(a,b,c,d,x,s,t) { return cmn((b & c) | (~b & d), a, b, x, s, t); }
  function gg(a,b,c,d,x,s,t) { return cmn((b & d) | (c & ~d), a, b, x, s, t); }
  function hh(a,b,c,d,x,s,t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a,b,c,d,x,s,t) { return cmn(c ^ (b | ~d), a, b, x, s, t); }

  const utf8 = unescape(encodeURIComponent(str));
  const len  = utf8.length;
  const W    = [];
  for (let i = 0; i < len; i++) W[i >> 2] |= (utf8.charCodeAt(i) & 0xff) << (i % 4 * 8);
  W[len >> 2] |= 0x80 << (len % 4 * 8);
  W[(((len + 64) >>> 9) << 4) + 14] = len * 8;

  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;

  for (let i = 0; i < W.length; i += 16) {
    const [oa, ob, oc, od] = [a, b, c, d];
    const m = j => W[i + j] | 0;
    a=ff(a,b,c,d,m(0), 7,-680876936);  b=ff(d,a,b,c,m(1), 12,-389564586); c=ff(c,d,a,b,m(2), 17,606105819);   d=ff(b,c,d,a,m(3), 22,-1044525330);
    a=ff(a,b,c,d,m(4), 7,-176418897);  b=ff(d,a,b,c,m(5), 12,1200080426); c=ff(c,d,a,b,m(6), 17,-1473231341); d=ff(b,c,d,a,m(7), 22,-45705983);
    a=ff(a,b,c,d,m(8), 7,1770035416);  b=ff(d,a,b,c,m(9), 12,-1958414417);c=ff(c,d,a,b,m(10),17,-42063);       d=ff(b,c,d,a,m(11),22,-1990404162);
    a=ff(a,b,c,d,m(12),7,1804603682);  b=ff(d,a,b,c,m(13),12,-40341101);  c=ff(c,d,a,b,m(14),17,-1502002290); d=ff(b,c,d,a,m(15),22,1236535329);
    a=gg(a,b,c,d,m(1), 5,-165796510);  b=gg(d,a,b,c,m(6), 9,-1069501632); c=gg(c,d,a,b,m(11),14,643717713);  d=gg(b,c,d,a,m(0), 20,-373897302);
    a=gg(a,b,c,d,m(5), 5,-701558691);  b=gg(d,a,b,c,m(10),9,38016083);    c=gg(c,d,a,b,m(15),14,-660478335); d=gg(b,c,d,a,m(4), 20,-405537848);
    a=gg(a,b,c,d,m(9), 5,568446438);   b=gg(d,a,b,c,m(14),9,-1019803690); c=gg(c,d,a,b,m(3), 14,-187363961); d=gg(b,c,d,a,m(8), 20,1163531501);
    a=gg(a,b,c,d,m(13),5,-1444681467); b=gg(d,a,b,c,m(2), 9,-51403784);   c=gg(c,d,a,b,m(7), 14,1735328473); d=gg(b,c,d,a,m(12),20,-1926607734);
    a=hh(a,b,c,d,m(5), 4,-378558);     b=hh(d,a,b,c,m(8), 11,-2022574463);c=hh(c,d,a,b,m(11),16,1839030562); d=hh(b,c,d,a,m(14),23,-35309556);
    a=hh(a,b,c,d,m(1), 4,-1530992060); b=hh(d,a,b,c,m(4), 11,1272893353); c=hh(c,d,a,b,m(7), 16,-155497632); d=hh(b,c,d,a,m(10),23,-1094730640);
    a=hh(a,b,c,d,m(13),4,681279174);   b=hh(d,a,b,c,m(0), 11,-358537222); c=hh(c,d,a,b,m(3), 16,-722521979); d=hh(b,c,d,a,m(6), 23,76029189);
    a=hh(a,b,c,d,m(9), 4,-640364487);  b=hh(d,a,b,c,m(12),11,-421815835); c=hh(c,d,a,b,m(15),16,530742520);  d=hh(b,c,d,a,m(2), 23,-995338651);
    a=ii(a,b,c,d,m(0), 6,-198630844);  b=ii(d,a,b,c,m(7), 10,1126891415); c=ii(c,d,a,b,m(14),15,-1416354905);d=ii(b,c,d,a,m(5), 21,-57434055);
    a=ii(a,b,c,d,m(12),6,1700485571);  b=ii(d,a,b,c,m(3), 10,-1894986606);c=ii(c,d,a,b,m(10),15,-1051523);   d=ii(b,c,d,a,m(1), 21,-2054922799);
    a=ii(a,b,c,d,m(8), 6,1873313359);  b=ii(d,a,b,c,m(15),10,-30611744);  c=ii(c,d,a,b,m(6), 15,-1560198380);d=ii(b,c,d,a,m(13),21,1309151649);
    a=ii(a,b,c,d,m(4), 6,-145523070);  b=ii(d,a,b,c,m(11),10,-1120210379);c=ii(c,d,a,b,m(2), 15,718787259);  d=ii(b,c,d,a,m(9), 21,-343485551);
    a=safeAdd(a,oa); b=safeAdd(b,ob); c=safeAdd(c,oc); d=safeAdd(d,od);
  }
  const h2 = n => { let s=''; for(let j=0;j<4;j++) s+=('0'+((n>>>(j*8))&0xff).toString(16)).slice(-2); return s; };
  return h2(a) + h2(b) + h2(c) + h2(d);
}

async function computeSHA(algo, str) {
  const enc  = new TextEncoder();
  const buf  = await crypto.subtle.digest(algo, enc.encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function computeHash() {
  const input = document.getElementById('hash-in').value;
  const algo  = document.querySelector('input[name="hash-algo"]:checked').value;
  if (!input) { setMsg('hash-msg', 'Enter some text first', 'err'); return; }
  try {
    let result;
    if (algo === 'MD5') {
      result = computeMD5(input);
    } else {
      result = await computeSHA(algo, input);
    }
    document.getElementById('hash-out').value = result;
    setMsg('hash-msg', algo + ' Â· ' + (result.length * 4) + ' bits', 'ok');
  } catch (err) {
    setMsg('hash-msg', 'Error: ' + err.message, 'err');
  }
}

/* â”€â”€ Password Generator â”€â”€ */
const AMBIGUOUS = new Set([...'0Ol1I']);

function generatePassword() {
  const len       = parseInt(document.getElementById('pwd-len').value, 10);
  const useUpper  = document.getElementById('pwd-upper').checked;
  const useLower  = document.getElementById('pwd-lower').checked;
  const useDigits = document.getElementById('pwd-digits').checked;
  const useSyms   = document.getElementById('pwd-symbols').checked;
  const noAmbig   = document.getElementById('pwd-noambig').checked;

  const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower   = 'abcdefghijklmnopqrstuvwxyz';
  const digits  = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?/~';

  let charset = '';
  if (useUpper)  charset += upper;
  if (useLower)  charset += lower;
  if (useDigits) charset += digits;
  if (useSyms)   charset += symbols;
  if (noAmbig) charset = [...charset].filter(c => !AMBIGUOUS.has(c)).join('');
  if (!charset) { setMsg('pwd-msg', 'Select at least one character set', 'err'); return; }

  const arr = new Uint32Array(len * 2);
  crypto.getRandomValues(arr);
  let pwd = '';
  let i   = 0;
  while (pwd.length < len) {
    pwd += charset[arr[i++] % charset.length];
    if (i >= arr.length) { crypto.getRandomValues(arr); i = 0; }
  }

  const required = [];
  if (useUpper)  { const c = [...upper].filter(x => !noAmbig || !AMBIGUOUS.has(x));  if (c.length) required.push(c); }
  if (useLower)  { const c = [...lower].filter(x => !noAmbig || !AMBIGUOUS.has(x));  if (c.length) required.push(c); }
  if (useDigits) { const c = [...digits].filter(x => !noAmbig || !AMBIGUOUS.has(x)); if (c.length) required.push(c); }
  if (useSyms)   { const c = [...symbols].filter(x => !noAmbig || !AMBIGUOUS.has(x));if (c.length) required.push(c); }

  const rndByte = () => { const b = new Uint32Array(1); crypto.getRandomValues(b); return b[0]; };
  const pwdArr  = [...pwd];
  required.forEach((set) => {
    const pos  = rndByte() % len;
    pwdArr[pos] = set[rndByte() % set.length];
  });
  pwd = pwdArr.join('');

  document.getElementById('pwd-out').value = pwd;
  updateStrength(pwd);
  setMsg('pwd-msg', '', '');
}

function updateStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (pwd.length >= 16) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  const levels = [
    { label: 'Very Weak',   color: '#dc2626', pct: 14 },
    { label: 'Weak',        color: '#ea580c', pct: 28 },
    { label: 'Fair',        color: '#ca8a04', pct: 43 },
    { label: 'Good',        color: '#65a30d', pct: 57 },
    { label: 'Strong',      color: '#16a34a', pct: 71 },
    { label: 'Very Strong', color: '#15803d', pct: 85 },
    { label: 'Excellent',   color: '#166534', pct: 100 },
  ];
  const lvl  = levels[Math.min(score, levels.length - 1)];
  const fill = document.getElementById('strength-fill');
  fill.style.width      = lvl.pct + '%';
  fill.style.background = lvl.color;
  document.getElementById('strength-label').textContent = lvl.label;
}

/* â”€â”€ UUID Generator â”€â”€ */
function generateUUIDs() {
  const ver   = document.querySelector('input[name="uuid-ver"]:checked').value;
  const count = Math.min(100, Math.max(1, parseInt(document.getElementById('uuid-count').value, 10) || 1));
  const lines = [];

  for (let i = 0; i < count; i++) {
    if (ver === 'nil') {
      lines.push('00000000-0000-0000-0000-000000000000');
    } else {
      if (crypto.randomUUID) {
        lines.push(crypto.randomUUID());
      } else {
        const buf = new Uint8Array(16);
        crypto.getRandomValues(buf);
        buf[6] = (buf[6] & 0x0f) | 0x40;
        buf[8] = (buf[8] & 0x3f) | 0x80;
        const hex = Array.from(buf).map(b => b.toString(16).padStart(2,'0')).join('');
        lines.push(`${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`);
      }
    }
  }

  const existing = document.getElementById('uuid-out').value;
  document.getElementById('uuid-out').value = existing ? existing + '\n' + lines.join('\n') : lines.join('\n');
  setMsg('uuid-msg', `Generated ${count} UUID${count !== 1 ? 's' : ''}`, 'ok');
}

function clearUUIDs() {
  document.getElementById('uuid-out').value = '';
  setMsg('uuid-msg', '', '');
}

/* â”€â”€ JWT Decoder â”€â”€ */
function decodeJWT() {
  const raw    = document.getElementById('jwt-in').value.trim();
  const result = document.getElementById('jwt-result');
  const msgEl  = document.getElementById('jwt-msg');

  if (!raw) { result.style.display = 'none'; msgEl.textContent = ''; return; }

  const parts = raw.split('.');
  if (parts.length !== 3) {
    result.style.display = 'none';
    msgEl.textContent    = 'Invalid JWT â€” expected 3 dot-separated parts';
    msgEl.className      = 'tool-msg err';
    return;
  }

  function b64UrlDecode(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    try { return decodeURIComponent(escape(atob(s))); }
    catch { return null; }
  }

  function prettyJSON(s) {
    try { return JSON.stringify(JSON.parse(s), null, 2); }
    catch { return s; }
  }

  const headerRaw  = b64UrlDecode(parts[0]);
  const payloadRaw = b64UrlDecode(parts[1]);

  if (headerRaw === null || payloadRaw === null) {
    result.style.display = 'none';
    msgEl.textContent    = 'Could not decode â€” invalid Base64url encoding';
    msgEl.className      = 'tool-msg err';
    return;
  }

  document.getElementById('jwt-header').textContent  = prettyJSON(headerRaw);
  document.getElementById('jwt-payload').textContent = prettyJSON(payloadRaw);
  result.style.display = 'flex';
  msgEl.textContent    = '';
}

/* â”€â”€ HTML Entity Encoder / Decoder â”€â”€ */
function hentEncode() {
  const input = document.getElementById('hent-in').value;
  const div   = document.createElement('div');
  div.appendChild(document.createTextNode(input));
  document.getElementById('hent-out').value = div.innerHTML;
  setMsg('hent-msg', 'Encoded', 'ok');
}

function hentDecode() {
  const input = document.getElementById('hent-in').value;
  // Safe: uses a detached (never-attached-to-DOM) element so no scripts
  // or event handlers execute; only the parsed text content is extracted.
  const div   = document.createElement('div');
  div.innerHTML = input;
  document.getElementById('hent-out').value = div.textContent;
  setMsg('hent-msg', 'Decoded', 'ok');
}

function hentSwap() {
  const i = document.getElementById('hent-in');
  const o = document.getElementById('hent-out');
  const tmp = i.value;
  i.value = o.value;
  o.value = tmp;
  setMsg('hent-msg', '', '');
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TEXT TOOLS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

let _diffScrolling = false;

function syncDiffScroll(side) {
  if (_diffScrolling) return;
  _diffScrolling = true;
  const from = document.getElementById(side === 'left' ? 'diff-left' : 'diff-right');
  const to   = document.getElementById(side === 'left' ? 'diff-right' : 'diff-left');
  to.scrollTop  = from.scrollTop;
  to.scrollLeft = from.scrollLeft;
  _diffScrolling = false;
}

function runDiff() {
  const textA  = document.getElementById('diff-a').value;
  const textB  = document.getElementById('diff-b').value;
  const linesA = textA.split('\n');
  const linesB = textB.split('\n');

  if (linesA.length * linesB.length > 100000) {
    document.getElementById('diff-stats').innerHTML =
      '<span style="color:#c00">Texts too large for diff (reduce to ~300 lines each)</span>';
    return;
  }

  const ops = lcsLineDiff(linesA, linesB);
  let leftHTML  = '', rightHTML = '';
  let leftLine  = 1,  rightLine = 1;
  let added = 0, removed = 0;
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  for (const op of ops) {
    if (op.type === 'same') {
      leftHTML  += `<div class="diff-line"><span class="diff-ln">${leftLine++}</span><span class="diff-text">${esc(op.a)}</span></div>`;
      rightHTML += `<div class="diff-line"><span class="diff-ln">${rightLine++}</span><span class="diff-text">${esc(op.b)}</span></div>`;
    } else if (op.type === 'removed') {
      leftHTML  += `<div class="diff-line removed"><span class="diff-ln">${leftLine++}</span><span class="diff-text">${esc(op.a)}</span></div>`;
      rightHTML += `<div class="diff-line empty"><span class="diff-ln">&nbsp;</span><span class="diff-text"></span></div>`;
      removed++;
    } else {
      leftHTML  += `<div class="diff-line empty"><span class="diff-ln">&nbsp;</span><span class="diff-text"></span></div>`;
      rightHTML += `<div class="diff-line added"><span class="diff-ln">${rightLine++}</span><span class="diff-text">${esc(op.b)}</span></div>`;
      added++;
    }
  }

  document.getElementById('diff-left').innerHTML  = leftHTML;
  document.getElementById('diff-right').innerHTML = rightHTML;
  document.getElementById('diff-output').style.display = '';

  const stats = document.getElementById('diff-stats');
  if (added === 0 && removed === 0) {
    stats.innerHTML = 'Texts are identical &#10003;';
  } else {
    stats.innerHTML =
      `<span class="added-stat">+${added} added</span> &nbsp; <span class="removed-stat">-${removed} removed</span>`;
  }
}

function clearDiff() {
  document.getElementById('diff-a').value = '';
  document.getElementById('diff-b').value = '';
  document.getElementById('diff-left').innerHTML  = '';
  document.getElementById('diff-right').innerHTML = '';
  document.getElementById('diff-output').style.display = 'none';
  document.getElementById('diff-stats').innerHTML = '';
}

function lcsLineDiff(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1]);
    }
  }
  const ops = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i-1] === b[j-1]) {
      ops.unshift({ type: 'same', a: a[i-1], b: b[j-1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      ops.unshift({ type: 'added', b: b[j-1] });
      j--;
    } else {
      ops.unshift({ type: 'removed', a: a[i-1] });
      i--;
    }
  }
  return ops;
}

function sortLines() {
  const input    = document.getElementById('sort-input').value;
  const mode     = document.getElementById('sort-mode').value;
  const caseSens = document.getElementById('sort-case').checked;
  const rmEmpty  = document.getElementById('sort-rm-empty').checked;
  const unique   = document.getElementById('sort-unique').checked;

  let lines = input.split('\n');
  if (rmEmpty) lines = lines.filter(l => l.trim() !== '');
  if (unique) {
    const seen = new Set();
    lines = lines.filter(l => {
      const key = caseSens ? l : l.toLowerCase();
      return seen.has(key) ? false : (seen.add(key), true);
    });
  }

  if (mode !== 'random') {
    lines.sort((a, b) => {
      if (mode === 'numeric') {
        const na = parseFloat(a), nb = parseFloat(b);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
      }
      const x = caseSens ? a : a.toLowerCase();
      const y = caseSens ? b : b.toLowerCase();
      if (mode === 'length-asc')  return a.length - b.length || x.localeCompare(y);
      if (mode === 'length-desc') return b.length - a.length || x.localeCompare(y);
      if (mode === 'alpha-desc')  return y.localeCompare(x);
      return x.localeCompare(y);
    });
  } else {
    for (let i = lines.length - 1; i > 0; i--) {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      const j = buf[0] % (i + 1);
      [lines[i], lines[j]] = [lines[j], lines[i]];
    }
  }

  document.getElementById('sort-output').value = lines.join('\n');
  setMsg('sort-msg', `${lines.length} line${lines.length !== 1 ? 's' : ''}`, 'ok');
}

function removeDuplicates() {
  const input    = document.getElementById('dedup-input').value;
  const caseSens = document.getElementById('dedup-case').checked;
  const trim     = document.getElementById('dedup-trim').checked;
  const rmBlank  = document.getElementById('dedup-rm-blank').checked;

  const lines  = input.split('\n');
  const seen   = new Set();
  const result = [];

  for (const line of lines) {
    if (rmBlank && line.trim() === '') continue;
    const key       = trim ? line.trim() : line;
    const lookupKey = caseSens ? key : key.toLowerCase();
    if (!seen.has(lookupKey)) {
      seen.add(lookupKey);
      result.push(line);
    }
  }

  const removed = lines.length - result.length;
  document.getElementById('dedup-output').value = result.join('\n');
  setMsg('dedup-msg', `Removed ${removed} duplicate${removed !== 1 ? 's' : ''}`, 'ok');
}

function generateRandom() {
  const length     = Math.min(4096, Math.max(1, parseInt(document.getElementById('rand-length').value, 10) || 16));
  const count      = Math.min(1000, Math.max(1, parseInt(document.getElementById('rand-count').value, 10)  || 1));
  const useUpper   = document.getElementById('rand-upper').checked;
  const useLower   = document.getElementById('rand-lower').checked;
  const useDigits  = document.getElementById('rand-digits').checked;
  const useSymbols = document.getElementById('rand-symbols').checked;
  const custom     = document.getElementById('rand-custom').value;

  let charset = '';
  if (useUpper)   charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (useLower)   charset += 'abcdefghijklmnopqrstuvwxyz';
  if (useDigits)  charset += '0123456789';
  if (useSymbols) charset += '!@#$%^&*()-_=+[]{}|;:,.<>?/~`';
  charset += custom;
  charset = [...new Set(charset)].join('');

  if (!charset) { setMsg('rand-msg', 'Select at least one character type', 'err'); return; }

  const results = [];
  const buf = new Uint32Array(length);
  for (let c = 0; c < count; c++) {
    crypto.getRandomValues(buf);
    let str = '';
    for (let i = 0; i < length; i++) str += charset[buf[i] % charset.length];
    results.push(str);
  }

  document.getElementById('rand-output').value = results.join('\n');
  setMsg('rand-msg', `${count} string${count !== 1 ? 's' : ''} generated`, 'ok');
}

/* â”€â”€ Lorem Ipsum â”€â”€ */
const LOREM_WORDS = [
  'lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit',
  'sed','do','eiusmod','tempor','incididunt','ut','labore','et','dolore',
  'magna','aliqua','enim','ad','minim','veniam','quis','nostrud',
  'exercitation','ullamco','laboris','nisi','aliquip','ex','ea','commodo',
  'consequat','duis','aute','irure','in','reprehenderit','voluptate',
  'velit','esse','cillum','fugiat','nulla','pariatur','excepteur','sint',
  'occaecat','cupidatat','non','proident','sunt','culpa','qui','officia',
  'deserunt','mollit','anim','id','est','laborum','at','vero','eos',
  'accusamus','iusto','odio','dignissimos','ducimus','blanditiis',
  'praesentium','voluptatum','deleniti','atque','corrupti','quos','quas',
  'molestias','excepturi','occaecati','cupiditate','impedit','quo','minus',
  'maxime','placeat','facere','possimus','omnis','voluptas','assumenda',
  'repellendus','temporibus','autem','quibusdam','officiis','debitis',
  'rerum','necessitatibus','saepe','eveniet','voluptates','repudiandae',
  'recusandae','itaque','earum','hic','tenetur','sapiente','delectus',
  'reiciendis','voluptatibus','maiores','alias','consequatur','aut',
  'perferendis','doloribus','asperiores','repellat',
];
const LOREM_START = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

function loremWord() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return LOREM_WORDS[buf[0] % LOREM_WORDS.length];
}

function loremSentence() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const len   = 8 + (buf[0] % 10);
  const words = [];
  for (let i = 0; i < len; i++) words.push(loremWord());
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(' ') + '.';
}

function loremParagraph() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const count = 3 + (buf[0] % 5);
  const sents = [];
  for (let i = 0; i < count; i++) sents.push(loremSentence());
  return sents.join(' ');
}

function generateLorem() {
  const type      = document.getElementById('lorem-type').value;
  const count     = Math.min(500, Math.max(1, parseInt(document.getElementById('lorem-count').value, 10) || 3));
  const withStart = document.getElementById('lorem-start').checked;
  const parts     = [];
  for (let i = 0; i < count; i++) {
    if (type === 'words')     parts.push(loremWord());
    else if (type === 'sentences') parts.push(loremSentence());
    else parts.push(loremParagraph());
  }
  let result;
  if (type === 'words') {
    result = parts.join(' ');
    if (withStart) result = 'Lorem ipsum ' + result;
    result = result.charAt(0).toUpperCase() + result.slice(1);
  } else if (type === 'sentences') {
    if (withStart) parts[0] = LOREM_START;
    result = parts.join(' ');
  } else {
    if (withStart) parts[0] = LOREM_START + ' ' + parts[0];
    result = parts.join('\n\n');
  }
  document.getElementById('lorem-output').value = result;
  setMsg('lorem-msg', `Generated ${count} ${type}`, 'ok');
}

function analyzeText() {
  const text = document.getElementById('stats-in').value;
  const out  = document.getElementById('stats-out');
  const freq = document.getElementById('stats-freq');

  if (!text.trim()) {
    out.style.display  = 'none';
    freq.style.display = 'none';
    return;
  }

  const chars   = text.length;
  const noSpace = text.replace(/\s/g, '').length;
  const words   = (text.match(/\b\w+\b/g) || []);
  const wordCnt = words.length;
  const sents   = (text.match(/[^.!?]*[.!?]+/g) || []).length || (text.trim() ? 1 : 0);
  const paras   = text.split(/\n\s*\n/).filter(p => p.trim()).length || (text.trim() ? 1 : 0);
  const lines   = text.split('\n').length;
  const readSec = Math.ceil(wordCnt / (200 / 60));
  const mins    = Math.floor(readSec / 60);
  const secs    = readSec % 60;
  const readStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  const avgWord = wordCnt > 0 ? (words.reduce((s, w) => s + w.length, 0) / wordCnt).toFixed(1) : '0';

  document.getElementById('st-chars').textContent   = chars.toLocaleString();
  document.getElementById('st-nospace').textContent = noSpace.toLocaleString();
  document.getElementById('st-words').textContent   = wordCnt.toLocaleString();
  document.getElementById('st-sents').textContent   = sents.toLocaleString();
  document.getElementById('st-paras').textContent   = paras.toLocaleString();
  document.getElementById('st-lines').textContent   = lines.toLocaleString();
  document.getElementById('st-read').textContent    = readStr;
  document.getElementById('st-avgw').textContent    = avgWord;
  out.style.display = 'grid';

  const freq_map = {};
  for (const w of words) {
    const lc = w.toLowerCase();
    freq_map[lc] = (freq_map[lc] || 0) + 1;
  }
  const sorted = Object.entries(freq_map).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxCnt = sorted[0]?.[1] || 1;
  const list   = document.getElementById('stats-freq-list');
  list.innerHTML = sorted.map(([word, count]) => {
    const pct = Math.round((count / maxCnt) * 100);
    return `<div class="freq-row">
      <span class="freq-word">${word}</span>
      <div class="freq-bar-wrap"><div class="freq-bar" style="width:${pct}%"></div></div>
      <span class="freq-count">${count}</span>
    </div>`;
  }).join('');
  freq.style.display = 'block';
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   JSON / YAML / XML
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function jsonFormat() {
  const input  = document.getElementById('jf-input').value.trim();
  const indent = document.getElementById('jf-indent').value;
  if (!input) { setMsg('jf-msg', 'No input', 'err'); return; }
  try {
    const indentVal = indent === 'tab' ? '\t' : parseInt(indent, 10);
    document.getElementById('jf-output').value = JSON.stringify(JSON.parse(input), null, indentVal);
    setMsg('jf-msg', 'Formatted \u2713', 'ok');
  } catch (e) { setMsg('jf-msg', 'Parse error: ' + e.message, 'err'); }
}

function jsonMinify() {
  const input = document.getElementById('jf-input').value.trim();
  if (!input) { setMsg('jf-msg', 'No input', 'err'); return; }
  try {
    document.getElementById('jf-output').value = JSON.stringify(JSON.parse(input));
    setMsg('jf-msg', 'Minified \u2713', 'ok');
  } catch (e) { setMsg('jf-msg', 'Parse error: ' + e.message, 'err'); }
}

function jsonViewTree() {
  const input     = document.getElementById('jv-input').value.trim();
  const container = document.getElementById('jv-tree');
  if (!input) { container.innerHTML = ''; return; }
  try {
    container.innerHTML = '';
    container.appendChild(buildTreeNode(JSON.parse(input), null));
    setMsg('jv-msg', 'Parsed \u2713', 'ok');
  } catch (e) { setMsg('jv-msg', 'Parse error: ' + e.message, 'err'); }
}

function jsonExpandAll() {
  document.querySelectorAll('#jv-tree .jt-toggle').forEach(btn => {
    if (btn.textContent === 'â–¸') btn.click();
  });
}

function jsonCollapseAll() {
  document.querySelectorAll('#jv-tree .jt-toggle').forEach(btn => {
    if (btn.textContent === 'â–¾') btn.click();
  });
}

function clearTree() {
  document.getElementById('jv-input').value = '';
  document.getElementById('jv-tree').innerHTML = '';
  setMsg('jv-msg', '', '');
}

function mkSpan(cls, text) {
  const el = document.createElement('span');
  el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

function buildTreeNode(value, key) {
  const el = document.createElement('div');
  el.className = 'jt-node';
  if (value === null || typeof value !== 'object') {
    const line = document.createElement('div');
    line.className = 'jt-line';
    if (key !== null && key !== undefined) {
      line.appendChild(mkSpan('jt-key', '"' + String(key) + '"'));
      line.appendChild(mkSpan('jt-colon', ': '));
    }
    line.appendChild(makePrimSpan(value));
    el.appendChild(line);
    return el;
  }
  const isArr  = Array.isArray(value);
  const entries = isArr ? value.map((v, i) => [i, v]) : Object.entries(value);
  const openBr  = isArr ? '[' : '{';
  const closeBr = isArr ? ']' : '}';
  const header = document.createElement('div');
  header.className = 'jt-line';
  let toggle = null, childContainer = null, closeEl = null, countEl = null;
  if (entries.length > 0) {
    toggle = document.createElement('button');
    toggle.className = 'jt-toggle';
    toggle.textContent = 'â–¾';
    header.appendChild(toggle);
  }
  if (key !== null && key !== undefined) {
    header.appendChild(mkSpan('jt-key', '"' + String(key) + '"'));
    header.appendChild(mkSpan('jt-colon', ': '));
  }
  header.appendChild(mkSpan('jt-bracket', openBr));
  if (entries.length === 0) {
    header.appendChild(mkSpan('jt-bracket', closeBr));
    el.appendChild(header);
    return el;
  }
  countEl = mkSpan('jt-count',
    ` // ${entries.length} ${isArr ? 'item' : 'key'}${entries.length !== 1 ? 's' : ''}`);
  header.appendChild(countEl);
  el.appendChild(header);
  childContainer = document.createElement('div');
  childContainer.className = 'jt-children';
  for (const [k, v] of entries) childContainer.appendChild(buildTreeNode(v, isArr ? null : k));
  closeEl = document.createElement('div');
  closeEl.className = 'jt-close';
  closeEl.appendChild(mkSpan('jt-bracket', closeBr));
  el.appendChild(childContainer);
  el.appendChild(closeEl);
  toggle.addEventListener('click', () => {
    const isOpen = toggle.textContent === 'â–¾';
    toggle.textContent = isOpen ? 'â–¸' : 'â–¾';
    childContainer.style.display = isOpen ? 'none' : '';
    closeEl.style.display        = isOpen ? 'none' : '';
    countEl.textContent = isOpen
      ? ` // ${entries.length} ${isArr ? 'item' : 'key'}${entries.length !== 1 ? 's' : ''} (collapsed)`
      : ` // ${entries.length} ${isArr ? 'item' : 'key'}${entries.length !== 1 ? 's' : ''}`;
  });
  return el;
}

function makePrimSpan(v) {
  if (v === null) return mkSpan('jt-null', 'null');
  if (typeof v === 'string') {
    const display = v.length > 150 ? v.slice(0, 150) + '\u2026' : v;
    const el = mkSpan('jt-string', '"' + display + '"');
    if (v.length > 150) el.title = v;
    return el;
  }
  if (typeof v === 'number')  return mkSpan('jt-number', String(v));
  if (typeof v === 'boolean') return mkSpan('jt-boolean', String(v));
  return mkSpan('jt-null', 'null');
}

let _validTimer = null;

function jsonValidateLive() {
  clearTimeout(_validTimer);
  _validTimer = setTimeout(jsonValidate, 400);
}

function jsonValidate() {
  const input  = document.getElementById('jval-input').value.trim();
  const result = document.getElementById('jval-result');
  if (!input) { result.style.display = 'none'; return; }
  try {
    const parsed = JSON.parse(input);
    const type   = Array.isArray(parsed) ? 'array' : typeof parsed;
    const keys   = type === 'object' && parsed !== null ? Object.keys(parsed).length : null;
    result.className   = 'validator-result ok';
    result.textContent = '\u2713 Valid JSON  \u2014  Type: ' + type
      + (keys !== null ? '  \u2014  ' + keys + ' top-level key' + (keys !== 1 ? 's' : '') : '');
  } catch (e) {
    result.className   = 'validator-result err';
    result.textContent = '\u2717 Invalid JSON: ' + e.message;
  }
  result.style.display = '';
}

function jsonToCSV() {
  const input = document.getElementById('jcsv-input').value.trim();
  if (!input) { setMsg('jcsv-msg', 'No input', 'err'); return; }
  try {
    const data = JSON.parse(input);
    if (!Array.isArray(data)) { setMsg('jcsv-msg', 'Input must be a JSON array', 'err'); return; }
    if (data.length === 0)    { setMsg('jcsv-msg', 'Array is empty', 'err'); return; }
    const keySet = new Set();
    for (const row of data) {
      if (row && typeof row === 'object' && !Array.isArray(row)) {
        for (const k of Object.keys(row)) keySet.add(k);
      }
    }
    const keys    = [...keySet];
    const csvRows = [keys.map(csvEscape).join(',')];
    for (const row of data) {
      const vals = keys.map(k => {
        const v = (row && typeof row === 'object') ? row[k] : undefined;
        if (v === undefined || v === null) return '';
        if (typeof v === 'object') return csvEscape(JSON.stringify(v));
        return csvEscape(String(v));
      });
      csvRows.push(vals.join(','));
    }
    document.getElementById('jcsv-output').value = csvRows.join('\n');
    setMsg('jcsv-msg', `${data.length} row${data.length !== 1 ? 's' : ''} converted \u2713`, 'ok');
  } catch (e) { setMsg('jcsv-msg', 'Parse error: ' + e.message, 'err'); }
}

function csvEscape(value) {
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function jsonToYAML() {
  const input = document.getElementById('jy-input').value.trim();
  if (!input) { setMsg('jy-msg', 'No input', 'err'); return; }
  if (typeof jsyaml === 'undefined') {
    setMsg('jy-msg', 'js-yaml library failed to load', 'err');
    return;
  }
  try {
    const obj = JSON.parse(input);
    document.getElementById('jy-output').value = jsyaml.dump(obj, { lineWidth: -1 });
    setMsg('jy-msg', 'Converted \u2713', 'ok');
  } catch (e) { setMsg('jy-msg', 'Parse error: ' + e.message, 'err'); }
}

function yamlToJSON() {
  const input = document.getElementById('yj-input').value.trim();
  if (!input) { setMsg('yj-msg', 'No input', 'err'); return; }
  if (typeof jsyaml === 'undefined') {
    setMsg('yj-msg', 'js-yaml library failed to load â€” check internet connection', 'err');
    return;
  }
  try {
    document.getElementById('yj-output').value = JSON.stringify(jsyaml.load(input), null, 2);
    setMsg('yj-msg', 'Converted \u2713', 'ok');
  } catch (e) { setMsg('yj-msg', 'YAML parse error: ' + e.message, 'err'); }
}

function xmlFormat() {
  const input    = document.getElementById('xf-input').value.trim();
  const indent   = document.getElementById('xf-indent').value;
  if (!input) { setMsg('xf-msg', 'No input', 'err'); return; }
  const indentStr = indent === 'tab' ? '\t' : ' '.repeat(parseInt(indent, 10));
  try {
    const doc = new DOMParser().parseFromString(input, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) { setMsg('xf-msg', 'XML error: ' + err.textContent.split('\n')[0], 'err'); return; }
    const lines = [];
    formatXMLNode(doc.documentElement, indentStr, 0, lines);
    document.getElementById('xf-output').value = lines.join('\n');
    setMsg('xf-msg', 'Formatted \u2713', 'ok');
  } catch (e) { setMsg('xf-msg', 'Error: ' + e.message, 'err'); }
}

function xmlMinify() {
  const input = document.getElementById('xf-input').value.trim();
  if (!input) { setMsg('xf-msg', 'No input', 'err'); return; }
  try {
    const doc = new DOMParser().parseFromString(input, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) { setMsg('xf-msg', 'XML error: ' + err.textContent.split('\n')[0], 'err'); return; }
    document.getElementById('xf-output').value = new XMLSerializer().serializeToString(doc).replace(/>\s+</g, '><');
    setMsg('xf-msg', 'Minified \u2713', 'ok');
  } catch (e) { setMsg('xf-msg', 'Error: ' + e.message, 'err'); }
}

function formatXMLNode(node, indent, level, lines) {
  const pad = indent.repeat(level);
  if (node.nodeType === 3) {
    const text = node.textContent.trim();
    if (text) lines.push(pad + escXML(text));
    return;
  }
  if (node.nodeType === 8) {
    lines.push(pad + '<!-- ' + node.textContent.trim() + ' -->');
    return;
  }
  if (node.nodeType !== 1) return;
  const tag   = node.tagName;
  const attrs = Array.from(node.attributes).map(a => ` ${a.name}="${escXML(a.value)}"`).join('');
  const meaningful = Array.from(node.childNodes).filter(n => n.nodeType !== 3 || n.textContent.trim());
  if (meaningful.length === 0) {
    lines.push(`${pad}<${tag}${attrs}/>`);
    return;
  }
  if (meaningful.length === 1 && meaningful[0].nodeType === 3) {
    lines.push(`${pad}<${tag}${attrs}>${escXML(meaningful[0].textContent.trim())}</${tag}>`);
    return;
  }
  lines.push(`${pad}<${tag}${attrs}>`);
  for (const child of meaningful) formatXMLNode(child, indent, level + 1, lines);
  lines.push(`${pad}</${tag}>`);
}

function escXML(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function xmlToJSON() {
  const input = document.getElementById('xj-input').value.trim();
  if (!input) { setMsg('xj-msg', 'No input', 'err'); return; }
  try {
    const doc = new DOMParser().parseFromString(input, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) { setMsg('xj-msg', 'XML error: ' + err.textContent.split('\n')[0], 'err'); return; }
    const result = {};
    result[doc.documentElement.tagName] = xmlNodeToObj(doc.documentElement);
    document.getElementById('xj-output').value = JSON.stringify(result, null, 2);
    setMsg('xj-msg', 'Converted \u2713', 'ok');
  } catch (e) { setMsg('xj-msg', 'Error: ' + e.message, 'err'); }
}

function xmlNodeToObj(node) {
  const obj = {};
  for (const attr of node.attributes) obj['@' + attr.name] = attr.value;
  const elementChildren = Array.from(node.childNodes).filter(n => n.nodeType === 1);
  const textParts = Array.from(node.childNodes)
    .filter(n => n.nodeType === 3).map(n => n.textContent.trim()).filter(Boolean);
  if (elementChildren.length === 0) {
    const text = textParts.join(' ');
    if (Object.keys(obj).length === 0) return text || '';
    if (text) obj['#text'] = text;
    return obj;
  }
  if (textParts.length > 0) obj['#text'] = textParts.join(' ');
  for (const child of elementChildren) {
    const tagName  = child.tagName;
    const childVal = xmlNodeToObj(child);
    if (Object.prototype.hasOwnProperty.call(obj, tagName)) {
      if (!Array.isArray(obj[tagName])) obj[tagName] = [obj[tagName]];
      obj[tagName].push(childVal);
    } else {
      obj[tagName] = childVal;
    }
  }
  return obj;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   COLOR TOOLS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6 && hex.length !== 8) return null;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
}

function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb({ h, s, l }) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

function rgbToHsv({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(d / (max || 1) * 100), v: Math.round(max * 100) };
}

function hsvToRgb({ h, s, v }) {
  s /= 100; v /= 100;
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

function rgbToCmyk({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round((1 - r - k) / (1 - k) * 100),
    m: Math.round((1 - g - k) / (1 - k) * 100),
    y: Math.round((1 - b - k) / (1 - k) * 100),
    k: Math.round(k * 100),
  };
}

function cmykToRgb({ c, m, y, k }) {
  c /= 100; m /= 100; y /= 100; k /= 100;
  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k)),
  };
}

function parseRgb(s) {
  const m = s.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  return m ? { r: +m[1], g: +m[2], b: +m[3] } : null;
}
function parseHsl(s) {
  const m = s.match(/hsl\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i);
  return m ? { h: +m[1], s: +m[2], l: +m[3] } : null;
}
function parseHsv(s) {
  const m = s.match(/hsv\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i);
  return m ? { h: +m[1], s: +m[2], v: +m[3] } : null;
}
function parseCmyk(s) {
  const m = s.match(/cmyk\s*\(\s*(\d+)%?\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i);
  return m ? { c: +m[1], m: +m[2], y: +m[3], k: +m[4] } : null;
}

let _converting = false;

function convertFrom(fmt) {
  if (_converting) return;
  _converting = true;
  try {
    let rgb = null;
    if (fmt === 'hex') {
      const raw = document.getElementById('c-hex').value.trim();
      rgb = hexToRgb(raw.startsWith('#') ? raw : '#' + raw);
    } else if (fmt === 'rgb') {
      rgb = parseRgb(document.getElementById('c-rgb').value.trim());
    } else if (fmt === 'hsl') {
      const hsl = parseHsl(document.getElementById('c-hsl').value.trim());
      if (hsl) rgb = hslToRgb(hsl);
    } else if (fmt === 'hsv') {
      const hsv = parseHsv(document.getElementById('c-hsv').value.trim());
      if (hsv) rgb = hsvToRgb(hsv);
    } else if (fmt === 'cmyk') {
      const cmyk = parseCmyk(document.getElementById('c-cmyk').value.trim());
      if (cmyk) rgb = cmykToRgb(cmyk);
    }
    if (!rgb) { setMsg('conv-msg', 'Invalid color format', 'err'); return; }
    rgb.r = Math.max(0, Math.min(255, rgb.r));
    rgb.g = Math.max(0, Math.min(255, rgb.g));
    rgb.b = Math.max(0, Math.min(255, rgb.b));
    setMsg('conv-msg', '', '');
    _populateConverter(rgb, fmt);
  } finally { _converting = false; }
}

function _populateConverter(rgb, skipFmt) {
  const hex  = rgbToHex(rgb);
  const hsl  = rgbToHsl(rgb);
  const hsv  = rgbToHsv(rgb);
  const cmyk = rgbToCmyk(rgb);
  if (skipFmt !== 'hex')  document.getElementById('c-hex').value  = hex;
  if (skipFmt !== 'rgb')  document.getElementById('c-rgb').value  = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  if (skipFmt !== 'hsl')  document.getElementById('c-hsl').value  = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  if (skipFmt !== 'hsv')  document.getElementById('c-hsv').value  = `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`;
  if (skipFmt !== 'cmyk') document.getElementById('c-cmyk').value = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
  document.getElementById('swatch-hex').style.background   = hex;
  document.getElementById('conv-preview').style.background = hex;
}

function clearConverter() {
  ['c-hex','c-rgb','c-hsl','c-hsv','c-cmyk'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('swatch-hex').style.background   = '';
  document.getElementById('conv-preview').style.background = '';
  setMsg('conv-msg', '', '');
}

function copyAllFormats() {
  const lines = ['c-hex','c-rgb','c-hsl','c-hsv','c-cmyk']
    .map(id => document.getElementById(id).value).filter(Boolean).join('\n');
  if (!lines) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(lines).then(() => setMsg('conv-msg','Copied all formats!','ok'));
  } else { _fbCopy(lines, 'conv-msg'); }
}

function onPickerChange() {
  const hex = document.getElementById('color-picker').value;
  const rgb = hexToRgb(hex);
  if (!rgb) return;
  document.getElementById('picked-preview').style.background = hex;
  document.getElementById('pv-hex').textContent  = hex.toUpperCase();
  const hsl  = rgbToHsl(rgb);
  const cmyk = rgbToCmyk(rgb);
  document.getElementById('pv-rgb').textContent  = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  document.getElementById('pv-hsl').textContent  = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  document.getElementById('pv-cmyk').textContent = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
  document.getElementById('pv-name').textContent = CSS_NAMES[hex.toUpperCase()] || 'â€”';
}

const CSS_NAMES = {
  '#FF0000':'red','#00FF00':'lime','#0000FF':'blue','#FFFF00':'yellow',
  '#FF00FF':'magenta','#00FFFF':'cyan','#FFFFFF':'white','#000000':'black',
  '#808080':'gray','#C0C0C0':'silver','#800000':'maroon','#808000':'olive',
  '#008000':'green','#800080':'purple','#008080':'teal','#000080':'navy',
  '#FFA500':'orange','#FFC0CB':'pink','#A52A2A':'brown','#FF7F50':'coral',
  '#FFD700':'gold','#ADFF2F':'greenyellow','#D2691E':'chocolate',
  '#DC143C':'crimson','#00CED1':'darkturquoise','#FF1493':'deeppink',
  '#1E90FF':'dodgerblue','#B22222':'firebrick','#228B22':'forestgreen',
  '#FF69B4':'hotpink','#CD5C5C':'indianred','#F0E68C':'khaki',
  '#7CFC00':'lawngreen','#ADD8E6':'lightblue','#90EE90':'lightgreen',
  '#20B2AA':'lightseagreen','#87CEFA':'lightskyblue','#00FA9A':'mediumspringgreen',
  '#9370DB':'mediumpurple','#3CB371':'mediumseagreen','#BA55D3':'mediumorchid',
  '#66CDAA':'mediumaquamarine','#0000CD':'mediumblue','#DA70D6':'orchid',
  '#FF4500':'orangered','#DB7093':'palevioletred','#FFDAB9':'peachpuff',
  '#CD853F':'peru','#DDA0DD':'plum','#B0E0E6':'powderblue',
  '#BC8F8F':'rosybrown','#4169E1':'royalblue','#8B4513':'saddlebrown',
  '#FA8072':'salmon','#F4A460':'sandybrown','#2E8B57':'seagreen',
  '#FFF5EE':'seashell','#A0522D':'sienna','#87CEEB':'skyblue',
  '#6A5ACD':'slateblue','#708090':'slategray','#FFFAFA':'snow',
  '#00FF7F':'springgreen','#4682B4':'steelblue','#D2B48C':'tan',
  '#40E0D0':'turquoise','#EE82EE':'violet','#F5DEB3':'wheat',
  '#9ACD32':'yellowgreen',
};

function syncColorInput(side) {
  const hex = document.getElementById(side + '-hex').value.trim();
  const rgb = hexToRgb(hex.startsWith('#') ? hex : '#' + hex);
  if (!rgb) return;
  document.getElementById(side + '-color').value = rgbToHex(rgb).toLowerCase();
  checkContrast();
}

function checkContrast() {
  const fg = hexToRgb(document.getElementById('fg-color').value);
  const bg = hexToRgb(document.getElementById('bg-color').value);
  if (!fg || !bg) return;
  document.getElementById('fg-hex').value = rgbToHex(fg);
  document.getElementById('bg-hex').value = rgbToHex(bg);
  const prev = document.getElementById('contrast-preview');
  prev.style.background = rgbToHex(bg);
  prev.style.color      = rgbToHex(fg);
  const ratio = contrastRatio(fg, bg);
  document.getElementById('cr-ratio').textContent = ratio.toFixed(2) + ':1';
  setBadge('badge-aa-norm',   ratio >= 4.5);
  setBadge('badge-aa-large',  ratio >= 3);
  setBadge('badge-aaa-norm',  ratio >= 7);
  setBadge('badge-aaa-large', ratio >= 4.5);
}

function setBadge(id, pass) {
  const el = document.getElementById(id);
  el.classList.toggle('pass', pass);
  el.classList.toggle('fail', !pass);
  el.textContent = el.textContent.replace(/ âœ“| âœ—/, '') + (pass ? ' âœ“' : ' âœ—');
}

function relativeLum({ r, g, b }) {
  const linearize = v => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(c1, c2) {
  const l1 = relativeLum(c1), l2 = relativeLum(c2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function syncPalBase() {
  const hex = document.getElementById('pal-base').value;
  document.getElementById('pal-base-hex').value = hex.toUpperCase();
  generatePalette();
}

function syncPalBaseHex() {
  const val = document.getElementById('pal-base-hex').value.trim();
  const hex = val.startsWith('#') ? val : '#' + val;
  const rgb = hexToRgb(hex);
  if (!rgb) return;
  document.getElementById('pal-base').value = rgbToHex(rgb).toLowerCase();
  generatePalette();
}

function generatePalette() {
  const base   = document.getElementById('pal-base').value;
  const rgb    = hexToRgb(base);
  if (!rgb) return;
  const hsl    = rgbToHsl(rgb);
  const scheme = document.getElementById('pal-scheme').value;
  let colors   = [];
  switch (scheme) {
    case 'analogous':
      colors = [hsl.h-30,hsl.h-15,hsl.h,hsl.h+15,hsl.h+30]
        .map(h => hslHex(((h%360)+360)%360, hsl.s, hsl.l));
      break;
    case 'complementary':
      colors = [hsl.h, hsl.h+180].map(h => hslHex(h%360, hsl.s, hsl.l));
      break;
    case 'triadic':
      colors = [hsl.h, hsl.h+120, hsl.h+240].map(h => hslHex(h%360, hsl.s, hsl.l));
      break;
    case 'tetradic':
      colors = [hsl.h,hsl.h+90,hsl.h+180,hsl.h+270].map(h => hslHex(h%360,hsl.s,hsl.l));
      break;
    case 'monochromatic':
      colors = [20,35,50,65,80].map(l => hslHex(hsl.h, hsl.s, l));
      break;
    case 'split-complementary':
      colors = [hsl.h,hsl.h+150,hsl.h+210].map(h => hslHex(h%360,hsl.s,hsl.l));
      break;
  }
  const container = document.getElementById('palette-swatches');
  container.innerHTML = colors.map(hex => `
    <div class="pal-swatch">
      <div class="pal-swatch-box" style="background:${hex}" title="${hex}" onclick="copyText('${hex}','pal-msg')"></div>
      <span class="pal-swatch-hex">${hex}</span>
    </div>
  `).join('');
}

function hslHex(h, s, l) {
  return rgbToHex(hslToRgb({ h, s, l }));
}

function copyPalette() {
  const hexes = Array.from(document.querySelectorAll('.pal-swatch-hex')).map(el => el.textContent);
  if (!hexes.length) return;
  copyText(hexes.join('\n'), 'pal-msg');
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TIMESTAMP TOOLS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function relativeTime(ms) {
  const diff = Date.now() - ms;
  const abs  = Math.abs(diff);
  const future = diff < 0;
  const sec  = Math.round(abs / 1000);
  const min  = Math.round(abs / 60000);
  const hr   = Math.round(abs / 3600000);
  const day  = Math.round(abs / 86400000);
  const yr   = Math.round(abs / (365.25 * 86400000));
  let str;
  if (sec < 60)       str = sec + ' second' + (sec !== 1 ? 's' : '');
  else if (min < 60)  str = min + ' minute' + (min !== 1 ? 's' : '');
  else if (hr < 24)   str = hr  + ' hour'   + (hr  !== 1 ? 's' : '');
  else if (day < 365) str = day + ' day'    + (day !== 1 ? 's' : '');
  else                str = yr  + ' year'   + (yr  !== 1 ? 's' : '');
  return future ? 'in ' + str : str + ' ago';
}

function tsToDate() {
  const raw = document.getElementById('ts-in').value.trim();
  const out = document.getElementById('ts-date-out');
  if (!raw) { out.style.display = 'none'; return; }
  const n = Number(raw);
  if (isNaN(n)) { out.style.display = 'none'; return; }
  const ms = n > 1e12 ? n : n * 1000;
  const d  = new Date(ms);
  if (isNaN(d.getTime())) { out.style.display = 'none'; return; }
  document.getElementById('ts-utc').textContent   = d.toUTCString();
  document.getElementById('ts-local').textContent = d.toLocaleString();
  document.getElementById('ts-iso').textContent   = d.toISOString();
  document.getElementById('ts-rel').textContent   = relativeTime(ms);
  out.style.display = 'block';
}

function dateToTs() {
  const raw = document.getElementById('dt-in').value;
  const out = document.getElementById('dt-ts-out');
  if (!raw) { out.style.display = 'none'; return; }
  const d = new Date(raw);
  if (isNaN(d.getTime())) { out.style.display = 'none'; return; }
  document.getElementById('dt-secs').textContent = Math.floor(d.getTime() / 1000);
  document.getElementById('dt-ms').textContent   = d.getTime();
  out.style.display = 'block';
}

function setNow() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const s = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  document.getElementById('dt-in').value = s;
  dateToTs();
}

function calcDiff() {
  const a   = document.getElementById('diff-from').value;
  const b   = document.getElementById('diff-to').value;
  const out = document.getElementById('diff-out');
  if (!a || !b) { flashMsg('calc-msg', 'Please select both dates.'); return; }
  const da = new Date(a), db = new Date(b);
  const diffMs = Math.abs(db - da);
  const days   = Math.round(diffMs / 86400000);
  document.getElementById('diff-days').textContent   = days.toLocaleString();
  document.getElementById('diff-weeks').textContent  = (days / 7).toFixed(2);
  document.getElementById('diff-months').textContent = (days / 30.4375).toFixed(2);
  document.getElementById('diff-hours').textContent  = Math.round(diffMs / 3600000).toLocaleString();
  out.style.display = 'block';
}

function addSubtract(sign) {
  const base = document.getElementById('adddate-base').value;
  const val  = parseInt(document.getElementById('add-val').value, 10);
  const unit = document.getElementById('add-unit').value;
  const out  = document.getElementById('addsub-out');
  if (!base || isNaN(val)) { flashMsg('calc-msg', 'Please enter a date and value.'); return; }
  const d = new Date(base + 'T00:00:00');
  const n = sign * val;
  switch (unit) {
    case 'days':   d.setDate(d.getDate() + n); break;
    case 'weeks':  d.setDate(d.getDate() + n * 7); break;
    case 'months': d.setMonth(d.getMonth() + n); break;
    case 'years':  d.setFullYear(d.getFullYear() + n); break;
  }
  const pad2 = n2 => String(n2).padStart(2,'0');
  document.getElementById('addsub-date').textContent =
    `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  out.style.display = 'block';
}

function fmtNow() {
  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  const s = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  document.getElementById('fmt-dt').value = s;
  formatDate();
}

function dayOfYear(d) {
  return Math.ceil((d - new Date(d.getFullYear(), 0, 1)) / 86400000) + 1;
}

function isoWeekNumber(d) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function rfcDate(d) {
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const pad    = n => String(n).padStart(2,'0');
  const tzOff  = d.getTimezoneOffset();
  const tzH    = String(Math.floor(Math.abs(tzOff)/60)).padStart(2,'0');
  const tzM    = String(Math.abs(tzOff)%60).padStart(2,'0');
  const tzSign = tzOff <= 0 ? '+' : '-';
  return `${DAYS[d.getDay()]}, ${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${tzSign}${tzH}${tzM}`;
}

function formatDate() {
  const raw = document.getElementById('fmt-dt').value;
  const out = document.getElementById('fmt-out');
  if (!raw) { out.style.display = 'none'; return; }
  const d = new Date(raw);
  if (isNaN(d.getTime())) { out.style.display = 'none'; return; }
  const pad  = n => String(n).padStart(2,'0');
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  document.getElementById('fmt-iso').textContent      = d.toISOString();
  document.getElementById('fmt-rfc').textContent      = rfcDate(d);
  document.getElementById('fmt-full-us').textContent  = d.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long',    day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' });
  document.getElementById('fmt-full-eu').textContent  = d.toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long',    day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' });
  document.getElementById('fmt-short-us').textContent = d.toLocaleDateString('en-US', { year:'numeric', month:'2-digit', day:'2-digit' });
  document.getElementById('fmt-ymd').textContent      = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  document.getElementById('fmt-unix').textContent     = Math.floor(d.getTime()/1000);
  document.getElementById('fmt-dow').textContent      = DAYS[d.getDay()];
  document.getElementById('fmt-doy').textContent      = dayOfYear(d);
  document.getElementById('fmt-week').textContent     = 'Week ' + isoWeekNumber(d);
  out.style.display = 'block';
}

function getFlags(prefix) {
  const p = prefix || 'fl';
  let f = '';
  if (document.getElementById(p + '-g')?.checked) f += 'g';
  if (document.getElementById(p + '-i')?.checked) f += 'i';
  if (document.getElementById(p + '-m')?.checked) f += 'm';
  if (document.getElementById(p + '-s')?.checked) f += 's';
  return f;
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function runTester() {
  const patStr  = document.getElementById('pt-pattern').value;
  const testStr = document.getElementById('pt-test').value;
  const hlBox   = document.getElementById('pt-highlight');
  const errEl   = document.getElementById('pt-err');
  const sumEl   = document.getElementById('pt-summary');
  const grpEl   = document.getElementById('pt-groups-content');
  const sbEl    = document.getElementById('sb-matches');

  errEl.textContent = '';
  grpEl.innerHTML   = '';
  sumEl.innerHTML   = '';

  if (!patStr) {
    hlBox.textContent = testStr;
    if (sbEl) sbEl.textContent = '';
    return;
  }

  let re;
  try {
    let flags = getFlags('fl');
    if (!flags.includes('g')) flags += 'g';
    re = new RegExp(patStr, flags);
  } catch(e) {
    errEl.textContent = 'Invalid regex: ' + e.message;
    hlBox.textContent = testStr;
    return;
  }

  const matches = [...testStr.matchAll(re)];

  if (matches.length === 0) {
    hlBox.textContent = testStr;
  } else {
    let html    = '';
    let lastIdx = 0;
    matches.forEach((m, i) => {
      const start = m.index;
      const end   = start + m[0].length;
      html += escHtml(testStr.slice(lastIdx, start));
      const cls = i % 2 === 1 ? 'alt' : '';
      html += `<mark class="${cls}" title="Match ${i+1}">${escHtml(m[0])}</mark>`;
      lastIdx = end;
    });
    html += escHtml(testStr.slice(lastIdx));
    hlBox.innerHTML = html;
  }

  const cnt = matches.length;
  sumEl.innerHTML = cnt
    ? `<strong>${cnt}</strong> match${cnt !== 1 ? 'es' : ''} found`
    : 'No matches';
  if (sbEl) sbEl.textContent = cnt ? cnt + ' match' + (cnt !== 1 ? 'es' : '') : '';

  if (cnt === 0) { grpEl.innerHTML = '<em style="color:var(--text2)">No matches to show.</em>'; return; }
  const hasGroups = re.source.includes('(');
  matches.forEach((m, i) => {
    const div = document.createElement('div');
    div.className = 'mg-entry';
    let inner = `<div class="mg-title">Match ${i+1}${m[0].length > 0 ? ' â€” "' + escHtml(m[0]) + '"' : ' (empty)'} @ index ${m.index}</div>`;
    if (hasGroups && m.length > 1) {
      for (let g = 1; g < m.length; g++) {
        const gVal = m[g] !== undefined ? '"' + escHtml(m[g]) + '"' : '<em>undefined</em>';
        inner += `<div class="mg-row"><span class="mg-idx">$${g}</span><span class="mg-val">${gVal}</span></div>`;
      }
      if (m.groups) {
        for (const [name, val] of Object.entries(m.groups)) {
          inner += `<div class="mg-row"><span class="mg-idx">$&lt;${escHtml(name)}&gt;</span><span class="mg-val">"${escHtml(val ?? '')}"</span></div>`;
        }
      }
    }
    div.innerHTML = inner;
    grpEl.appendChild(div);
  });
}

function runReplace() {
  const patStr  = document.getElementById('rp-pattern').value;
  const replStr = document.getElementById('rp-repl').value;
  const input   = document.getElementById('rp-input').value;
  const output  = document.getElementById('rp-output');
  const errEl   = document.getElementById('rp-err');
  const sumEl   = document.getElementById('rp-summary');

  errEl.textContent = '';
  sumEl.textContent = '';

  if (!patStr) { output.value = input; return; }

  let re;
  try {
    let flags = getFlags('rfl');
    if (!flags.includes('g')) flags += 'g';
    re = new RegExp(patStr, flags);
  } catch(e) {
    errEl.textContent = 'Invalid regex: ' + e.message;
    output.value = input;
    return;
  }

  const matches = [...input.matchAll(re)];
  let result;
  try {
    result = input.replace(re, replStr);
  } catch(e) {
    errEl.textContent = 'Replace error: ' + e.message;
    output.value = input;
    return;
  }
  output.value = result;
  const cnt = matches.length;
  sumEl.innerHTML = cnt
    ? `<strong>${cnt}</strong> replacement${cnt !== 1 ? 's' : ''} made`
    : 'No matches â€” input unchanged';
}

function copyReplaceResult() {
  const val = document.getElementById('rp-output')?.value;
  if (val == null) return;
  navigator.clipboard.writeText(val).then(() => flashMsg('rp-msg', 'Copied!'));
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   INIT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  /* Color tool init */
  onPickerChange();
  checkContrast();
  generatePalette();

  /* Timestamp init */
  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  const localStr  = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const todayStr  = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;

  const fmtDt = document.getElementById('fmt-dt');
  if (fmtDt) { fmtDt.value = localStr; formatDate(); }

  const addBase = document.getElementById('adddate-base');
  if (addBase) addBase.value = todayStr;
  const diffFrom = document.getElementById('diff-from');
  if (diffFrom) diffFrom.value = todayStr;
  const diffTo = document.getElementById('diff-to');
  if (diffTo) diffTo.value = todayStr;
});
