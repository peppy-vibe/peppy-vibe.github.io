'use strict';

/* ── Tab navigation ────────────────────────── */
const TOOL_LABELS = {
  base64:   'Base64 Encoder / Decoder',
  url:      'URL Encoder / Decoder',
  hash:     'Hash Generator',
  password: 'Password Generator',
  uuid:     'UUID Generator',
  jwt:      'JWT Decoder',
};

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
  const btn    = document.getElementById('theme-btn');
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.textContent = isDark ? '\u2600 Light' : '\u263e Dark';
}
updateThemeBtn();

/* ── Clipboard helpers ─────────────────────── */
function copyOutput(outId, msgId) {
  const val = document.getElementById(outId).value;
  if (!val) return;
  writeClipboard(val, msgId);
}

function copyResult(inputId, msgId) {
  const val = document.getElementById(inputId).value;
  if (!val) return;
  writeClipboard(val, msgId);
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

function clearTool(inId, outId, msgId) {
  document.getElementById(inId).value  = '';
  document.getElementById(outId).value = '';
  const el = document.getElementById(msgId);
  if (el) { el.textContent = ''; el.className = 'tool-msg'; }
}

function setMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className   = 'tool-msg' + (type ? ' ' + type : '');
}

/* ═══════════════════════════════════════════
   BASE64
═══════════════════════════════════════════ */
function b64Encode() {
  const input = document.getElementById('b64-in').value;
  try {
    // encode UTF-8 safely
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

/* ═══════════════════════════════════════════
   URL ENCODER / DECODER
═══════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════
   HASH GENERATOR
═══════════════════════════════════════════ */

/* ── Compact MD5 (RFC 1321) ─────────────────
   Uses 32-bit safe integer arithmetic only.   */
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

  // Encode string to UTF-8 bytes then to 32-bit words (little-endian)
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

/* ── SHA via SubtleCrypto ───────────────────── */
async function computeSHA(algo, str) {
  const enc  = new TextEncoder();
  const buf  = await crypto.subtle.digest(algo, enc.encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function computeHash() {
  const input = document.getElementById('hash-in').value;
  const algo  = document.querySelector('input[name="hash-algo"]:checked').value;
  if (!input) { setMsg('hash-msg','Enter some text first','err'); return; }

  try {
    let result;
    if (algo === 'MD5') {
      result = computeMD5(input);
    } else {
      result = await computeSHA(algo, input);
    }
    document.getElementById('hash-out').value = result;
    setMsg('hash-msg', algo + ' · ' + (result.length * 4) + ' bits', 'ok');
  } catch (err) {
    setMsg('hash-msg', 'Error: ' + err.message, 'err');
  }
}

/* ═══════════════════════════════════════════
   PASSWORD GENERATOR
═══════════════════════════════════════════ */
const AMBIGUOUS = new Set([...'0Ol1I']);

function generatePassword() {
  const len      = parseInt(document.getElementById('pwd-len').value, 10);
  const useUpper = document.getElementById('pwd-upper').checked;
  const useLower = document.getElementById('pwd-lower').checked;
  const useDigits= document.getElementById('pwd-digits').checked;
  const useSyms  = document.getElementById('pwd-symbols').checked;
  const noAmbig  = document.getElementById('pwd-noambig').checked;

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
  if (!charset) { setMsg('pwd-msg','Select at least one character set','err'); return; }

  const arr = new Uint32Array(len * 2);
  crypto.getRandomValues(arr);

  let pwd = '';
  let i   = 0;
  while (pwd.length < len) {
    pwd += charset[arr[i++] % charset.length];
    if (i >= arr.length) { crypto.getRandomValues(arr); i = 0; }
  }

  // Guarantee at least one char from each selected set (unless excluded by noAmbig)
  const required = [];
  if (useUpper)  { const c = [...upper].filter(x => !noAmbig || !AMBIGUOUS.has(x));  if (c.length) required.push(c); }
  if (useLower)  { const c = [...lower].filter(x => !noAmbig || !AMBIGUOUS.has(x));  if (c.length) required.push(c); }
  if (useDigits) { const c = [...digits].filter(x => !noAmbig || !AMBIGUOUS.has(x)); if (c.length) required.push(c); }
  if (useSyms)   { const c = [...symbols].filter(x => !noAmbig || !AMBIGUOUS.has(x));if (c.length) required.push(c); }

  const rndByte = () => { const b = new Uint32Array(1); crypto.getRandomValues(b); return b[0]; };
  const pwdArr  = [...pwd];
  required.forEach((set, idx) => {
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
    { label: 'Very Weak', color: '#dc2626', pct: 14 },
    { label: 'Weak',      color: '#ea580c', pct: 28 },
    { label: 'Fair',      color: '#ca8a04', pct: 43 },
    { label: 'Good',      color: '#65a30d', pct: 57 },
    { label: 'Strong',    color: '#16a34a', pct: 71 },
    { label: 'Very Strong',color:'#15803d', pct: 85 },
    { label: 'Excellent', color: '#166534', pct: 100 },
  ];
  const lvl = levels[Math.min(score, levels.length - 1)];
  const fill = document.getElementById('strength-fill');
  fill.style.width      = lvl.pct + '%';
  fill.style.background = lvl.color;
  document.getElementById('strength-label').textContent = lvl.label;
}

/* ═══════════════════════════════════════════
   UUID GENERATOR
═══════════════════════════════════════════ */
function generateUUIDs() {
  const ver   = document.querySelector('input[name="uuid-ver"]:checked').value;
  const count = Math.min(100, Math.max(1, parseInt(document.getElementById('uuid-count').value, 10) || 1));
  const lines = [];

  for (let i = 0; i < count; i++) {
    if (ver === 'nil') {
      lines.push('00000000-0000-0000-0000-000000000000');
    } else {
      // v4: use crypto.randomUUID if available, else manual
      if (crypto.randomUUID) {
        lines.push(crypto.randomUUID());
      } else {
        const buf = new Uint8Array(16);
        crypto.getRandomValues(buf);
        buf[6] = (buf[6] & 0x0f) | 0x40; // version 4
        buf[8] = (buf[8] & 0x3f) | 0x80; // variant RFC4122
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

/* ═══════════════════════════════════════════
   JWT DECODER
═══════════════════════════════════════════ */
function decodeJWT() {
  const raw    = document.getElementById('jwt-in').value.trim();
  const result = document.getElementById('jwt-result');
  const msgEl  = document.getElementById('jwt-msg');

  if (!raw) { result.style.display = 'none'; msgEl.textContent = ''; return; }

  const parts = raw.split('.');
  if (parts.length !== 3) {
    result.style.display = 'none';
    msgEl.textContent    = 'Invalid JWT — expected 3 dot-separated parts';
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
    msgEl.textContent    = 'Could not decode — invalid Base64url encoding';
    msgEl.className      = 'tool-msg err';
    return;
  }

  document.getElementById('jwt-header').textContent  = prettyJSON(headerRaw);
  document.getElementById('jwt-payload').textContent = prettyJSON(payloadRaw);
  result.style.display = 'flex';
  msgEl.textContent    = '';
}
