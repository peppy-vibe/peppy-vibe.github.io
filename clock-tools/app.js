/* ═══════════════════════════════════════════
   PEPPY CLOCK TOOLS — app.js
═══════════════════════════════════════════ */
'use strict';

/* ──────────────────────────────────────────
   THEME
────────────────────────────────────────── */
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('stp-theme', next);
  updateThemeBtn();
}
function updateThemeBtn() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const btn = document.getElementById('theme-btn');
  if (btn) btn.innerHTML = isDark ? '<i class="bi bi-sun" aria-hidden="true"></i>' : '<i class="bi bi-moon-stars" aria-hidden="true"></i>';
}

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
function closeMobileMenu() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

/* ──────────────────────────────────────────
   SIDEBAR NAVIGATION
────────────────────────────────────────── */
function showTool(id) {
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('tool-' + id);
  if (panel) panel.classList.add('active');
  document.querySelectorAll('[data-tool="' + id + '"]').forEach(b => b.classList.add('active'));
  closeMobileMenu();
}

function toggleGroup(grp) {
  const el = document.getElementById('grp-' + grp);
  if (el) el.classList.toggle('collapsed');
}

function jumpGroup(grp) {
  const el = document.getElementById('grp-' + grp);
  if (el) {
    el.classList.remove('collapsed');
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  document.querySelectorAll('.grp-nav-btn').forEach(b => b.classList.remove('active'));
  const navBtn = document.querySelector('.grp-nav-btn[data-grp="' + grp + '"]');
  if (navBtn) navBtn.classList.add('active');
  const firstTool = el && el.querySelector('.tab-btn');
  if (firstTool) showTool(firstTool.getAttribute('data-tool'));
}

/* ──────────────────────────────────────────
   UTILITIES
────────────────────────────────────────── */
function fmt2(n) { return String(n).padStart(2, '0'); }
function fmtMs(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const millis = ms % 1000;
  return fmt2(h) + ':' + fmt2(m) + ':' + fmt2(s) + '.' + String(millis).padStart(3, '0');
}
function fmtTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return fmt2(h) + ':' + fmt2(m) + ':' + fmt2(s);
}
function fmtMmSs(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return fmt2(m) + ':' + fmt2(s);
}

/* ═══════════════════════════════════════════
   1. STOPWATCH
═══════════════════════════════════════════ */
let swRunning = false;
let swStartTime = 0;
let swElapsed = 0;
let swInterval = null;
let swLaps = [];
let swLastLapTime = 0;

function swStart() {
  if (swRunning) return;
  swRunning = true;
  swStartTime = performance.now() - swElapsed;
  swInterval = setInterval(swTick, 10);
  document.getElementById('sw-start-btn').disabled = true;
  document.getElementById('sw-stop-btn').disabled = false;
  document.getElementById('sw-lap-btn').disabled = false;
}

function swTick() {
  swElapsed = performance.now() - swStartTime;
  document.getElementById('sw-display').innerHTML = fmtMs(Math.floor(swElapsed)).replace(/\.(\d+)$/, '<span class="ms">.$1</span>');
}

function swStop() {
  if (!swRunning) return;
  swRunning = false;
  clearInterval(swInterval);
  document.getElementById('sw-start-btn').disabled = false;
  document.getElementById('sw-stop-btn').disabled = true;
  document.getElementById('sw-lap-btn').disabled = true;
}

function swLap() {
  if (!swRunning) return;
  const current = Math.floor(swElapsed);
  const diff = current - swLastLapTime;
  swLastLapTime = current;
  swLaps.push({ total: current, diff: diff });
  renderSwLaps();
}

function swReset() {
  swStop();
  swElapsed = 0;
  swLastLapTime = 0;
  swLaps = [];
  document.getElementById('sw-display').innerHTML = '00:00:00<span class="ms">.000</span>';
  document.getElementById('sw-laps').innerHTML = '';
}

function renderSwLaps() {
  const el = document.getElementById('sw-laps');
  el.innerHTML = swLaps.slice().reverse().map((lap, i) => {
    const num = swLaps.length - i;
    return '<div class="lap-item"><span class="lap-num">Lap ' + num + '</span>' +
      '<span class="lap-time">' + fmtMs(lap.total) + '</span>' +
      '<span class="lap-diff">+' + fmtMs(lap.diff) + '</span></div>';
  }).join('');
}

/* ═══════════════════════════════════════════
   2. COUNTDOWN TIMER
═══════════════════════════════════════════ */
let timerTotal = 0;
let timerRemaining = 0;
let timerRunning = false;
let timerInterval = null;
let timerEndTime = 0;

function timerStart() {
  if (timerRunning) return;
  // Request notification permission on first user-initiated timer start
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  if (timerRemaining <= 0) {
    const h = parseInt(document.getElementById('timer-h').value) || 0;
    const m = parseInt(document.getElementById('timer-m').value) || 0;
    const s = parseInt(document.getElementById('timer-s').value) || 0;
    timerTotal = h * 3600 + m * 60 + s;
    timerRemaining = timerTotal;
    if (timerTotal <= 0) { alert('Set a time greater than 0.'); return; }
  }
  timerRunning = true;
  timerEndTime = Date.now() + timerRemaining * 1000;
  document.getElementById('timer-setup').style.display = 'none';
  document.getElementById('timer-display').style.display = '';
  document.getElementById('timer-display').textContent = fmtTime(timerRemaining);
  document.getElementById('timer-start-btn').disabled = true;
  document.getElementById('timer-pause-btn').disabled = false;
  timerInterval = setInterval(timerTick, 200);
}

function timerTick() {
  const remaining = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
  timerRemaining = remaining;
  document.getElementById('timer-display').textContent = fmtTime(remaining);
  const pct = timerTotal > 0 ? (remaining / timerTotal) * 100 : 0;
  document.getElementById('timer-progress').style.width = pct + '%';
  if (remaining <= 0) {
    timerDone();
  }
}

function timerDone() {
  clearInterval(timerInterval);
  timerRunning = false;
  document.getElementById('timer-display').textContent = '00:00:00';
  document.getElementById('timer-progress').style.width = '0%';
  document.getElementById('timer-start-btn').disabled = false;
  document.getElementById('timer-pause-btn').disabled = true;
  // Play notification sound
  playBeep();
  // Try to notify
  if (Notification.permission === 'granted') {
    new Notification('Peppy Timer', { body: 'Time is up!' });
  }
}

function timerPause() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
  timerRemaining = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
  document.getElementById('timer-start-btn').disabled = false;
  document.getElementById('timer-pause-btn').disabled = true;
}

function timerReset() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerRemaining = 0;
  timerTotal = 0;
  document.getElementById('timer-setup').style.display = '';
  document.getElementById('timer-display').style.display = 'none';
  document.getElementById('timer-progress').style.width = '100%';
  document.getElementById('timer-start-btn').disabled = false;
  document.getElementById('timer-pause-btn').disabled = true;
}

function timerPreset(m, s) {
  document.getElementById('timer-h').value = 0;
  document.getElementById('timer-m').value = m;
  document.getElementById('timer-s').value = s;
  timerReset();
}

/* ═══════════════════════════════════════════
   3. WORLD CLOCKS
═══════════════════════════════════════════ */
const WORLD_ZONES = [
  { city: 'Los Angeles', tz: 'America/Los_Angeles' },
  { city: 'Denver', tz: 'America/Denver' },
  { city: 'Chicago', tz: 'America/Chicago' },
  { city: 'New York', tz: 'America/New_York' },
  { city: 'São Paulo', tz: 'America/Sao_Paulo' },
  { city: 'London', tz: 'Europe/London' },
  { city: 'Paris', tz: 'Europe/Paris' },
  { city: 'Istanbul', tz: 'Europe/Istanbul' },
  { city: 'Moscow', tz: 'Europe/Moscow' },
  { city: 'Dubai', tz: 'Asia/Dubai' },
  { city: 'Karachi', tz: 'Asia/Karachi' },
  { city: 'Dhaka', tz: 'Asia/Dhaka' },
  { city: 'Bangkok', tz: 'Asia/Bangkok' },
  { city: 'Singapore', tz: 'Asia/Singapore' },
  { city: 'Tokyo', tz: 'Asia/Tokyo' },
  { city: 'Sydney', tz: 'Australia/Sydney' },
  { city: 'Auckland', tz: 'Pacific/Auckland' },
  { city: 'Honolulu', tz: 'Pacific/Honolulu' },
];

function buildClocks() {
  const grid = document.getElementById('world-clocks');
  if (!grid) return;
  grid.innerHTML = '';
  WORLD_ZONES.forEach(z => {
    const key = z.tz.replace(/\//g, '-').replace(/_/g, '_');
    const card = document.createElement('div');
    card.className = 'clock-card';
    card.innerHTML =
      '<div class="tz-city">' + z.city + '</div>' +
      '<div class="tz-time" id="ct-' + key + '">--:--:--</div>' +
      '<div class="tz-date" id="cd-' + key + '"></div>' +
      '<div class="tz-offset" id="co-' + key + '"></div>';
    grid.appendChild(card);
  });
}

function tickClocks() {
  const now = new Date();
  WORLD_ZONES.forEach(z => {
    const key = z.tz.replace(/\//g, '-').replace(/_/g, '_');
    const timeEl = document.getElementById('ct-' + key);
    const dateEl = document.getElementById('cd-' + key);
    const offEl = document.getElementById('co-' + key);
    if (!timeEl) return;
    try {
      timeEl.textContent = now.toLocaleTimeString('en-US', { timeZone: z.tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      dateEl.textContent = now.toLocaleDateString('en-US', { timeZone: z.tz, weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
      const fmt = new Intl.DateTimeFormat('en-US', { timeZone: z.tz, timeZoneName: 'short' });
      const parts = fmt.formatToParts(now);
      offEl.textContent = parts.find(p => p.type === 'timeZoneName')?.value || z.tz;
    } catch { timeEl.textContent = 'N/A'; }
  });
}

/* ═══════════════════════════════════════════
   4. POMODORO TIMER
═══════════════════════════════════════════ */
let pomoRunning = false;
let pomoInterval = null;
let pomoPhase = 'work'; // 'work', 'short-break', 'long-break'
let pomoRound = 1;
let pomoRemaining = 0;
let pomoTotal = 0;
let pomoEndTime = 0;
let pomoTotalFocused = 0; // seconds of total work time

function getPomoSettings() {
  return {
    work: (parseInt(document.getElementById('pomo-work').value) || 25) * 60,
    shortBreak: (parseInt(document.getElementById('pomo-short').value) || 5) * 60,
    longBreak: (parseInt(document.getElementById('pomo-long').value) || 15) * 60,
    rounds: parseInt(document.getElementById('pomo-rounds').value) || 4
  };
}

function pomoStart() {
  if (pomoRunning) return;
  // Request notification permission on first user-initiated pomodoro start
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  const s = getPomoSettings();
  if (pomoRemaining <= 0) {
    pomoPhase = 'work';
    pomoTotal = s.work;
    pomoRemaining = s.work;
    pomoRound = 1;
    pomoTotalFocused = 0;
  }
  pomoRunning = true;
  pomoEndTime = Date.now() + pomoRemaining * 1000;
  document.getElementById('pomo-start-btn').disabled = true;
  document.getElementById('pomo-pause-btn').disabled = false;
  document.getElementById('pomo-skip-btn').disabled = false;
  pomoInterval = setInterval(pomoTick, 200);
  updatePomoUI();
}

function pomoTick() {
  const remaining = Math.max(0, Math.ceil((pomoEndTime - Date.now()) / 1000));
  pomoRemaining = remaining;
  document.getElementById('pomo-display').textContent = fmtMmSs(remaining);
  const pct = pomoTotal > 0 ? (remaining / pomoTotal) * 100 : 0;
  document.getElementById('pomo-progress').style.width = pct + '%';
  if (remaining <= 0) {
    pomoNextPhase();
  }
}

function pomoNextPhase() {
  clearInterval(pomoInterval);
  pomoRunning = false;
  playBeep();
  const s = getPomoSettings();

  if (pomoPhase === 'work') {
    pomoTotalFocused += s.work;
    if (pomoRound >= s.rounds) {
      pomoPhase = 'long-break';
      pomoTotal = s.longBreak;
      pomoRemaining = s.longBreak;
    } else {
      pomoPhase = 'short-break';
      pomoTotal = s.shortBreak;
      pomoRemaining = s.shortBreak;
    }
  } else {
    if (pomoPhase === 'long-break') {
      pomoRound = 1;
    } else {
      pomoRound++;
    }
    pomoPhase = 'work';
    pomoTotal = s.work;
    pomoRemaining = s.work;
  }

  updatePomoUI();
  document.getElementById('pomo-display').textContent = fmtMmSs(pomoRemaining);
  document.getElementById('pomo-progress').style.width = '100%';
  document.getElementById('pomo-start-btn').disabled = false;
  document.getElementById('pomo-pause-btn').disabled = true;
  document.getElementById('pomo-skip-btn').disabled = true;

  if (Notification.permission === 'granted') {
    const msg = pomoPhase === 'work' ? 'Break over — time to focus!' :
      (pomoPhase === 'long-break' ? 'Great work! Take a long break.' : 'Good job! Short break time.');
    new Notification('Pomodoro', { body: msg });
  }
}

function pomoPause() {
  if (!pomoRunning) return;
  clearInterval(pomoInterval);
  pomoRunning = false;
  pomoRemaining = Math.max(0, Math.ceil((pomoEndTime - Date.now()) / 1000));
  document.getElementById('pomo-start-btn').disabled = false;
  document.getElementById('pomo-pause-btn').disabled = true;
}

function pomoSkip() {
  clearInterval(pomoInterval);
  pomoRunning = false;
  if (pomoPhase === 'work') {
    const elapsed = pomoTotal - pomoRemaining;
    pomoTotalFocused += elapsed;
  }
  pomoRemaining = 0;
  pomoNextPhase();
}

function pomoReset() {
  clearInterval(pomoInterval);
  pomoRunning = false;
  pomoPhase = 'work';
  pomoRound = 1;
  pomoTotalFocused = 0;
  const s = getPomoSettings();
  pomoTotal = s.work;
  pomoRemaining = s.work;
  updatePomoUI();
  document.getElementById('pomo-display').textContent = fmtMmSs(s.work);
  document.getElementById('pomo-progress').style.width = '100%';
  document.getElementById('pomo-start-btn').disabled = false;
  document.getElementById('pomo-pause-btn').disabled = true;
  document.getElementById('pomo-skip-btn').disabled = true;
}

/**
 * Re-applies pomo settings to the current phase when the timer is idle or paused.
 * Called by onchange on each pomo settings input.
 */
function applyPomoSettings() {
  if (pomoRunning) return; // don't interrupt a running timer
  const s = getPomoSettings();
  // Update the current phase's total and remaining time
  if (pomoPhase === 'work')        { pomoTotal = s.work;       pomoRemaining = s.work; }
  else if (pomoPhase === 'short-break') { pomoTotal = s.shortBreak; pomoRemaining = s.shortBreak; }
  else                             { pomoTotal = s.longBreak;  pomoRemaining = s.longBreak; }
  document.getElementById('pomo-display').textContent = fmtMmSs(pomoRemaining);
  document.getElementById('pomo-progress').style.width = '100%';
  updatePomoUI();
}

function updatePomoUI() {
  const s = getPomoSettings();
  const statusEl = document.getElementById('pomo-status');
  const progressEl = document.getElementById('pomo-progress');
  if (pomoPhase === 'work') {
    statusEl.textContent = 'Work Session';
    statusEl.className = 'pomo-status';
    progressEl.style.background = 'var(--accent)';
  } else if (pomoPhase === 'short-break') {
    statusEl.textContent = 'Short Break';
    statusEl.className = 'pomo-status break';
    progressEl.style.background = '#22c55e';
  } else {
    statusEl.textContent = 'Long Break';
    statusEl.className = 'pomo-status break';
    progressEl.style.background = '#22c55e';
  }
  document.getElementById('pomo-round-label').textContent = 'Round ' + pomoRound + ' / ' + s.rounds;
  document.getElementById('pomo-total-label').textContent = 'Total: ' + Math.round(pomoTotalFocused / 60) + ' min focused';
}

/* ═══════════════════════════════════════════
   5. ALARM
═══════════════════════════════════════════ */
let alarmTimeout = null;
let alarmTime = null;
let alarmAudioCtx = null;
let alarmOsc = null;
const alarmHistory = [];

function updateCurrentTime() {
  const el = document.getElementById('alarm-current-time');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  }
}

function setAlarm() {
  const timeVal = document.getElementById('alarm-time').value;
  if (!timeVal) { alert('Please set a time.'); return; }

  const [h, m] = timeVal.split(':').map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  const ms = target - now;
  alarmTime = target;
  alarmTimeout = setTimeout(triggerAlarm, ms);

  const label = document.getElementById('alarm-label').value || 'Alarm';
  document.getElementById('alarm-status').textContent = '⏰ Alarm set for ' + target.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' — ' + label;
  document.getElementById('alarm-status').className = 'tool-msg ok';
  document.getElementById('alarm-set-btn').disabled = true;
  document.getElementById('alarm-cancel-btn').disabled = false;

  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function cancelAlarm() {
  if (alarmTimeout) { clearTimeout(alarmTimeout); alarmTimeout = null; }
  stopAlarmSound();
  document.getElementById('alarm-status').textContent = 'Alarm cancelled.';
  document.getElementById('alarm-status').className = 'tool-msg';
  document.getElementById('alarm-set-btn').disabled = false;
  document.getElementById('alarm-cancel-btn').disabled = true;
  document.getElementById('alarm-ringing').style.display = 'none';
}

function triggerAlarm() {
  const label = document.getElementById('alarm-label').value || 'Alarm';
  document.getElementById('alarm-ringing').style.display = '';
  document.getElementById('alarm-ring-label').textContent = label;
  playAlarmSound();

  if (Notification.permission === 'granted') {
    new Notification('Peppy Alarm', { body: label });
  }

  alarmHistory.unshift({ time: new Date().toLocaleTimeString(), label: label });
  renderAlarmHistory();
}

function dismissAlarm() {
  stopAlarmSound();
  document.getElementById('alarm-ringing').style.display = 'none';
  document.getElementById('alarm-status').textContent = '';
  document.getElementById('alarm-set-btn').disabled = false;
  document.getElementById('alarm-cancel-btn').disabled = true;
  alarmTimeout = null;
}

function renderAlarmHistory() {
  const el = document.getElementById('alarm-history');
  if (!el) return;
  el.innerHTML = alarmHistory.slice(0, 20).map((a, i) =>
    '<div class="lap-item"><span class="lap-num">#' + (i + 1) + '</span>' +
    '<span class="lap-time">' + a.time + '</span>' +
    '<span class="lap-diff">' + a.label.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span></div>'
  ).join('');
}

/* ──────────────────────────────────────────
   AUDIO — Web Audio API beep sequences
────────────────────────────────────────── */
/**
 * Play a three-pulse ascending notification beep (~1.5 s total).
 * Used by both Countdown Timer and Pomodoro when a phase ends.
 */
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Three tones: 660 Hz → 880 Hz → 1100 Hz, each 300 ms on / 150 ms gap
    const tones = [660, 880, 1100];
    tones.forEach((freq, i) => {
      const start = i * 0.45; // 300 ms on + 150 ms off = 450 ms per tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + start + 0.02);
      gain.gain.setValueAtTime(0.4, ctx.currentTime + start + 0.28);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + 0.30);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + 0.31);
    });
    // Close context after all tones finish
    setTimeout(() => { try { ctx.close(); } catch (_) {} }, 1600);
  } catch (_) { /* Web Audio not available */ }
}

function playAlarmSound() {
  try {
    alarmAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    alarmOsc = alarmAudioCtx.createOscillator();
    const gain = alarmAudioCtx.createGain();
    alarmOsc.connect(gain);
    gain.connect(alarmAudioCtx.destination);
    alarmOsc.frequency.value = 880;
    gain.gain.value = 0.3;
    // Pulsing alarm sound
    const lfo = alarmAudioCtx.createOscillator();
    const lfoGain = alarmAudioCtx.createGain();
    lfo.frequency.value = 4;
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain);
    lfoGain.connect(alarmOsc.frequency);
    lfo.start();
    alarmOsc.start();
  } catch (e) { /* Audio not available */ }
}

function stopAlarmSound() {
  try {
    if (alarmOsc) { alarmOsc.stop(); alarmOsc = null; }
    if (alarmAudioCtx) { alarmAudioCtx.close(); alarmAudioCtx = null; }
  } catch (e) { /* ignore */ }
}

/* ──────────────────────────────────────────
   INIT
────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  updateThemeBtn();
  buildClocks();
  setInterval(tickClocks, 1000);
  tickClocks();
  setInterval(updateCurrentTime, 1000);
  updateCurrentTime();
});
