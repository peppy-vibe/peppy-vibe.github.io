'use strict';

/* ── Tool labels ───────────────────────────── */
const TOOL_LABELS = {
  jf:   'JSON Formatter',
  jv:   'JSON Viewer (Tree)',
  jval: 'JSON Validator',
  jcsv: 'JSON → CSV Converter',
  jy:   'JSON → YAML Converter',
  yj:   'YAML → JSON Converter',
  xf:   'XML Formatter',
  xj:   'XML → JSON Converter',
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

/* ── Shared helpers ────────────────────────── */
function setMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className   = 'tool-msg' + (type ? ' ' + type : '');
}

function copyTA(taId, msgId) {
  const val = document.getElementById(taId).value;
  if (!val) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(val)
      .then(() => setMsg(msgId, 'Copied!', 'ok'))
      .catch(() => fbCopy(val, msgId));
  } else {
    fbCopy(val, msgId);
  }
}
function fbCopy(text, msgId) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    setMsg(msgId, 'Copied!', 'ok');
  } catch { setMsg(msgId, 'Copy failed', 'err'); }
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

/* ═══════════════════════════════════════════
   JSON FORMATTER
═══════════════════════════════════════════ */

function jsonFormat() {
  const input  = document.getElementById('jf-input').value.trim();
  const indent = document.getElementById('jf-indent').value;
  if (!input) { setMsg('jf-msg', 'No input', 'err'); return; }
  try {
    const parsed   = JSON.parse(input);
    const indentVal = indent === 'tab' ? '\t' : parseInt(indent, 10);
    document.getElementById('jf-output').value = JSON.stringify(parsed, null, indentVal);
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

/* ═══════════════════════════════════════════
   JSON VIEWER (TREE)
═══════════════════════════════════════════ */

function jsonViewTree() {
  const input = document.getElementById('jv-input').value.trim();
  const container = document.getElementById('jv-tree');
  if (!input) { container.innerHTML = ''; return; }
  try {
    const parsed = JSON.parse(input);
    container.innerHTML = '';
    container.appendChild(buildTreeNode(parsed, null));
    setMsg('jv-msg', 'Parsed \u2713', 'ok');
  } catch (e) { setMsg('jv-msg', 'Parse error: ' + e.message, 'err'); }
}

function jsonExpandAll() {
  document.querySelectorAll('#jv-tree .jt-toggle').forEach(btn => {
    if (btn.textContent === '▸') btn.click();
  });
}

function jsonCollapseAll() {
  document.querySelectorAll('#jv-tree .jt-toggle').forEach(btn => {
    if (btn.textContent === '▾') btn.click();
  });
}

function clearTree() {
  document.getElementById('jv-input').value = '';
  document.getElementById('jv-tree').innerHTML = '';
  setMsg('jv-msg', '', '');
}

/* ── Tree builder ──────────────────────────── */
function mkSpan(cls, text) {
  const el = document.createElement('span');
  el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

function buildTreeNode(value, key) {
  const el = document.createElement('div');
  el.className = 'jt-node';

  /* ── Primitive leaf ── */
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

  /* ── Object / Array ── */
  const isArr  = Array.isArray(value);
  const entries = isArr ? value.map((v, i) => [i, v]) : Object.entries(value);
  const openBr  = isArr ? '[' : '{';
  const closeBr = isArr ? ']' : '}';

  const header = document.createElement('div');
  header.className = 'jt-line';

  let toggle = null;
  let childContainer = null;
  let closeEl = null;
  let countEl = null;

  if (entries.length > 0) {
    toggle = document.createElement('button');
    toggle.className = 'jt-toggle';
    toggle.textContent = '▾';
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
  for (const [k, v] of entries) {
    childContainer.appendChild(buildTreeNode(v, isArr ? null : k));
  }

  closeEl = document.createElement('div');
  closeEl.className = 'jt-close';
  closeEl.appendChild(mkSpan('jt-bracket', closeBr));

  el.appendChild(childContainer);
  el.appendChild(closeEl);

  /* Toggle logic */
  toggle.addEventListener('click', () => {
    const isOpen = toggle.textContent === '▾';
    toggle.textContent = isOpen ? '▸' : '▾';
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

/* ═══════════════════════════════════════════
   JSON VALIDATOR
═══════════════════════════════════════════ */

let _validTimer = null;

function jsonValidateLive() {
  clearTimeout(_validTimer);
  _validTimer = setTimeout(jsonValidate, 400);
}

function jsonValidate() {
  const input = document.getElementById('jval-input').value.trim();
  const result = document.getElementById('jval-result');
  if (!input) { result.style.display = 'none'; return; }
  try {
    const parsed = JSON.parse(input);
    const type   = Array.isArray(parsed) ? 'array' : typeof parsed;
    const keys   = type === 'object' && parsed !== null ? Object.keys(parsed).length : null;
    result.className = 'validator-result ok';
    result.textContent = '\u2713 Valid JSON  \u2014  Type: ' + type
      + (keys !== null ? '  \u2014  ' + keys + ' top-level key' + (keys !== 1 ? 's' : '') : '');
  } catch (e) {
    result.className = 'validator-result err';
    result.textContent = '\u2717 Invalid JSON: ' + e.message;
  }
  result.style.display = '';
}

/* ═══════════════════════════════════════════
   JSON → CSV CONVERTER
═══════════════════════════════════════════ */

function jsonToCSV() {
  const input = document.getElementById('jcsv-input').value.trim();
  if (!input) { setMsg('jcsv-msg', 'No input', 'err'); return; }
  try {
    const data = JSON.parse(input);
    if (!Array.isArray(data)) { setMsg('jcsv-msg', 'Input must be a JSON array', 'err'); return; }
    if (data.length === 0) { setMsg('jcsv-msg', 'Array is empty', 'err'); return; }

    // Collect all unique keys in insertion order
    const keySet = new Set();
    for (const row of data) {
      if (row && typeof row === 'object' && !Array.isArray(row)) {
        for (const k of Object.keys(row)) keySet.add(k);
      }
    }
    const keys = [...keySet];

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

/* ═══════════════════════════════════════════
   JSON → YAML CONVERTER
═══════════════════════════════════════════ */

function jsonToYAML() {
  const input = document.getElementById('jy-input').value.trim();
  if (!input) { setMsg('jy-msg', 'No input', 'err'); return; }
  try {
    const parsed = JSON.parse(input);
    document.getElementById('jy-output').value = toYAML(parsed, 0);
    setMsg('jy-msg', 'Converted \u2713', 'ok');
  } catch (e) { setMsg('jy-msg', 'Parse error: ' + e.message, 'err'); }
}

/* Recursive JSON → YAML serializer */
function toYAML(value, level) {
  const pad = '  '.repeat(level);

  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number')  return isFinite(value) ? String(value) : 'null';
  if (typeof value === 'string')  return yamlScalar(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return value.map(v => {
      if (v !== null && typeof v === 'object') {
        // Inline first key of object items
        const rendered = toYAML(v, level + 1);
        const lines    = rendered.split('\n');
        return pad + '- ' + lines[0].trimStart()
          + (lines.length > 1 ? '\n' + lines.slice(1).join('\n') : '');
      }
      return pad + '- ' + toYAML(v, level);
    }).join('\n');
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return '{}';
    return keys.map(k => {
      const v   = value[k];
      const ks  = yamlKey(k);
      if (v !== null && typeof v === 'object') {
        return pad + ks + ':\n' + toYAML(v, level + 1);
      }
      return pad + ks + ': ' + toYAML(v, level);
    }).join('\n');
  }

  return String(value);
}

function yamlScalar(s) {
  if (!s) return '""';
  const needsQuote =
    /^(true|false|null|yes|no|on|off|~)$/i.test(s) ||
    /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(s) ||
    /^0x[0-9a-fA-F]+$/.test(s) ||
    /[:\{\}\[\],&*?|<>\=!%@`#]/.test(s) ||
    /^[-\s]/.test(s) || /\s$/.test(s) ||
    s.includes('\n') || s.includes('\r');
  if (!needsQuote) return s;
  return '"' + s
    .replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    .replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t') + '"';
}

function yamlKey(k) {
  const needsQuote =
    !k || /[:\{\}\[\],&*?|<>\=!%@`#\s]/.test(k) ||
    /^(true|false|null|yes|no|on|off|~)$/i.test(k) ||
    /^[-?]/.test(k);
  if (!needsQuote) return k;
  return '"' + k.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

/* ═══════════════════════════════════════════
   YAML → JSON CONVERTER
═══════════════════════════════════════════ */

function yamlToJSON() {
  const input = document.getElementById('yj-input').value.trim();
  if (!input) { setMsg('yj-msg', 'No input', 'err'); return; }

  if (typeof jsyaml === 'undefined') {
    setMsg('yj-msg', 'js-yaml library failed to load — check internet connection', 'err');
    return;
  }

  try {
    const parsed = jsyaml.load(input);
    document.getElementById('yj-output').value = JSON.stringify(parsed, null, 2);
    setMsg('yj-msg', 'Converted \u2713', 'ok');
  } catch (e) { setMsg('yj-msg', 'YAML parse error: ' + e.message, 'err'); }
}

/* ═══════════════════════════════════════════
   XML FORMATTER
═══════════════════════════════════════════ */

function xmlFormat() {
  const input  = document.getElementById('xf-input').value.trim();
  const indent = document.getElementById('xf-indent').value;
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

  if (node.nodeType === 3) { // TEXT_NODE
    const text = node.textContent.trim();
    if (text) lines.push(pad + escXML(text));
    return;
  }
  if (node.nodeType === 8) { // COMMENT_NODE
    lines.push(pad + '<!-- ' + node.textContent.trim() + ' -->');
    return;
  }
  if (node.nodeType !== 1) return; // Skip non-element

  const tag   = node.tagName;
  const attrs = Array.from(node.attributes)
    .map(a => ` ${a.name}="${escXML(a.value)}"`)
    .join('');

  const meaningful = Array.from(node.childNodes).filter(n =>
    n.nodeType !== 3 || n.textContent.trim()
  );

  if (meaningful.length === 0) {
    lines.push(`${pad}<${tag}${attrs}/>`);
    return;
  }

  // Single text child → inline
  if (meaningful.length === 1 && meaningful[0].nodeType === 3) {
    lines.push(`${pad}<${tag}${attrs}>${escXML(meaningful[0].textContent.trim())}</${tag}>`);
    return;
  }

  lines.push(`${pad}<${tag}${attrs}>`);
  for (const child of meaningful) {
    formatXMLNode(child, indent, level + 1, lines);
  }
  lines.push(`${pad}</${tag}>`);
}

function escXML(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ═══════════════════════════════════════════
   XML → JSON CONVERTER
═══════════════════════════════════════════ */

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

  // Attributes prefixed with @
  for (const attr of node.attributes) {
    obj['@' + attr.name] = attr.value;
  }

  const elementChildren = Array.from(node.childNodes).filter(n => n.nodeType === 1);
  const textParts = Array.from(node.childNodes)
    .filter(n => n.nodeType === 3)
    .map(n => n.textContent.trim())
    .filter(Boolean);

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
