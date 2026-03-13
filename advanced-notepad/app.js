'use strict';

/* ── DOM refs ──────────────────────────────── */
const editor    = document.getElementById('editor');
const lineNums  = document.getElementById('line-nums');
const editorWrap = document.getElementById('editor-wrap');
const fileInput = document.getElementById('file-input');

/* ── App state ─────────────────────────────── */
let currentFilename = 'Untitled';
let isModified      = false;
let wordWrap        = true;
let showLN          = false;
let fontSize        = 12;
let previewMode     = false;
let splitMode       = false;
let previewExpanded = false;

/* ── Bootstrap ─────────────────────────────── */
applyFont();
updateStatus();
updateTitle();

/* ── Editor events ─────────────────────────── */
editor.addEventListener('input', onInput);
editor.addEventListener('keydown', onKeydown);
editor.addEventListener('click', updateStatus);
editor.addEventListener('keyup', updateStatus);
editor.addEventListener('scroll', () => { lineNums.scrollTop = editor.scrollTop; });

function onInput() {
  isModified = true;
  updateTitle();
  if (showLN) rebuildLineNums();
  if (previewMode || splitMode) renderPreview();
  updateStatus();
  saveDraft();
}

function onKeydown(e) {
  // Tab → insert 2 spaces
  if (e.key === 'Tab' && !e.ctrlKey) {
    e.preventDefault();
    const s = editor.selectionStart, end = editor.selectionEnd;
    editor.setRangeText('  ', s, end, 'end');
    isModified = true;
    updateTitle();
    if (showLN) rebuildLineNums();
    updateStatus();
    return;
  }
  if (!e.ctrlKey) {
    if (e.key === 'Escape') closeDialogs();
    return;
  }
  const k = e.key.toLowerCase();
  // Ctrl+Shift combos
  if (e.shiftKey) {
    if (k === 'p') { e.preventDefault(); toggleSplit(); return; }
    if (k === 'd') { e.preventDefault(); insertDateTime(); return; }
  }
  const handlers = {
    'n': newFile,
    'o': openFile,
    's': e.shiftKey ? saveFileAs : saveFile,
    'a': selectAll,
    'f': openFind,
    'h': openReplace,
    'p': togglePreview,
  };
  if (handlers[k] && !e.shiftKey) { e.preventDefault(); handlers[k](); return; }
  if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn(); return; }
  if (e.key === '-')                  { e.preventDefault(); zoomOut(); return; }
  if (e.key === '0')                  { e.preventDefault(); zoomReset(); return; }
}

/* ── File operations ───────────────────────── */
function newFile() {
  if (isModified && !confirm('Discard unsaved changes?')) return;
  editor.value = '';
  currentFilename = 'Untitled';
  isModified = false;
  if (showLN) rebuildLineNums();
  updateTitle();
  updateStatus();
  editor.focus();
}

function openFile() {
  fileInput.click();
}

function handleFileOpen(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (isModified && !confirm('Discard unsaved changes?')) {
    fileInput.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    editor.value = ev.target.result;
    currentFilename = file.name;
    isModified = false;
    if (showLN) rebuildLineNums();
    updateTitle();
    updateStatus();
    editor.focus();
  };
  reader.onerror = () => alert('Could not read file.');
  reader.readAsText(file);
  fileInput.value = '';
}

function saveFile() {
  const blob = new Blob([editor.value], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = currentFilename === 'Untitled' ? 'document.txt' : currentFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  isModified = false;
  updateTitle();
}

function saveFileAs() {
  const name = prompt('Save as:', currentFilename === 'Untitled' ? 'document.txt' : currentFilename);
  if (name == null || name.trim() === '') return;
  currentFilename = name.trim();
  saveFile();
}

/* ── Edit operations ───────────────────────── */
function doUndo()  { editor.focus(); document.execCommand('undo'); }
function doRedo()  { editor.focus(); document.execCommand('redo'); }
function doCut()  { editor.focus(); document.execCommand('cut');  }
function doCopy() { editor.focus(); document.execCommand('copy'); }

function doPaste() {
  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard.readText().then(text => {
      editor.focus();
      const s = editor.selectionStart, end = editor.selectionEnd;
      editor.setRangeText(text, s, end, 'end');
      onInput();
    }).catch(() => {
      editor.focus();
      try { document.execCommand('paste'); } catch (_) {}
    });
  } else {
    editor.focus();
    try { document.execCommand('paste'); } catch (_) {}
  }
}

function selectAll() {
  editor.focus();
  editor.select();
  updateStatus();
}

function deleteSelection() {
  const s = editor.selectionStart;
  const e2 = editor.selectionEnd;
  if (s === e2) return;
  const v = editor.value;
  editor.value = v.slice(0, s) + v.slice(e2);
  editor.selectionStart = editor.selectionEnd = s;
  isModified = true;
  updateTitle();
  if (showLN) rebuildLineNums();
  updateStatus();
}

/* ── Format ────────────────────────────────── */
function toggleWordWrap() {
  wordWrap = !wordWrap;
  editor.style.whiteSpace    = wordWrap ? 'pre-wrap' : 'pre';
  editor.style.overflowX     = wordWrap ? 'hidden'   : 'auto';
  document.getElementById('ww-check').textContent = wordWrap ? '\u2713' : '';
  document.getElementById('sb-ww').textContent    = 'Word Wrap: ' + (wordWrap ? 'On' : 'Off');
}

function toggleLineNumbers() {
  showLN = !showLN;
  editorWrap.classList.toggle('show-ln', showLN);
  document.getElementById('ln-check').textContent = showLN ? '\u2713' : '';
  if (showLN) rebuildLineNums();
}

function applyFont() {
  const family = document.getElementById('sel-font').value;
  const size   = parseInt(document.getElementById('sel-size').value, 10);
  fontSize = size;
  editor.style.fontFamily   = family;
  editor.style.fontSize     = size + 'px';
  lineNums.style.fontFamily = family;
  lineNums.style.fontSize   = size + 'px';
}

function zoomIn()    { setZoom(Math.min(fontSize + 2, 72)); }
function zoomOut()   { setZoom(Math.max(fontSize - 2, 8));  }
function zoomReset() { setZoom(12); }

function setZoom(n) {
  fontSize = n;
  document.getElementById('sel-size').value = n;
  applyFont();
  const zbEl = document.getElementById('sb-zoom');
  if (zbEl) zbEl.textContent = Math.round((n / 12) * 100) + '%';
}

/* ── Line numbers ──────────────────────────── */
function rebuildLineNums() {
  const count = editor.value.split('\n').length;
  let html = '';
  for (let i = 1; i <= count; i++) html += '<div>' + i + '</div>';
  lineNums.innerHTML = html;
}

/* ── Status bar ────────────────────────────── */
function updateStatus() {
  const val    = editor.value;
  const pos    = editor.selectionStart;
  const selEnd = editor.selectionEnd;
  const before = val.substring(0, pos);
  const lines  = before.split('\n');
  const ln     = lines.length;
  const col    = lines[lines.length - 1].length + 1;
  const total  = val.split('\n').length;
  const chars  = val.length;
  const selLen = selEnd - pos;

  document.getElementById('sb-pos').textContent   = `Ln ${ln}, Col ${col}`;
  document.getElementById('sb-sel').textContent   = selLen > 0 ? `Sel ${selLen}` : '';
  document.getElementById('sb-chars').textContent = `${chars} char${chars !== 1 ? 's' : ''}`;
  document.getElementById('sb-lines').textContent = `${total} line${total !== 1 ? 's' : ''}`;
  document.getElementById('sb-file').textContent  = (isModified ? '\u25cf ' : '') + currentFilename;
  const words = val.trim() === '' ? 0 : val.trim().split(/\s+/).length;
  const wdEl = document.getElementById('sb-words');
  if (wdEl) wdEl.textContent = `${words} word${words !== 1 ? 's' : ''}`;
  const zbEl = document.getElementById('sb-zoom');
  if (zbEl) zbEl.textContent = Math.round((fontSize / 12) * 100) + '%';
}

function updateTitle() {
  document.title = (isModified ? '\u25cf ' : '') + currentFilename + ' \u2014 Peppy Advanced Notepad';
}

/* ── Menu bar ──────────────────────────────── */
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('mousedown', (e) => {
    // If the user is clicking a button inside the dropdown, let the click event
    // fire normally. e.preventDefault() keeps the textarea's focus and selection
    // intact (critical for Cut / Copy / Delete operations).
    // e.stopPropagation() prevents the document-level mousedown from calling
    // closeMenus() before the click event fires (which would hide the dropdown
    // and swallow the click on the button).
    if (e.target.closest('.dropdown button')) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    const wasOpen = item.classList.contains('open');
    closeMenus();
    if (!wasOpen) item.classList.add('open');
  });
});

// Close the open menu after a dropdown button's action has fired.
document.querySelectorAll('.menu-item .dropdown button').forEach(btn => {
  btn.addEventListener('click', closeMenus);
});

document.addEventListener('mousedown', closeMenus);

function closeMenus() {
  document.querySelectorAll('.menu-item.open').forEach(m => m.classList.remove('open'));
}

/* ── Find / Replace ────────────────────────── */
function openFind() {
  closeMenus();
  closeDialogs(false);
  const sel = getSelection();
  if (sel) document.getElementById('find-q').value = sel;
  document.getElementById('find-overlay').classList.add('visible');
  document.getElementById('find-q').focus();
  document.getElementById('find-q').select();
}

function openReplace() {
  closeMenus();
  closeDialogs(false);
  const sel = getSelection();
  if (sel) document.getElementById('rep-find').value = sel;
  document.getElementById('replace-overlay').classList.add('visible');
  document.getElementById('rep-find').focus();
  document.getElementById('rep-find').select();
}

function getSelection() {
  const s   = editor.selectionStart;
  const e2  = editor.selectionEnd;
  const txt = editor.value.substring(s, e2);
  return txt.length > 0 && !txt.includes('\n') ? txt : '';
}

function overlayClick(e, id) {
  if (e.target.id === id) closeDialogs();
}

function closeDialogs(focusEditor) {
  document.getElementById('find-overlay').classList.remove('visible');
  document.getElementById('replace-overlay').classList.remove('visible');
  if (focusEditor !== false) editor.focus();
}

function findKeydown(e) {
  if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? findPrev() : findNext(); }
  if (e.key === 'Escape') closeDialogs();
}

function buildRegex(term, caseSensitive, wholeWord) {
  if (!term) return null;
  let pat = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (wholeWord) pat = '\\b' + pat + '\\b';
  return new RegExp(pat, caseSensitive ? 'g' : 'gi');
}

function findNext() {
  const term  = document.getElementById('find-q').value;
  const cs    = document.getElementById('find-case').checked;
  const ww    = document.getElementById('find-word').checked;
  const msgEl = document.getElementById('find-msg');
  if (!term) return;

  const text  = editor.value;
  const rx    = buildRegex(term, cs, ww);
  if (!rx) return;

  const matches = [...text.matchAll(rx)];
  setFindMsg(msgEl, matches, term);
  if (!matches.length) return;

  const from  = editor.selectionEnd;
  let   match = matches.find(m => m.index >= from) || matches[0];
  highlightMatch(match, matches);
}

function findPrev() {
  const term  = document.getElementById('find-q').value;
  const cs    = document.getElementById('find-case').checked;
  const ww    = document.getElementById('find-word').checked;
  const msgEl = document.getElementById('find-msg');
  if (!term) return;

  const text    = editor.value;
  const rx      = buildRegex(term, cs, ww);
  if (!rx) return;

  const matches = [...text.matchAll(rx)];
  setFindMsg(msgEl, matches, term);
  if (!matches.length) return;

  const from  = editor.selectionStart;
  let   match = [...matches].reverse().find(m => m.index < from) || matches[matches.length - 1];
  highlightMatch(match, matches);
}

function findNextFromReplace() {
  const term  = document.getElementById('rep-find').value;
  const cs    = document.getElementById('rep-case').checked;
  const msgEl = document.getElementById('rep-msg');
  if (!term) return;

  const text    = editor.value;
  const rx      = buildRegex(term, cs, false);
  if (!rx) return;

  const matches = [...text.matchAll(rx)];
  setFindMsg(msgEl, matches, term);
  if (!matches.length) return;

  const from  = editor.selectionEnd;
  let   match = matches.find(m => m.index >= from) || matches[0];
  highlightMatch(match, matches);
}

function highlightMatch(match, allMatches) {
  editor.focus();
  editor.setSelectionRange(match.index, match.index + match[0].length);
  // Scroll caret into view
  const linesBefore = editor.value.substring(0, match.index).split('\n').length;
  const lh          = parseFloat(getComputedStyle(editor).lineHeight) || (fontSize * 1.5);
  editor.scrollTop  = Math.max(0, (linesBefore - 4) * lh);
  updateStatus();
}

function setFindMsg(el, matches, term) {
  if (!matches.length) {
    el.textContent = `"${term}" not found`;
    el.className   = 'dlg-msg err';
  } else {
    el.textContent = `${matches.length} match${matches.length !== 1 ? 'es' : ''}`;
    el.className   = 'dlg-msg ok';
  }
}

function replaceCurrent() {
  const term    = document.getElementById('rep-find').value;
  const repWith = document.getElementById('rep-with').value;
  const cs      = document.getElementById('rep-case').checked;
  const msgEl   = document.getElementById('rep-msg');
  if (!term) return;

  const text  = editor.value;
  const s     = editor.selectionStart;
  const e2    = editor.selectionEnd;
  const sel   = text.substring(s, e2);
  const match = cs ? sel === term : sel.toLowerCase() === term.toLowerCase();

  if (match) {
    editor.focus();
    editor.setRangeText(repWith, s, e2, 'end');
    isModified = true;
    updateTitle();
    if (showLN) rebuildLineNums();
    updateStatus();
    msgEl.textContent = 'Replaced 1 occurrence';
    msgEl.className   = 'dlg-msg ok';
  }
  findNextFromReplace();
}

function replaceAll() {
  const term    = document.getElementById('rep-find').value;
  const repWith = document.getElementById('rep-with').value;
  const cs      = document.getElementById('rep-case').checked;
  const msgEl   = document.getElementById('rep-msg');
  if (!term) return;

  const rx      = buildRegex(term, cs, false);
  if (!rx) return;

  const original = editor.value;
  const matches  = [...original.matchAll(rx)];

  if (!matches.length) {
    msgEl.textContent = `"${term}" not found`;
    msgEl.className   = 'dlg-msg err';
    return;
  }

  editor.value = original.replace(rx, repWith);
  isModified   = true;
  updateTitle();
  if (showLN) rebuildLineNums();
  updateStatus();
  msgEl.textContent = `Replaced ${matches.length} occurrence${matches.length !== 1 ? 's' : ''}`;
  msgEl.className   = 'dlg-msg ok';
}

/* ── Markdown + LaTeX Preview ──────────────── */
function togglePreview() {
  previewMode = !previewMode;
  editorWrap.classList.toggle('preview-mode', previewMode);
  document.getElementById('prev-check').textContent = previewMode ? '\u2713' : '';
  const btn = document.getElementById('btn-preview');
  if (btn) btn.classList.toggle('active', previewMode);
  if (previewMode) {
    renderPreview();
  } else {
    editor.focus();
  }
}

function renderPreview() {
  if (typeof marked === 'undefined') {
    document.getElementById('preview-pane').textContent = 'Loading preview libraries\u2026';
    return;
  }

  const src = editor.value;

  // Stash math expressions before Markdown parsing (marked would mangle LaTeX)
  const mathStore = [];

  function stashMath(expr, display) {
    mathStore.push({ expr, display });
    return `\x02MATH${mathStore.length - 1}\x03`;
  }

  let safe = src
    // Display math $$...$$ (greedy across lines)
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, e) => stashMath(e, true))
    // Inline math $...$ (single line, avoiding empty matches)
    .replace(/\$([^\n$]+?)\$/g, (_, e) => stashMath(e, false));

  // Render Markdown
  marked.use({ gfm: true, breaks: false });
  let html = marked.parse(safe);

  // Restore math with KaTeX, or raw fallback
  if (typeof katex !== 'undefined') {
    html = html.replace(/\x02MATH(\d+)\x03/g, (_, i) => {
      const { expr, display } = mathStore[+i];
      try {
        return katex.renderToString(expr, { displayMode: display, throwOnError: false });
      } catch {
        const esc = expr.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        return display ? `<pre>$$${esc}$$</pre>` : `<code>$${esc}$</code>`;
      }
    });
  } else {
    html = html.replace(/\x02MATH(\d+)\x03/g, (_, i) => {
      const { expr, display } = mathStore[+i];
      return display ? `<pre>$$${expr}$$</pre>` : `$${expr}$`;
    });
  }

  document.getElementById('preview-pane').innerHTML = html;
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

/* ── Split preview ─────────────────────────── */
function toggleSplit() {
  if (splitMode) {
    hideSplitPreview();
  } else {
    // Exit full-preview if active
    if (previewMode) togglePreview();
    splitMode = true;
    editorWrap.classList.add('split-mode');
    document.getElementById('btn-split').classList.add('active');
    document.getElementById('split-check').textContent = '\u2713';
    renderPreview();
    initSplitter();
    // Sync scroll on editor scroll
    editor.addEventListener('scroll', syncPreviewScroll);
  }
}

function hideSplitPreview() {
  splitMode = false;
  previewExpanded = false;
  editorWrap.classList.remove('split-mode');
  editorWrap.classList.remove('preview-expanded');
  const btn = document.getElementById('btn-split');
  if (btn) btn.classList.remove('active');
  const expandBtn = document.getElementById('btn-prev-expand');
  if (expandBtn) { expandBtn.innerHTML = '&#x2922;'; expandBtn.title = 'Expand to full area'; }
  document.getElementById('split-check').textContent = '';
  editor.removeEventListener('scroll', syncPreviewScroll);
  editor.focus();
}

function togglePreviewExpand() {
  if (!splitMode) return;
  previewExpanded = !previewExpanded;
  editorWrap.classList.toggle('preview-expanded', previewExpanded);
  const btn = document.getElementById('btn-prev-expand');
  if (btn) {
    btn.innerHTML  = previewExpanded ? '&#x2921;' : '&#x2922;';
    btn.title      = previewExpanded ? 'Restore split view' : 'Expand to full area';
  }
}

function syncPreviewScroll() {
  const pane = document.getElementById('preview-pane');
  if (!pane) return;
  const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
  pane.scrollTop = ratio * (pane.scrollHeight - pane.clientHeight);
}

/* ── Splitter drag ─────────────────────────── */
function initSplitter() {
  const splitter    = document.getElementById('pane-splitter');
  const previewPanel = document.getElementById('preview-panel');
  if (!splitter || splitter._initDone) return;
  splitter._initDone = true;

  let dragging = false, startX = 0, startWidth = 0;

  splitter.addEventListener('mousedown', (e) => {
    dragging   = true;
    startX     = e.clientX;
    startWidth = previewPanel.getBoundingClientRect().width;
    splitter.classList.add('dragging');
    document.body.style.cursor    = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const delta = startX - e.clientX;
    const wrapW = editorWrap.getBoundingClientRect().width;
    const newW  = Math.max(160, Math.min(wrapW * 0.75, startWidth + delta));
    previewPanel.style.width = newW + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    splitter.classList.remove('dragging');
    document.body.style.cursor     = '';
    document.body.style.userSelect = '';
  });
}

/* ── Draft auto-save ───────────────────────── */
const DRAFT_KEY = 'stp-notepad-draft';

function saveDraft() {
  try { localStorage.setItem(DRAFT_KEY, editor.value); } catch {}
}

function loadDraft() {
  try {
    const d = localStorage.getItem(DRAFT_KEY);
    if (d && d.length > 0) {
      if (confirm('Restore unsaved draft?')) {
        editor.value = d;
        isModified = true;
        updateTitle();
        if (showLN) rebuildLineNums();
        updateStatus();
        return true;
      }
    }
  } catch {}
  return false;
}

// Restore draft on startup if no file was opened
(function() {
  try {
    const d = localStorage.getItem(DRAFT_KEY);
    if (d && d.trim().length > 0) {
      // Auto-restore silently (no confirm needed on initial load)
      editor.value = d;
      isModified = false;   // draft doesn't count as "modified"
      if (showLN) rebuildLineNums();
      updateStatus();
    }
  } catch {}
})();

/* ── Markdown → HTML Export ────────────────── */
function exportAsHtml() {
  if (typeof marked === 'undefined') { alert('Preview libraries not loaded yet — please wait a moment and try again.'); return; }

  const src = editor.value;
  const mathStore = [];
  function stash(expr, display) { mathStore.push({ expr, display }); return `\x02MATH${mathStore.length - 1}\x03`; }

  let safe = src
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, e) => stash(e, true))
    .replace(/\$([^\n$]+?)\$/g, (_, e) => stash(e, false));

  marked.use({ gfm: true, breaks: false });
  let body = marked.parse(safe);

  if (typeof katex !== 'undefined') {
    body = body.replace(/\x02MATH(\d+)\x03/g, (_, i) => {
      const { expr, display } = mathStore[+i];
      try { return katex.renderToString(expr, { displayMode: display, throwOnError: false }); }
      catch { const e2 = expr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); return display ? `<pre>$$${e2}$$</pre>` : `<code>$${e2}$</code>`; }
    });
  }

  const title = currentFilename.replace(/\.[^.]+$/, '') || 'document';
  const full = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title.replace(/</g, '&lt;')}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.css">
<style>
  body { max-width: 860px; margin: 2rem auto; padding: 0 1rem; font-family: 'Segoe UI', system-ui, sans-serif; line-height: 1.75; color: #1e1e1e; }
  pre  { background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 6px; overflow-x: auto; }
  code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-family: Consolas, monospace; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #ccc; padding: 6px 12px; }
  th { background: #f0f0f0; }
  blockquote { border-left: 4px solid #0078d4; margin: 0.8em 0; padding: 4px 12px; background: #f0f6ff; }
  a { color: #0078d4; }
</style>
</head>
<body>
${body}
</body>
</html>`;

  const blob = new Blob([full], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = title + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── Text Case Converter ────────────────────── */
function openCaseConverter() {
  closeMenus();
  document.getElementById('case-overlay').classList.add('visible');
}

function closeCaseConverter() {
  document.getElementById('case-overlay').classList.remove('visible');
  editor.focus();
}

function convertCase(type) {
  const s  = editor.selectionStart;
  const e2 = editor.selectionEnd;
  const hasSel = s !== e2;
  const text = hasSel ? editor.value.substring(s, e2) : editor.value;

  let result;
  switch (type) {
    case 'upper':
      result = text.toUpperCase(); break;
    case 'lower':
      result = text.toLowerCase(); break;
    case 'title':
      result = text.replace(/\b\w/g, c => c.toUpperCase()); break;
    case 'sentence':
      result = text.toLowerCase()
        .replace(/(^\s*)([\w\u00C0-\u024F])/, (_, sp, c) => sp + c.toUpperCase())
        .replace(/([.!?]+\s+)([\w\u00C0-\u024F])/g, (_, p, c) => p + c.toUpperCase());
      break;
    case 'toggle':
      result = [...text].map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join(''); break;
    case 'camel': {
      const words = text.trim().split(/[\s_\-]+/);
      result = words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
      break;
    }
    case 'snake':
      result = text
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[\s\-]+/g, '_')
        .toLowerCase();
      break;
    case 'kebab':
      result = text
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
      break;
    default: return;
  }

  if (hasSel) {
    editor.setRangeText(result, s, e2, 'select');
  } else {
    editor.value = result;
  }
  isModified = true;
  updateTitle();
  if (showLN) rebuildLineNums();
  updateStatus();
  saveDraft();
  closeCaseConverter();
}

/* ── Insert Date/Time (Ctrl+Shift+D) ───────── */
function insertDateTime() {
  const now = new Date();
  const str = now.toLocaleString();
  const s   = editor.selectionStart;
  const end = editor.selectionEnd;
  editor.setRangeText(str, s, end, 'end');
  isModified = true;
  updateTitle();
  if (showLN) rebuildLineNums();
  updateStatus();
  saveDraft();
}

