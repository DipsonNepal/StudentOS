/**
 * StudentOS - Settings Module
 * Handles themes, profile management, timer presets, JSON export/import, and factory resets.
 */

import { storage } from './storage.js';
import { reloadTimerPresets } from './timer.js';

export function initSettings() {
  loadCurrentSettings();
  bindEvents();
}

function loadCurrentSettings() {
  const settings = storage.getSettings();

  // Theme
  applyTheme(settings.theme || 'dark');
  const darkCard = document.getElementById('theme-card-dark');
  const lightCard = document.getElementById('theme-card-light');
  if (darkCard && lightCard) {
    if (settings.theme === 'light') {
      lightCard.classList.add('active');
      darkCard.classList.remove('active');
    } else {
      darkCard.classList.add('active');
      lightCard.classList.remove('active');
    }
  }

  // Profile
  const nameInput = document.getElementById('setting-profile-name');
  const majorInput = document.getElementById('setting-profile-major');
  if (nameInput) nameInput.value = settings.userName || '';
  if (majorInput) majorInput.value = settings.userMajor || '';

  // Timer settings
  const focusInput = document.getElementById('setting-focus-minutes');
  const shortInput = document.getElementById('setting-short-break');
  const longInput = document.getElementById('setting-long-break');
  if (focusInput) focusInput.value = settings.focusMinutes || 25;
  if (shortInput) shortInput.value = settings.shortBreakMinutes || 5;
  if (longInput) longInput.value = settings.longBreakMinutes || 15;

  // Notification toggle
  const notifToggle = document.getElementById('setting-notifications-toggle');
  if (notifToggle) notifToggle.checked = !!settings.deadlineNotifications;

  // Sound toggle
  const soundToggle = document.getElementById('setting-sound-toggle');
  if (soundToggle) soundToggle.checked = !!settings.soundAlerts;

  // Update top bar profile
  updateHeaderProfile(settings);
}

function bindEvents() {
  // Theme cards
  const darkCard = document.getElementById('theme-card-dark');
  const lightCard = document.getElementById('theme-card-light');

  if (darkCard) {
    darkCard.addEventListener('click', () => {
      setTheme('dark');
      darkCard.classList.add('active');
      if (lightCard) lightCard.classList.remove('active');
    });
  }

  if (lightCard) {
    lightCard.addEventListener('click', () => {
      setTheme('light');
      lightCard.classList.add('active');
      if (darkCard) darkCard.classList.remove('active');
    });
  }

  // Save profile button
  const saveProfileBtn = document.getElementById('btn-save-profile');
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
      const name = document.getElementById('setting-profile-name').value.trim() || 'Student';
      const major = document.getElementById('setting-profile-major').value.trim() || 'Undergraduate';

      const updated = storage.saveSettings({ userName: name, userMajor: major });
      updateHeaderProfile(updated);
      window.showToast('Profile updated', 'success');
      if (window.refreshAllViews) window.refreshAllViews();
    });
  }

  // Save timer presets button
  const saveTimerBtn = document.getElementById('btn-save-timer-settings');
  if (saveTimerBtn) {
    saveTimerBtn.addEventListener('click', () => {
      const focus = parseInt(document.getElementById('setting-focus-minutes').value) || 25;
      const shortB = parseInt(document.getElementById('setting-short-break').value) || 5;
      const longB = parseInt(document.getElementById('setting-long-break').value) || 15;

      storage.saveSettings({
        focusMinutes: focus,
        shortBreakMinutes: shortB,
        longBreakMinutes: longB
      });
      reloadTimerPresets();
      window.showToast('Timer settings saved', 'success');
    });
  }

  // Toggles
  const notifToggle = document.getElementById('setting-notifications-toggle');
  if (notifToggle) {
    notifToggle.addEventListener('change', (e) => {
      storage.saveSettings({ deadlineNotifications: e.target.checked });
      window.showToast('Notification preference saved', 'info');
    });
  }

  const soundToggle = document.getElementById('setting-sound-toggle');
  if (soundToggle) {
    soundToggle.addEventListener('change', (e) => {
      storage.saveSettings({ soundAlerts: e.target.checked });
      window.showToast('Audio alerts preference saved', 'info');
    });
  }

  // Export JSON button
  const exportBtn = document.getElementById('btn-export-data');
  if (exportBtn) {
    exportBtn.addEventListener('click', handleExportData);
  }

  // Import JSON trigger
  const importFile = document.getElementById('import-file-input');
  if (importFile) {
    importFile.addEventListener('change', handleImportData);
  }

  // Reset button
  const resetBtn = document.getElementById('btn-reset-data');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all data back to original demo values? This will overwrite existing tasks and notes.')) {
        storage.resetToDefaults();
        window.showToast('Application reset to initial demo state', 'success');
        setTimeout(() => window.location.reload(), 400);
      }
    });
  }
}

export function setTheme(themeName) {
  storage.saveSettings({ theme: themeName });
  applyTheme(themeName);
  window.showToast(`Switched to ${themeName} theme`, 'info');
}

export function applyTheme(themeName) {
  if (themeName === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

function updateHeaderProfile(settings) {
  const nameEl = document.getElementById('header-profile-name');
  const roleEl = document.getElementById('header-profile-role');
  if (nameEl) nameEl.textContent = settings.userName || 'Alex Rivera';
  if (roleEl) roleEl.textContent = settings.userMajor || 'Student';
}

function handleExportData() {
  const json = storage.exportAllData();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `studentos-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  window.showToast('Data exported successfully', 'success');
}

function handleImportData(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const res = storage.importAllData(event.target.result);
    if (res.success) {
      window.showToast('Backup restored successfully!', 'success');
      setTimeout(() => window.location.reload(), 500);
    } else {
      window.showToast(`Import failed: ${res.error}`, 'error');
    }
  };
  reader.readAsText(file);
}
