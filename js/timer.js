/**
 * StudentOS - Focus Timer (Pomodoro) Module
 * Accurate timestamp-based countdown, session counters, audio chime, and focus history tracking.
 */

import { storage } from './storage.js';

let timerMode = 'focus'; // 'focus', 'shortBreak', 'longBreak'
let isRunning = false;
let timerInterval = null;
let targetEndTime = null;
let remainingSeconds = 25 * 60;
let completedSessionsToday = 0;
let currentSubject = 'General Study';

export function initTimer() {
  bindEvents();
  loadPresets();
  updateTimerDisplay();
  renderFocusStats();
}

function loadPresets() {
  const settings = storage.getSettings();
  if (timerMode === 'focus') {
    remainingSeconds = (settings.focusMinutes || 25) * 60;
  } else if (timerMode === 'shortBreak') {
    remainingSeconds = (settings.shortBreakMinutes || 5) * 60;
  } else if (timerMode === 'longBreak') {
    remainingSeconds = (settings.longBreakMinutes || 15) * 60;
  }
}

function bindEvents() {
  // Mode selection buttons
  const modeButtons = document.querySelectorAll('.timer-mode-btn');
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (isRunning) {
        if (!confirm('A session is currently in progress. Switch mode?')) return;
        pauseTimer();
      }
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      timerMode = btn.getAttribute('data-mode') || 'focus';
      loadPresets();
      updateTimerDisplay();
    });
  });

  // Start / Pause button
  const toggleBtn = document.getElementById('timer-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (isRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
    });
  }

  // Reset button
  const resetBtn = document.getElementById('timer-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      pauseTimer();
      loadPresets();
      updateTimerDisplay();
    });
  }

  // Subject tag selector
  const subjectSelect = document.getElementById('timer-subject-select');
  if (subjectSelect) {
    subjectSelect.addEventListener('change', (e) => {
      currentSubject = e.target.value;
    });
  }
}

function startTimer() {
  if (remainingSeconds <= 0) loadPresets();

  isRunning = true;
  targetEndTime = Date.now() + remainingSeconds * 1000;

  const toggleBtn = document.getElementById('timer-toggle-btn');
  if (toggleBtn) {
    toggleBtn.innerHTML = `<i data-lucide="pause"></i> Pause`;
    toggleBtn.classList.remove('btn-primary');
    toggleBtn.classList.add('btn-secondary');
  }

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const now = Date.now();
    const diff = Math.max(0, Math.round((targetEndTime - now) / 1000));
    remainingSeconds = diff;
    updateTimerDisplay();

    if (remainingSeconds <= 0) {
      handleSessionComplete();
    }
  }, 250);

  if (window.lucide) window.lucide.createIcons();
}

function pauseTimer() {
  isRunning = false;
  clearInterval(timerInterval);

  const toggleBtn = document.getElementById('timer-toggle-btn');
  if (toggleBtn) {
    toggleBtn.innerHTML = `<i data-lucide="play"></i> Start`;
    toggleBtn.classList.remove('btn-secondary');
    toggleBtn.classList.add('btn-primary');
  }

  if (window.lucide) window.lucide.createIcons();
}

function handleSessionComplete() {
  pauseTimer();
  playChime();

  const settings = storage.getSettings();

  if (timerMode === 'focus') {
    completedSessionsToday++;
    const duration = settings.focusMinutes || 25;
    storage.recordFocusSession({
      durationMinutes: duration,
      subject: currentSubject
    });
    window.showToast(`🎉 Focus session completed! Take a well-deserved break.`, 'success');
  } else {
    window.showToast(`☕ Break completed! Ready to get back into focus?`, 'info');
  }

  renderFocusStats();
  if (window.refreshAllViews) window.refreshAllViews();
}

function updateTimerDisplay() {
  const displayEl = document.getElementById('timer-time-display');
  const sessionLabel = document.getElementById('timer-session-label');

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  if (displayEl) displayEl.textContent = formatted;

  if (sessionLabel) {
    if (timerMode === 'focus') sessionLabel.textContent = `Focusing on ${currentSubject}`;
    else if (timerMode === 'shortBreak') sessionLabel.textContent = 'Short Break';
    else sessionLabel.textContent = 'Long Rest & Recharge';
  }

  // Update browser document title while active
  if (isRunning) {
    document.title = `(${formatted}) StudentOS — Focus`;
  } else {
    document.title = `StudentOS — Student Productivity Platform`;
  }
}

function renderFocusStats() {
  const history = storage.getFocusHistory();
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = history.filter(s => s.date === todayStr);

  const todayMinutes = todaySessions.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);
  const totalHours = (todayMinutes / 60).toFixed(1);

  const sessionCountEl = document.getElementById('timer-stat-sessions');
  const todayHoursEl = document.getElementById('timer-stat-today-hours');
  const streakEl = document.getElementById('timer-stat-streak');

  if (sessionCountEl) sessionCountEl.textContent = todaySessions.length || completedSessionsToday;
  if (todayHoursEl) todayHoursEl.textContent = `${totalHours}h`;
  if (streakEl) streakEl.textContent = `5 Days`;
}

// Pleasant bell chime using Web Audio API (no external audio files needed!)
function playChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 1.2);
  } catch (e) {
    console.log('Audio playback prevented or unsupported');
  }
}

export function reloadTimerPresets() {
  loadPresets();
  updateTimerDisplay();
}
