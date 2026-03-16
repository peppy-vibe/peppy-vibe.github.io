/* ═══════════════════════════════════════════
   PEOPLE & GROUP TOOLS — app.js
═══════════════════════════════════════════ */
'use strict';

// ──────────────────────────────────────────
// Security — HTML entity escaping
// Prevents XSS when user-typed names are
// injected into innerHTML templates.
// ──────────────────────────────────────────
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/** Copy text content of a container to clipboard */
function copyResultText(containerId) {
  const el = document.getElementById(containerId);
  if (!el || !el.textContent.trim()) { alert('Nothing to copy.'); return; }
  navigator.clipboard.writeText(el.textContent.trim()).then(
    () => showToast('Copied to clipboard!'),
    () => alert('Copy failed — try selecting manually.')
  );
}
function showToast(msg) {
  let t = document.getElementById('copy-toast');
  if (!t) { t = document.createElement('div'); t.id = 'copy-toast'; t.className = 'copy-toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._tid); t._tid = setTimeout(() => t.classList.remove('show'), 1800);
}

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

/** Toggle fullscreen mode for casting on large screens */
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}
(function initTheme() {
  const t = localStorage.getItem('stp-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = t === 'dark' ? '\u2600' : '\u263E';
})();

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

// ──────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getLines(id) {
  return (document.getElementById(id)?.value || '')
    .split('\n').map(s => s.trim()).filter(Boolean);
}

function clearEl(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = '';
}

function setMsg(id, text, type = '') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'tool-msg' + (type ? ' ' + type : '');
}

// ──────────────────────────────────────────
// Names textarea helpers
// ──────────────────────────────────────────
function countNames(areaId, countId) {
  const n = getLines(areaId).length;
  const el = document.getElementById(countId);
  if (el) el.textContent = n + ' name' + (n !== 1 ? 's' : '');
}

function clearArea(areaId) {
  const el = document.getElementById(areaId);
  if (el) { el.value = ''; el.dispatchEvent(new Event('input')); }
}

/** Prompt user for comma-separated names and append to textarea */
function bulkAddNames(areaId) {
  const raw = prompt('Enter names separated by commas:\n(e.g. Alice, Bob, Carol)');
  if (!raw) return;
  const area = document.getElementById(areaId);
  if (!area) return;
  const newNames = raw.split(',').map(s => s.trim()).filter(Boolean).join('\n');
  area.value = (area.value.trimEnd() ? area.value.trimEnd() + '\n' : '') + newNames;
  area.dispatchEvent(new Event('input'));
}

/** File import — reads .txt or .csv and adds names to textarea */
function importNames(areaId) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt,.csv,text/plain,text/csv';
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      let text = e.target.result || '';
      // Accept comma-or-newline-separated
      const names = text.split(/[\n,;]/).map(s => s.trim()).filter(Boolean);
      const area = document.getElementById(areaId);
      if (!area) return;
      area.value = (area.value.trimEnd() ? area.value.trimEnd() + '\n' : '') + names.join('\n');
      area.dispatchEvent(new Event('input'));
    };
    reader.readAsText(file);
  };
  input.click();
}

/** Export textarea content as .txt file */
function exportText(areaId, filename) {
  const area = document.getElementById(areaId);
  if (!area || !area.value.trim()) { alert('Nothing to export.'); return; }
  downloadText(area.value.trim(), (filename || 'export') + '.txt', 'text/plain');
}

function downloadText(text, filename, mime) {
  const blob = new Blob([text], { type: mime || 'text/plain' });
  const a    = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename });
  a.click();
  URL.revokeObjectURL(a.href);
}

function printResults(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';"><title>Print</title>
    <style>
      body{font-family:Segoe UI,sans-serif;padding:20px;color:#111}
      .team-card{border:1px solid #ccc;padding:10px 16px;margin:8px;display:inline-block;min-width:140px;vertical-align:top;border-radius:4px}
      .team-name{font-weight:700;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid #ccc}
      .member-chip,.ordered-item,.winner-row,.pair-row,.santa-row{padding:4px 8px;background:#f5f5f5;margin:3px 0;border-radius:3px}
      .order-num{background:#5646F5;color:#fff;padding:2px 7px;border-radius:50%;margin-right:8px;font-size:0.85em}
    </style></head><body>`);
  w.document.write(el.innerHTML);
  w.document.write('</body></html>');
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.close(); }, 400);
}

// ──────────────────────────────────────────
// Saved Lists (localStorage)
// ──────────────────────────────────────────
const SAVED_PREFIX = 'ppt-list-';

function getSavedLists() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(SAVED_PREFIX));
  return keys.map(k => ({ key: k, name: k.slice(SAVED_PREFIX.length) }));
}

function refreshSavedSelect() {
  const sel = document.getElementById('savedListSelect');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '<option value="">— select a list —</option>';
  getSavedLists().forEach(({ name }) => {
    sel.insertAdjacentHTML('beforeend', `<option value="${name}">${name}</option>`);
  });
  sel.value = prev || '';
}

function saveCurrentList() {
  // Get the active panel's textarea
  const activePanel = document.querySelector('.tool-panel.active');
  if (!activePanel) return;
  const area = activePanel.querySelector('textarea.io-area:not([readonly])');
  if (!area) { alert('No name list to save on this tool.'); return; }
  const names = area.value.trim();
  if (!names) { alert('Type some names first.'); return; }
  const name = prompt('Name this saved list:');
  if (!name) return;
  const clean = name.trim().replace(/[<>"']/g, '');
  if (!clean) return;
  localStorage.setItem(SAVED_PREFIX + clean, names);
  refreshSavedSelect();
  document.getElementById('savedListSelect').value = clean;
}

function loadSavedList() {
  const sel = document.getElementById('savedListSelect');
  if (!sel || !sel.value) return;
  const names = localStorage.getItem(SAVED_PREFIX + sel.value);
  if (!names) return;
  const activePanel = document.querySelector('.tool-panel.active');
  if (!activePanel) return;
  const area = activePanel.querySelector('textarea.io-area:not([readonly])');
  if (!area) { alert('This tool does not have a name list to load into.'); return; }
  area.value = names;
  area.dispatchEvent(new Event('input'));
}

function renameSavedList() {
  const sel = document.getElementById('savedListSelect');
  if (!sel || !sel.value) { alert('Select a list first.'); return; }
  const newName = prompt('New name:', sel.value);
  if (!newName || !newName.trim()) return;
  const clean = newName.trim().replace(/[<>"']/g, '');
  const data = localStorage.getItem(SAVED_PREFIX + sel.value);
  localStorage.removeItem(SAVED_PREFIX + sel.value);
  localStorage.setItem(SAVED_PREFIX + clean, data);
  refreshSavedSelect();
  document.getElementById('savedListSelect').value = clean;
}

function deleteSavedList() {
  const sel = document.getElementById('savedListSelect');
  if (!sel || !sel.value) { alert('Select a list first.'); return; }
  if (!confirm(`Delete list "${sel.value}"?`)) return;
  localStorage.removeItem(SAVED_PREFIX + sel.value);
  refreshSavedSelect();
}

// ═══════════════════════════════════════════════════════════
// 1. PERSON PICKER
// ═══════════════════════════════════════════════════════════
let personPool = [];
let personHistory = [];
let personPickedSet = new Set();

function pickPerson() {
  const names = getLines('person-names');
  if (!names.length) { setSlotText('person-slot', 'No names to pick from!'); return; }

  const useRR = document.getElementById('person-rr')?.checked;
  const exclLast = document.getElementById('person-exclude-last')?.checked;

  if (useRR) {
    // Replenish pool
    if (!personPool.length) {
      personPool = shuffle([...names]);
      personPickedSet = new Set();
    }
    let idx = 0;
    // Exclude last if requested
    if (exclLast && personHistory.length && personPool.length > 1) {
      const last = personHistory[personHistory.length - 1];
      const nonLast = personPool.filter(n => n !== last);
      idx = personPool.indexOf(nonLast[Math.floor(Math.random() * nonLast.length)]);
    }
    const picked = personPool.splice(idx, 1)[0];
    personPickedSet.add(picked);
    personHistory.push(picked);
    animateSlot('person-slot', picked);
    renderPersonPool(names);
    renderPersonHistory();
  } else {
    let pool = [...names];
    if (exclLast && personHistory.length && pool.length > 1) {
      const last = personHistory[personHistory.length - 1];
      pool = pool.filter(n => n !== last);
    }
    const picked = pool[Math.floor(Math.random() * pool.length)];
    personHistory.push(picked);
    animateSlot('person-slot', picked);
    renderPersonHistory();
  }

  document.getElementById('person-pool-wrap').style.display = 'block';
  document.getElementById('person-export').style.display = 'flex';
}

function renderPersonPool(names) {
  const chips = document.getElementById('person-pool-chips');
  if (!chips) return;
  chips.innerHTML = names.map(n => `<span class="pool-chip${personPickedSet.has(n) ? ' picked' : ''}">${escHtml(n)}</span>`).join('');
}

function resetPersonPool() {
  personPool = [];
  personPickedSet = new Set();
  const names = getLines('person-names');
  renderPersonPool(names);
  setSlotText('person-slot', 'Pool reset — press Pick!');
}

function clearPersonHistory() {
  personHistory = [];
  renderPersonHistory();
  document.getElementById('person-export').style.display = 'none';
}

function renderPersonHistory() {
  const list = document.getElementById('person-history');
  if (!list) return;
  list.innerHTML = personHistory.slice().reverse().map((n, i) => {
    const num = personHistory.length - i;
    return `<div class="history-item"><span class="h-num">#${num}</span>${escHtml(n)}</div>`;
  }).join('');
}

function exportHistory(listId, filename) {
  const items = [...document.querySelectorAll(`#${listId} .history-item`)].map(el => el.textContent);
  if (!items.length) { alert('No history to export.'); return; }
  downloadText(items.join('\n'), filename + '.txt', 'text/plain');
}

// ──────────────────────────────────────────
// Slot animation
// ──────────────────────────────────────────
function animateSlot(slotId, finalName) {
  const el = document.getElementById(slotId);
  if (!el) return;
  const allNames = getLines(el.id === 'person-slot' ? 'person-names' :
                            el.id === 'host-slot'   ? 'host-names'   :
                            el.id === 'att-slot'    ? 'att-names'    :
                            el.id === 'spk-slot'    ? 'spk-names'    : 'person-names');
  let frames = 18;
  const interval = setInterval(() => {
    el.classList.add('spinning-text');
    el.textContent = allNames[Math.floor(Math.random() * allNames.length)] || '…';
    frames--;
    if (frames <= 0) {
      clearInterval(interval);
      el.classList.remove('spinning-text');
      el.textContent = finalName;
    }
  }, 60);
}

function setSlotText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ═══════════════════════════════════════════════════════════
// 2. MEETING HOST PICKER
// ═══════════════════════════════════════════════════════════
let hostPool = [];
let hostHistory = [];
let hostRound = 1;

function pickHost() {
  const names = getLines('host-names');
  if (!names.length) { setSlotText('host-slot', 'No names!'); return; }

  if (!hostPool.length) {
    hostPool = shuffle([...names]);
    hostRound++;
  }

  const picked = hostPool.shift();
  hostHistory.push(picked);
  animateSlot('host-slot', picked);
  renderHostRR(names);
  renderHostHistory();
}

function resetHostHistory() {
  hostPool = [];
  hostHistory = [];
  hostRound = 1;
  setSlotText('host-slot', 'New round — press Pick!');
  renderHostRR(getLines('host-names'));
  clearEl('host-history');
}

function renderHostRR(names) {
  const grid = document.getElementById('host-rr-grid');
  if (!grid) return;
  const hosted = new Set(hostHistory);
  const current = hostHistory[hostHistory.length - 1];
  grid.innerHTML = names.map(n => {
    let cls = hosted.has(n) ? 'done' : '';
    if (n === current) cls = 'current';
    return `<span class="rr-chip ${cls}">${n}</span>`;
  }).join('');
  const label = document.getElementById('host-round-label');
  if (label) label.textContent = `Round ${hostRound} • ${hostPool.length} left`;
}

function renderHostHistory() {
  const list = document.getElementById('host-history');
  if (!list) return;
  list.innerHTML = hostHistory.slice().reverse().map((n, i) => {
    const num = hostHistory.length - i;
    return `<div class="history-item"><span class="h-num">#${num}</span>${n}</div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// 3. ATTENDANCE PICKER
// ═══════════════════════════════════════════════════════════
let attPool = [];
let attPicked = new Set();

function pickAttendance() {
  const names = getLines('att-names');
  if (!names.length) { setSlotText('att-slot', 'No names!'); return; }

  if (!attPool.length) {
    attPool = shuffle([...names]);
    attPicked = new Set();
  }

  const picked = attPool.shift();
  attPicked.add(picked);
  animateSlot('att-slot', picked);
}

function resetAttendancePool() {
  attPool = [];
  attPicked = new Set();
  setSlotText('att-slot', 'Pool reset — press Pick!');
}

function buildRollCall() {
  const names = getLines('att-names');
  if (!names.length) { alert('Enter names first.'); return; }
  const wrap = document.getElementById('roll-call-wrap');
  if (!wrap) return;
  const rows = names.map(n => `
    <tr id="rc-${CSS.escape(n)}">
      <td>${escHtml(n)}</td>
      <td><label class="checkbox-label" style="justify-content:center">
        <input type="checkbox" onchange="rcMarkPresent('${n.replace(/'/g,"\\'")}', this.checked)" /> Present
      </label></td>
    </tr>`).join('');
  wrap.innerHTML = `<table class="attendance-table"><thead><tr><th>Name</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function rcMarkPresent(name, present) {
  const row = document.getElementById('rc-' + CSS.escape(name));
  if (row) row.classList.toggle('picked-row', present);
}

function toggleAllPresent(val) {
  document.querySelectorAll('#roll-call-wrap input[type=checkbox]').forEach(cb => {
    cb.checked = val;
    const name = cb.closest('tr')?.querySelector('td')?.textContent;
    if (name) rcMarkPresent(name, val);
  });
}

function exportRollCall() {
  const rows = [...document.querySelectorAll('#roll-call-wrap tbody tr')];
  if (!rows.length) { alert('Build roll call first.'); return; }
  const lines = ['Name,Status'];
  rows.forEach(row => {
    const name    = row.querySelector('td')?.textContent || '';
    const present = row.querySelector('input')?.checked ? 'Present' : 'Absent';
    lines.push(`"${name}",${present}`);
  });
  downloadText(lines.join('\n'), 'attendance_' + fmtDate() + '.csv', 'text/csv');
}

function fmtDate() {
  const d = new Date();
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

// ═══════════════════════════════════════════════════════════
// 4. SPEAKER SELECTOR
// ═══════════════════════════════════════════════════════════
let spkPool = [];
let spkHistory = [];
let spkDone = new Set();

function selectSpeaker() {
  const names = getLines('spk-names');
  if (!names.length) { setSlotText('spk-slot', 'No names!'); return; }
  const ordered = document.getElementById('spk-order')?.checked;

  if (!spkPool.length) {
    spkPool = ordered ? [...names] : shuffle([...names]);
    spkDone = new Set();
  }
  const picked = spkPool.shift();
  spkDone.add(picked);
  spkHistory.push(picked);
  animateSlot('spk-slot', picked);
  renderSpkRR(names);
  renderSpkHistory();
}

function resetSpeakerHistory() {
  spkPool = [];
  spkHistory = [];
  spkDone = new Set();
  setSlotText('spk-slot', 'Reset — press Select!');
  renderSpkRR(getLines('spk-names'));
  clearEl('spk-history');
}

function renderSpkRR(names) {
  const grid = document.getElementById('spk-rr-grid');
  if (!grid) return;
  const current = spkHistory[spkHistory.length - 1];
  grid.innerHTML = names.map(n => {
    let cls = spkDone.has(n) ? 'done' : '';
    if (n === current) cls = 'current';
    return `<span class="rr-chip ${cls}">${n}</span>`;
  }).join('');
}

function renderSpkHistory() {
  const list = document.getElementById('spk-history');
  if (!list) return;
  list.innerHTML = spkHistory.slice().reverse().map((n, i) => {
    const num = spkHistory.length - i;
    return `<div class="history-item"><span class="h-num">#${num}</span>${n}</div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// 5. WINNER PICKER
// ═══════════════════════════════════════════════════════════
function pickWinners() {
  const entries = getLines('win-names');
  if (!entries.length) { alert('Enter some names first.'); return; }
  const count    = parseInt(document.getElementById('win-count-num')?.value) || 1;
  const allowDup = document.getElementById('win-allow-dupe')?.checked;
  const medals   = ['🥇', '🥈', '🥉'];

  const pool = [...entries];
  const winners = [];
  const usable  = Math.min(count, allowDup ? count : pool.length);

  for (let i = 0; i < usable; i++) {
    const idx  = Math.floor(Math.random() * pool.length);
    const name = pool[idx];
    winners.push(name);
    if (!allowDup) pool.splice(idx, 1);
  }

  const div  = document.getElementById('win-results');
  if (!div) return;
  div.innerHTML = winners.map((name, i) => {
    const rank  = medals[i] || `#${i + 1}`;
    const first = i === 0 ? ' first' : '';
    return `<div class="winner-row${first}"><span class="w-rank">${rank}</span><span class="w-name">${name}</span></div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// 6. TEAM GENERATOR
// ═══════════════════════════════════════════════════════════
function toggleTeamNameInputs() {
  const show = document.getElementById('tg-custom-names')?.checked;
  document.getElementById('tg-custom-names-section').style.display = show ? 'block' : 'none';
}

function generateTeams() {
  const names = shuffle(getLines('tg-names'));
  if (!names.length) { alert('Enter some names first.'); return; }
  const n = parseInt(document.getElementById('tg-num')?.value) || 2;
  if (n < 1) return;

  const customEnabled = document.getElementById('tg-custom-names')?.checked;
  const customNames   = customEnabled ? getLines('tg-team-names') : [];

  const teams = Array.from({ length: n }, () => []);
  names.forEach((name, i) => teams[i % n].push(name));

  const colors = ['#5646F5','#e85d6a','#f5a623','#22c55e','#06b6d4','#a855f7','#f97316','#14b8a6'];
  const div = document.getElementById('tg-results');
  if (!div) return;
  div.innerHTML = teams.map((members, i) => {
    const tName = customNames[i] || `Team ${i + 1}`;
    const color = colors[i % colors.length];
    return `
      <div class="team-card team-${i % 8}">
        <input class="team-name-input" value="${tName}" style="color:${color};border-color:${color}" />
        <div class="team-members">${members.map(m => `<span class="member-chip">${m}</span>`).join('')}</div>
      </div>`;
  }).join('');
}

function exportTeamsText() {
  const cards = document.querySelectorAll('#tg-results .team-card');
  if (!cards.length) { alert('Generate teams first.'); return; }
  const lines = [];
  cards.forEach(card => {
    const name    = card.querySelector('.team-name-input')?.value || 'Team';
    const members = [...card.querySelectorAll('.member-chip')].map(c => c.textContent);
    lines.push(name, ...members.map(m => '  ' + m), '');
  });
  downloadText(lines.join('\n'), 'teams_' + fmtDate() + '.txt', 'text/plain');
}

// ═══════════════════════════════════════════════════════════
// 7. PAIR GENERATOR
// ═══════════════════════════════════════════════════════════
function generatePairs() {
  const arr = shuffle(getLines('pg-names'));
  if (arr.length < 2) { alert('Need at least 2 names to pair.'); return; }
  const pairs = [];
  let i = 0;
  while (i < arr.length - 2) {
    pairs.push([arr[i], arr[i + 1]]);
    i += 2;
  }
  if (arr.length % 2 === 0) {
    pairs.push([arr[arr.length - 2], arr[arr.length - 1]]);
  } else {
    pairs.push([arr[arr.length - 3], arr[arr.length - 2], arr[arr.length - 1]]);
  }

  const div = document.getElementById('pg-results');
  if (!div) return;
  div.innerHTML = pairs.map((p, i) => {
    const names = p.map(n => `<span class="pair-name">${n}</span>`).join('<span class="pair-arrow"> ↔ </span>');
    return `<div class="pair-row"><span class="pair-num">${i + 1}.</span>${names}</div>`;
  }).join('');
}

function exportPairs() {
  const rows = document.querySelectorAll('#pg-results .pair-row');
  if (!rows.length) { alert('Generate pairs first.'); return; }
  const lines = [...rows].map(row => {
    const names = [...row.querySelectorAll('.pair-name')].map(s => s.textContent);
    return names.join(' & ');
  });
  downloadText(lines.join('\n'), 'pairs_' + fmtDate() + '.txt', 'text/plain');
}

// ═══════════════════════════════════════════════════════════
// 8. GROUP CREATOR
// ═══════════════════════════════════════════════════════════
let gcMode = 'by-count';

function toggleGroupMode(val) {
  gcMode = val;
  const lbl = document.getElementById('gc-lbl');
  const inp = document.getElementById('gc-num');
  if (lbl) lbl.textContent = val === 'by-count' ? 'Number of groups:' : 'Group size:';
  if (inp) inp.value = val === 'by-count' ? '3' : '4';
}

function createGroups() {
  const names = shuffle(getLines('gc-names'));
  if (!names.length) { alert('Enter some names first.'); return; }
  const num = parseInt(document.getElementById('gc-num')?.value) || 1;

  let groups;
  if (gcMode === 'by-count') {
    const n = Math.min(num, names.length);
    groups = Array.from({ length: n }, () => []);
    names.forEach((name, i) => groups[i % n].push(name));
  } else {
    groups = [];
    for (let i = 0; i < names.length; i += num) {
      groups.push(names.slice(i, i + num));
    }
  }

  const div = document.getElementById('gc-results');
  if (!div) return;
  div.innerHTML = groups.map((members, i) => `
    <div class="team-card team-${i % 8}">
      <div class="team-name">Group ${i + 1} <span style="font-size:11px;font-weight:400;color:var(--text2)">(${members.length})</span></div>
      <div class="team-members">${members.map(m => `<span class="member-chip">${m}</span>`).join('')}</div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════
// 9. SEATING CHART
// ═══════════════════════════════════════════════════════════
function generateSeating() {
  const names   = shuffle(getLines('seat-names'));
  if (!names.length) { alert('Enter some names first.'); return; }
  const cols      = parseInt(document.getElementById('seat-cols')?.value) || 4;
  const rowLabels = document.getElementById('seat-row-labels')?.checked;
  const showEmpty = document.getElementById('seat-show-empty')?.checked;
  const rows      = Math.ceil(names.length / cols);

  const grid = document.getElementById('seating-grid-display');
  if (!grid) return;

  const totalCols = rowLabels ? cols + 1 : cols;
  grid.style.gridTemplateColumns = `repeat(${totalCols}, auto)`;

  const cells = [];
  for (let r = 0; r < rows; r++) {
    if (rowLabels) {
      cells.push(`<div class="seat row-label">Row ${r + 1}</div>`);
    }
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (idx < names.length) {
        cells.push(`<div class="seat"><span class="seat-num">S${idx + 1}</span>${names[idx]}</div>`);
      } else if (showEmpty) {
        cells.push(`<div class="seat empty">Empty</div>`);
      } else {
        cells.push(`<div style="width:90px"></div>`);
      }
    }
  }
  grid.innerHTML = cells.join('');
}

// ═══════════════════════════════════════════════════════════
// 10. NAME SHUFFLER
// ═══════════════════════════════════════════════════════════
function shuffleNames() {
  const names = getLines('ns-names');
  if (!names.length) { alert('Enter some names first.'); return; }
  const shuffled = shuffle(names);

  document.getElementById('ns-result').value = shuffled.join('\n');

  const display = document.getElementById('ns-result-display');
  if (display) {
    display.innerHTML = shuffled.map((name, i) => `
      <div class="ordered-item" style="animation-delay:${i * 0.04}s">
        <span class="order-num">${i + 1}</span>${name}
      </div>`).join('');
  }
}

// ═══════════════════════════════════════════════════════════
// 11. SECRET SANTA (derangement with exclusions)
// ═══════════════════════════════════════════════════════════
window._santaData = null;

function generateSanta() {
  const names = getLines('ss-names');
  if (names.length < 3) { setMsg('ss-msg', 'Need at least 3 participants.', 'err'); return; }

  // Build exclusion map (bidirectional)
  const exclusionLines = getLines('ss-exclusions');
  const excluded = new Map();
  exclusionLines.forEach(line => {
    const parts = line.split(',').map(s => s.trim());
    if (parts.length >= 2) {
      const [a, b] = parts;
      if (!excluded.has(a)) excluded.set(a, new Set());
      if (!excluded.has(b)) excluded.set(b, new Set());
      excluded.get(a).add(b);
      excluded.get(b).add(a);
    }
  });

  // Try up to 500 derangements
  let assignment = null;
  for (let attempt = 0; attempt < 500; attempt++) {
    const givers    = [...names];
    const receivers = shuffle([...names]);
    const valid = givers.every((g, i) => {
      if (receivers[i] === g) return false;
      if (excluded.has(g) && excluded.get(g).has(receivers[i])) return false;
      return true;
    });
    if (valid) { assignment = { givers, receivers }; break; }
  }

  if (!assignment) {
    setMsg('ss-msg', 'Could not find a valid assignment — try fewer exclusions or more participants.', 'err');
    clearEl('ss-results');
    return;
  }

  setMsg('ss-msg', '');
  window._santaData = assignment;

  const div = document.getElementById('ss-results');
  if (!div) return;
  div.innerHTML = assignment.givers.map((g, i) => `
    <div class="santa-row">
      <span class="santa-giver">${g}</span>
      <span class="santa-arrow">→ 🎁 →</span>
      <span class="santa-receiver" id="santa-rec-${i}" style="filter:blur(8px)">❓</span>
      <button class="santa-reveal" onclick="revealSanta(${i})">Reveal</button>
    </div>`).join('');

  assignment.receivers.forEach((r, i) => {
    const el = document.getElementById(`santa-rec-${i}`);
    if (el) el.setAttribute('data-name', r);
  });
}

function revealSanta(i) {
  const el = document.getElementById(`santa-rec-${i}`);
  if (!el) return;
  const name = el.getAttribute('data-name') || '?';
  el.style.filter = 'none';
  el.textContent  = name;
}

function revealAllSanta() {
  document.querySelectorAll('[id^="santa-rec-"]').forEach(el => {
    const name = el.getAttribute('data-name') || '?';
    el.style.filter = 'none';
    el.textContent  = name;
  });
}

function hideAllSanta() {
  document.querySelectorAll('[id^="santa-rec-"]').forEach(el => {
    el.style.filter = 'blur(8px)';
    el.textContent  = '❓';
  });
}

function exportSanta() {
  const data = window._santaData;
  if (!data) { alert('Generate Secret Santa first.'); return; }
  const lines = data.givers.map((g, i) => `${g} → ${data.receivers[i]}`);
  downloadText('Secret Santa Assignments\n' + '='.repeat(26) + '\n' + lines.join('\n'),
               'secret_santa_' + fmtDate() + '.txt', 'text/plain');
}

// ──────────────────────────────────────────
// Init
// ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  refreshSavedSelect();
  // Init all name counts
  document.querySelectorAll('textarea.io-area[oninput]').forEach(area => {
    area.dispatchEvent(new Event('input'));
  });
});
