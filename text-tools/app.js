'use strict';

/* ── Tool labels ───────────────────────────── */
const TOOL_LABELS = {
  diff:  'Text Diff Checker',
  sort:  'Text Sorter',
  dedup: 'Duplicate Line Remover',
  rand:  'Random String Generator',
  lorem: 'Lorem Ipsum Generator',
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

/* ── Messages & helpers ────────────────────── */
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
      .catch(() => fallbackCopy(val, msgId));
  } else {
    fallbackCopy(val, msgId);
  }
}
function fallbackCopy(text, msgId) {
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
   TEXT DIFF CHECKER
═══════════════════════════════════════════ */

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
  const textA = document.getElementById('diff-a').value;
  const textB = document.getElementById('diff-b').value;

  const linesA = textA.split('\n');
  const linesB = textB.split('\n');

  // Limit for performance
  if (linesA.length * linesB.length > 250000) {
    document.getElementById('diff-stats').innerHTML =
      '<span style="color:#c00">Texts too large for diff (reduce to ~500 lines each)</span>';
    return;
  }

  const ops = lcsLineDiff(linesA, linesB);

  let leftHTML  = '';
  let rightHTML = '';
  let leftLine  = 1;
  let rightLine = 1;
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

/* LCS-based line diff */
function lcsLineDiff(a, b) {
  const m = a.length, n = b.length;
  // Build LCS DP table
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1]);
    }
  }
  // Backtrack
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

/* ═══════════════════════════════════════════
   TEXT SORTER
═══════════════════════════════════════════ */

function sortLines() {
  const input      = document.getElementById('sort-input').value;
  const mode       = document.getElementById('sort-mode').value;
  const caseSens   = document.getElementById('sort-case').checked;
  const rmEmpty    = document.getElementById('sort-rm-empty').checked;
  const unique     = document.getElementById('sort-unique').checked;

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
      return x.localeCompare(y); // alpha-asc, numeric fallback
    });
  } else {
    // Fisher–Yates shuffle with crypto.getRandomValues
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

/* ═══════════════════════════════════════════
   DUPLICATE LINE REMOVER
═══════════════════════════════════════════ */

function removeDuplicates() {
  const input   = document.getElementById('dedup-input').value;
  const caseSens = document.getElementById('dedup-case').checked;
  const trim    = document.getElementById('dedup-trim').checked;
  const rmBlank = document.getElementById('dedup-rm-blank').checked;

  const lines  = input.split('\n');
  const seen   = new Set();
  const result = [];

  for (const line of lines) {
    if (rmBlank && line.trim() === '') continue;
    const key     = trim ? line.trim() : line;
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

/* ═══════════════════════════════════════════
   RANDOM STRING GENERATOR
═══════════════════════════════════════════ */

function generateRandom() {
  const length  = Math.min(4096, Math.max(1, parseInt(document.getElementById('rand-length').value, 10) || 16));
  const count   = Math.min(1000, Math.max(1, parseInt(document.getElementById('rand-count').value, 10)  || 1));
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

  // Deduplicate charset chars
  charset = [...new Set(charset)].join('');

  if (!charset) { setMsg('rand-msg', 'Select at least one character type', 'err'); return; }

  const results = [];
  const buf = new Uint32Array(length);

  for (let c = 0; c < count; c++) {
    crypto.getRandomValues(buf);
    let str = '';
    for (let i = 0; i < length; i++) {
      str += charset[buf[i] % charset.length];
    }
    results.push(str);
  }

  document.getElementById('rand-output').value = results.join('\n');
  setMsg('rand-msg', `${count} string${count !== 1 ? 's' : ''} generated`, 'ok');
}

/* ═══════════════════════════════════════════
   LOREM IPSUM GENERATOR
═══════════════════════════════════════════ */

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
  'perferendis','doloribus','asperiores','repellat','harum','quidem',
  'facilis','possimus','voluptatem','sequi','nesciunt','neque','porro',
  'quisquam','dolorem','quia','dolor','sit','aspernatur','aut','odit',
  'fugit','sed','quia','consequuntur','magni','dolores','ratione',
  'sequi','nesciunt','eius','modi','tempora','incidunt','labore',
  'dolorem','magnam','aliquam','quaerat','voluptatem'
];

const LOREM_START = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

function loremWord() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return LOREM_WORDS[buf[0] % LOREM_WORDS.length];
}

function loremSentence(skipStart) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const len = 8 + (buf[0] % 10); // 8–17 words
  const words = [];
  for (let i = 0; i < len; i++) words.push(loremWord());
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(' ') + '.';
}

function loremParagraph() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const count = 3 + (buf[0] % 5); // 3–7 sentences
  const sents = [];
  for (let i = 0; i < count; i++) sents.push(loremSentence());
  return sents.join(' ');
}

function generateLorem() {
  const type       = document.getElementById('lorem-type').value;
  const count      = Math.min(500, Math.max(1, parseInt(document.getElementById('lorem-count').value, 10) || 3));
  const withStart  = document.getElementById('lorem-start').checked;

  let parts = [];

  for (let i = 0; i < count; i++) {
    if (type === 'words') {
      parts.push(loremWord());
    } else if (type === 'sentences') {
      parts.push(loremSentence());
    } else {
      parts.push(loremParagraph());
    }
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
