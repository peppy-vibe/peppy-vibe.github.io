/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PEPPY RANDOM TOOLS â€” app.js
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

'use strict';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   THEME
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('stp-theme', next);
  updateThemeBtn();
  // Redraw wheel with new theme colors if visible
  if (wheelOptions.length) buildWheel();
}
function updateThemeBtn() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = isDark ? '\u2600 Light' : '\u263E Dark';
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   SIDEBAR NAVIGATION
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function showTool(id) {
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('tool-' + id);
  if (panel) panel.classList.add('active');
  document.querySelectorAll('[data-tool="' + id + '"]').forEach(b => b.classList.add('active'));
  // Update top nav active group
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
  // Expand the group and scroll to it
  const el = document.getElementById('grp-' + grp);
  if (el) {
    el.classList.remove('collapsed');
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  document.querySelectorAll('.grp-nav-btn').forEach(b => b.classList.remove('active'));
  const navBtn = document.querySelector('.grp-nav-btn[data-grp="' + grp + '"]');
  if (navBtn) navBtn.classList.add('active');
  // Show first tool in group
  const firstTool = el && el.querySelector('.tab-btn');
  if (firstTool) showTool(firstTool.getAttribute('data-tool'));
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   UTILITIES
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function getLines(id) {
  return document.getElementById(id).value
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function clearEl(id) {
  const el = document.getElementById(id);
  if (el) { el.innerHTML = ''; el.style.display = 'none'; }
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function setMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'tool-msg' + (type ? ' ' + type : '');
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   1. WHEEL SPINNER
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
let wheelOptions = ['Apple', 'Banana', 'Cherry', 'Option D', 'Option E', 'Option F'];
let wheelAngle = 0;
let wheelSpinning = false;
const wheelHistory = [];
let wheelAF = null;

const WHEEL_COLORS_DARK  = ['#5646F5','#e85d6a','#f5a623','#22c55e','#06b6d4','#a855f7','#f97316','#14b8a6','#ec4899','#84cc16'];
const WHEEL_COLORS_LIGHT = ['#5646F5','#e03030','#d97706','#16a34a','#0891b2','#9333ea','#ea580c','#0d9488','#db2777','#65a30d'];

function getWheelColors() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return dark ? WHEEL_COLORS_DARK : WHEEL_COLORS_LIGHT;
}

function buildWheel() {
  const raw = document.getElementById('wheel-options').value
    .split('\n').map(s => s.trim()).filter(s => s.length > 0);
  if (raw.length < 2) { alert('Please enter at least 2 options.'); return; }
  wheelOptions = raw;
  drawWheel(wheelAngle);
}

function drawWheel(angle) {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const r = cx - 6;
  const n = wheelOptions.length;
  const arc = (2 * Math.PI) / n;
  const colors = getWheelColors();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fillStyle = '#eee';
  ctx.fill();
  ctx.restore();

  for (let i = 0; i < n; i++) {
    const startA = angle + i * arc - Math.PI / 2;
    const endA = startA + arc;

    // Sector
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startA, endA);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startA + arc / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + Math.max(10, Math.min(14, Math.floor(r / n * 1.2))) + 'px Segoe UI, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;
    const label = wheelOptions[i].length > 16 ? wheelOptions[i].substring(0, 15) + '\u2026' : wheelOptions[i];
    ctx.fillText(label, r - 12, 5);
    ctx.restore();
  }

  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  ctx.fillStyle = isDark ? '#1e1e1e' : '#ffffff';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function spinWheel() {
  if (wheelSpinning) return;
  if (wheelOptions.length < 2) { buildWheel(); return; }
  wheelSpinning = true;
  document.getElementById('spin-btn').disabled = true;
  document.getElementById('wheel-result').textContent = '';

  const totalRotation = (5 + Math.random() * 5) * 2 * Math.PI; // 5-10 full rotations
  const startAngle = wheelAngle;
  const endAngle = startAngle + totalRotation;
  const duration = 4000 + Math.random() * 1500;
  const startTime = performance.now();

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function frame(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    wheelAngle = startAngle + totalRotation * easeOut(progress);
    drawWheel(wheelAngle);

    if (progress < 1) {
      wheelAF = requestAnimationFrame(frame);
    } else {
      wheelSpinning = false;
      document.getElementById('spin-btn').disabled = false;
      // Determine winner: pointer is at top (fixed at -PI/2)
      const arc = (2 * Math.PI) / wheelOptions.length;
      // The relative angle of the pointer to the wheel's rotation
      const relAngle = ((-wheelAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const winnerIdx = Math.floor(relAngle / arc) % wheelOptions.length;
      const winner = wheelOptions[winnerIdx];
      document.getElementById('wheel-result').textContent = '\uD83C\uDF89 ' + winner + '!';

      wheelHistory.push(winner);
      if (wheelHistory.length > 20) wheelHistory.shift();
      renderWheelHistory();
    }
  }

  wheelAF = requestAnimationFrame(frame);
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderWheelHistory() {
  var el = document.getElementById('wheel-history-list');
  if (!el) return;
  el.innerHTML = wheelHistory.slice().reverse().map(function(w, i) {
    var num = wheelHistory.length - i;
    return '<div class="wh-item"><span class="wh-num">#' + num + '</span>' + escHtml(w) + '</div>';
  }).join('');
}

function resetWheel() {
  if (wheelAF) cancelAnimationFrame(wheelAF);
  wheelSpinning = false;
  wheelAngle = 0;
  document.getElementById('spin-btn').disabled = false;
  document.getElementById('wheel-result').textContent = '\u00A0';
  drawWheel(0);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   2. YES / NO GENERATOR
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const yesMessages = [
  'Absolutely!', 'Go for it!', 'Definitely YES!', '100% Yes', 'Do it!',
  'Without a doubt!', 'Yes, yes, yes!', 'The answer is YES'
];
const noMessages = [
  'Definitely NOT.', 'No way!', 'Hard No.', 'Nope.', 'Don\'t do it.',
  'Not a chance!', 'The answer is NO', 'Absolutely not.'
];

function decideYesNo() {
  const isYes = Math.random() < 0.5;
  const display = document.getElementById('yesno-display');
  const msg = document.getElementById('yesno-msg');
  display.className = 'yesno-display';
  // Brief flash
  setTimeout(() => {
    display.textContent = isYes ? 'YES' : 'NO';
    display.classList.add(isYes ? 'yes' : 'no');
    const msgs = isYes ? yesMessages : noMessages;
    msg.textContent = msgs[Math.floor(Math.random() * msgs.length)];
  }, 80);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   3. OPTION PICKER
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function pickOption() {
  const options = getLines('option-list');
  if (options.length < 2) { alert('Enter at least 2 options.'); return; }

  const resultBox = document.getElementById('option-result');
  const resultVal = document.getElementById('option-result-val');
  const listResult = document.getElementById('option-list-result');
  const listDisplay = document.getElementById('option-list-display');

  const picked = options[Math.floor(Math.random() * options.length)];
  resultVal.textContent = picked;
  resultBox.style.display = 'block';

  // Show full list with highlight
  listDisplay.innerHTML = options.map(o =>
    '<div style="padding:4px 8px;margin:2px 0;border-radius:4px;font-size:13px;' +
    (o === picked ? 'background:var(--accent);color:#fff;font-weight:700;' : 'color:var(--text2);') +
    '">' + escHtml(o) + '</div>'
  ).join('');
  listResult.style.display = 'block';
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   4. WINNER PICKER
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const trophies = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49', '\u2B50', '\uD83C\uDFC5'];

function pickWinners() {
  const names = getLines('winner-list');
  const count = parseInt(document.getElementById('winner-count').value) || 1;
  const unique = document.getElementById('winner-unique').checked;

  if (names.length < 1) { alert('Enter at least one name.'); return; }
  if (unique && count > names.length) {
    alert('Count exceeds unique names available.');
    return;
  }

  let pool = [...names];
  const winners = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool[idx]);
    if (unique) pool.splice(idx, 1);
  }

  const wrap = document.getElementById('winner-result-wrap');
  const result = document.getElementById('winner-result');
  result.innerHTML = winners.map((w, i) =>
    '<div class="winner-row' + (i === 0 ? ' first' : '') + '" style="animation-delay:' + (i * 0.1) + 's">' +
    '<span class="w-rank">' + (trophies[i] || '\uD83C\uDF9F\uFE0F') + '</span>' +
    '<span class="w-name">' + escHtml(w) + '</span>' +
    '<span style="margin-left:auto;font-size:12px;color:var(--text2);">Place #' + (i + 1) + '</span>' +
    '</div>'
  ).join('');
  wrap.style.display = 'block';
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   5. NUMBER GENERATOR
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function generateNumbers() {
  const min = parseInt(document.getElementById('num-min').value);
  const max = parseInt(document.getElementById('num-max').value);
  const count = parseInt(document.getElementById('num-count').value) || 1;
  const unique = document.getElementById('num-unique').checked;
  const sort = document.getElementById('num-sort').checked;
  const msgEl = document.getElementById('num-msg');
  const resultEl = document.getElementById('num-result');

  if (isNaN(min) || isNaN(max) || min > max) {
    setMsg('num-msg', 'Invalid min/max range.', 'err'); return;
  }
  const rangeSize = max - min + 1;
  if (unique && count > rangeSize) {
    setMsg('num-msg', 'Count exceeds unique numbers in range.', 'err'); return;
  }

  let numbers = [];
  if (unique) {
    const pool = Array.from({ length: rangeSize }, (_, i) => i + min);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      numbers.push(pool[idx]);
      pool.splice(idx, 1);
    }
  } else {
    for (let i = 0; i < count; i++) {
      numbers.push(randInt(min, max));
    }
  }

  if (sort) numbers.sort((a, b) => a - b);

  resultEl.innerHTML = numbers.map((n, i) =>
    '<div class="num-chip" style="animation-delay:' + (i * 0.04) + 's">' + n + '</div>'
  ).join('');
  msgEl.textContent = count + ' number' + (count > 1 ? 's' : '') + ' generated' + (unique ? ' (unique)' : '') + '.';
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   6. DICE ROLLER
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const D6_DOTS = {
  1: [false,false,false,false,true,false,false,false,false],
  2: [true,false,false,false,false,false,false,false,true],
  3: [true,false,false,false,true,false,false,false,true],
  4: [true,false,true,false,false,false,true,false,true],
  5: [true,false,true,false,true,false,true,false,true],
  6: [true,false,true,true,false,true,true,false,true],
};

function rollDice() {
  const sides = parseInt(document.getElementById('dice-type').value);
  const count = parseInt(document.getElementById('dice-count').value) || 1;
  const results = [];
  for (let i = 0; i < count; i++) results.push(randInt(1, sides));
  const total = results.reduce((a, b) => a + b, 0);

  const resultEl = document.getElementById('dice-result');
  const totalEl = document.getElementById('dice-total');

  resultEl.innerHTML = results.map((val, i) => {
    if (sides === 6) {
      const dots = D6_DOTS[val];
      return '<div class="die d6" style="animation-delay:' + (i * 0.08) + 's;width:52px;height:52px;border-radius:10px;">' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px;width:36px;height:36px;">' +
        dots.map(d => '<div style="width:8px;height:8px;border-radius:50%;background:' + (d ? 'var(--accent)' : 'transparent') + ';margin:auto;"></div>').join('') +
        '</div></div>';
    }
    return '<div class="die" style="animation-delay:' + (i * 0.08) + 's;font-size:' + (sides >= 20 ? '1.1rem' : '1.4rem') + '">' + val + '</div>';
  }).join('');

  totalEl.innerHTML = count > 1 ? 'Total: <strong>' + total + '</strong>  &nbsp; Rolls: ' + results.join(', ') : '';
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   7. COIN FLIP
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
let coinHeads = 0, coinTails = 0;
let coinFlipping = false;

function flipCoin() {
  if (coinFlipping) return;
  coinFlipping = true;
  const isHeads = Math.random() < 0.5;
  const coin = document.getElementById('coin');
  const label = document.getElementById('coin-label');
  const rotations = 4 + Math.floor(Math.random() * 4); // 4-7 full rotations
  const endRot = rotations * 360 + (isHeads ? 0 : 180);
  coin.style.setProperty('--coin-rot', endRot + 'deg');
  coin.classList.remove('flipping');
  void coin.offsetWidth; // reflow
  coin.classList.add('flipping');
  label.textContent = '\u25CF\u25CB\u25CF Flipping...';
  label.style.color = 'var(--text2)';

  setTimeout(() => {
    coinFlipping = false;
    coin.classList.remove('flipping');
    if (isHeads) {
      coinHeads++;
      label.textContent = '\uD83E\uDE99 Heads!';
      label.style.color = '#c8882a';
    } else {
      coinTails++;
      label.textContent = '\uD83E\uDE88 Tails!';
      label.style.color = '#8888a0';
    }
    document.getElementById('coin-heads').textContent = coinHeads;
    document.getElementById('coin-tails').textContent = coinTails;
  }, 1050);
}

function resetCoin() {
  coinHeads = 0; coinTails = 0;
  document.getElementById('coin-heads').textContent = '0';
  document.getElementById('coin-tails').textContent = '0';
  document.getElementById('coin-label').textContent = 'Click the coin or button to flip';
  document.getElementById('coin-label').style.color = '';
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   8. CARD PICKER
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const SUITS = ['\u2665','\u2666','\u2663','\u2660'];
const SUIT_COLORS = ['red','red','black','black'];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
let cardDeck = [];

function buildDeck(withJokers) {
  const deck = [];
  for (let s = 0; s < 4; s++) {
    for (let r = 0; r < 13; r++) {
      deck.push({ rank: RANKS[r], suit: SUITS[s], color: SUIT_COLORS[s] });
    }
  }
  if (withJokers) {
    deck.push({ rank: 'JK', suit: '\u2605', color: 'red' });
    deck.push({ rank: 'JK', suit: '\u2605', color: 'black' });
  }
  return shuffle(deck);
}

function resetDeck() {
  const withJokers = document.getElementById('card-deck-reset').value === 'jokers';
  cardDeck = buildDeck(withJokers);
  document.getElementById('card-msg').textContent = 'Deck reset: ' + cardDeck.length + ' cards.';
  document.getElementById('card-result').innerHTML = '';
}

function pickCards() {
  if (cardDeck.length === 0) resetDeck();
  const count = parseInt(document.getElementById('card-count').value) || 1;
  if (count > cardDeck.length) {
    document.getElementById('card-msg').textContent = 'Only ' + cardDeck.length + ' cards remain. Reset deck.';
    return;
  }
  const picked = cardDeck.splice(0, count);
  document.getElementById('card-msg').textContent = cardDeck.length + ' cards remaining.';

  const resultEl = document.getElementById('card-result');
  resultEl.innerHTML = picked.map((c, i) =>
    '<div class="playing-card ' + c.color + '" style="animation-delay:' + (i * 0.07) + 's">' +
    '<div class="rank-top">' + c.rank + c.suit + '</div>' +
    '<div class="suit-center">' + c.suit + '</div>' +
    '<div class="rank-bot">' + c.rank + c.suit + '</div>' +
    '</div>'
  ).join('');
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   9. DAY PICKER
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function toggleDayMode() {
  const mode = document.querySelector('input[name="day-mode"]:checked').value;
  document.getElementById('day-range-opts').style.display = mode === 'date' ? 'flex' : 'none';
}

function pickDay() {
  const mode = document.querySelector('input[name="day-mode"]:checked').value;
  const count = parseInt(document.getElementById('day-count').value) || 1;
  const resultEl = document.getElementById('day-result');
  const results = [];

  if (mode === 'weekday') {
    for (let i = 0; i < count; i++) {
      results.push(DAYS[randInt(0, 6)]);
    }
    resultEl.innerHTML = '<div class="number-results" style="flex-wrap:wrap;">' +
      results.map((d, i) => '<div class="num-chip" style="animation-delay:' + (i * 0.07) + 's">' + d + '</div>').join('') +
      '</div>';
  } else {
    const fromVal = document.getElementById('day-from').value;
    const toVal = document.getElementById('day-to').value;
    if (!fromVal || !toVal) { alert('Please select from and to dates.'); return; }
    const fromTs = new Date(fromVal).getTime();
    const toTs = new Date(toVal).getTime();
    if (fromTs > toTs) { alert('From date must be before To date.'); return; }
    const dayMs = 86400000;
    const dayRange = Math.floor((toTs - fromTs) / dayMs);
    for (let i = 0; i < count; i++) {
      const d = new Date(fromTs + randInt(0, dayRange) * dayMs);
      results.push(d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    }
    resultEl.innerHTML = '<div class="ordered-list">' +
      results.map((d, i) =>
        '<div class="ordered-item" style="animation-delay:' + (i * 0.07) + 's">' +
        '<div class="order-num">' + (i + 1) + '</div>' + escHtml(d) + '</div>'
      ).join('') +
      '</div>';
  }
  resultEl.style.display = 'block';
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   10. TIME GENERATOR
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function generateTimes() {
  const fromVal = document.getElementById('time-from').value || '00:00';
  const toVal = document.getElementById('time-to').value || '23:59';
  const count = parseInt(document.getElementById('time-count').value) || 1;
  const doSort = document.getElementById('time-sort').checked;
  const unique = document.getElementById('time-unique').checked;
  const incSeconds = document.getElementById('time-seconds').checked;

  const [fh, fm] = fromVal.split(':').map(Number);
  const [th, tm] = toVal.split(':').map(Number);
  const fromMin = fh * 60 + fm;
  const toMin = th * 60 + tm;
  if (fromMin >= toMin) { setMsg('time-msg', 'From time must be before To time.', 'err'); return; }

  const rangeMin = toMin - fromMin;
  if (unique && count > rangeMin) { setMsg('time-msg', 'Too many unique times requested for this range.', 'err'); return; }

  let times = [];
  let pool = unique ? Array.from({ length: rangeMin }, (_, i) => fromMin + i + 1) : null;

  for (let i = 0; i < count; i++) {
    let mins;
    if (unique && pool) {
      const idx = Math.floor(Math.random() * pool.length);
      mins = pool[idx];
      pool.splice(idx, 1);
    } else {
      mins = fromMin + randInt(1, rangeMin);
    }
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const s = incSeconds ? randInt(0, 59) : 0;
    times.push({ total: mins * 60 + s, str: fmt2(h) + ':' + fmt2(m) + (incSeconds ? ':' + fmt2(s) : '') });
  }

  if (doSort) times.sort((a, b) => a.total - b.total);

  document.getElementById('time-result').innerHTML = times.map((t, i) =>
    '<div class="num-chip" style="animation-delay:' + (i * 0.05) + 's;font-size:1rem;">' + t.str + '</div>'
  ).join('');
  setMsg('time-msg', count + ' time' + (count > 1 ? 's' : '') + ' generated.', '');
}

function fmt2(n) { return String(n).padStart(2, '0'); }

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   INIT
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
document.addEventListener('DOMContentLoaded', () => {
  updateThemeBtn();
  // Init wheel with default options
  setTimeout(() => {
    buildWheel();
  }, 50);
  // Init card deck
  cardDeck = buildDeck(false);
});

