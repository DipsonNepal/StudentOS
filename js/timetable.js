/**
 * StudentOS - Weekly Timetable Module
 * Displays scheduled classes across Monday to Sunday with current day highlighting and class editing.
 */

import { storage } from './storage.js';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function initTimetable() {
  bindEvents();
  renderTimetable();
}

function bindEvents() {
  const addBtn = document.getElementById('btn-add-class');
  if (addBtn) {
    addBtn.addEventListener('click', () => openClassModal());
  }

  const form = document.getElementById('class-form');
  if (form) {
    form.addEventListener('submit', handleClassFormSubmit);
  }
}

export function renderTimetable() {
  const grid = document.getElementById('timetable-days-grid');
  if (!grid) return;

  const currentDayIndex = new Date().getDay(); // 0 is Sun, 1 is Mon...
  // Map JS getDay() to DAYS_OF_WEEK: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
  const mappedCurrentDay = currentDayIndex === 0 ? 'Sunday' : DAYS_OF_WEEK[currentDayIndex - 1];

  const timetable = storage.getTimetable();

  grid.innerHTML = DAYS_OF_WEEK.map(dayName => {
    const isToday = dayName === mappedCurrentDay;
    const classesForDay = timetable
      .filter(item => item.day === dayName)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    let cardsHtml = '';
    if (classesForDay.length === 0) {
      cardsHtml = `<div style="font-size:11.5px;color:var(--text-dim);text-align:center;padding:16px 8px;">No classes</div>`;
    } else {
      cardsHtml = classesForDay.map(c => `
        <div class="timetable-card" style="border-left-color: var(--accent-${c.color || 'primary'});">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <span class="timetable-card-time">${c.startTime} - ${c.endTime}</span>
            <button class="btn-icon" style="width:20px;height:20px;" onclick="window.deleteClassItem('${c.id}')" title="Delete class">
              <i data-lucide="trash-2" style="width:12px;height:12px;color:var(--accent-rose);"></i>
            </button>
          </div>
          <div class="timetable-card-subject">${escapeHtml(c.subject)}</div>
          <div class="timetable-card-location">
            <i data-lucide="map-pin" style="width:11px;height:11px;display:inline;"></i>
            ${escapeHtml(c.location)}
          </div>
          ${c.instructor ? `<div style="font-size:11px;color:var(--text-dim);">${escapeHtml(c.instructor)}</div>` : ''}
        </div>
      `).join('');
    }

    return `
      <div class="timetable-day-col ${isToday ? 'current-day' : ''}">
        <div class="timetable-col-header">
          ${dayName} ${isToday ? '• Today' : ''}
        </div>
        ${cardsHtml}
      </div>
    `;
  }).join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

export function openClassModal() {
  const modal = document.getElementById('class-modal');
  const form = document.getElementById('class-form');
  if (!modal || !form) return;

  form.reset();
  modal.classList.add('active');
  document.getElementById('class-input-subject').focus();
}

function handleClassFormSubmit(e) {
  e.preventDefault();
  const subject = document.getElementById('class-input-subject').value.trim();
  const day = document.getElementById('class-input-day').value;
  const startTime = document.getElementById('class-input-start').value;
  const endTime = document.getElementById('class-input-end').value;
  const location = document.getElementById('class-input-location').value.trim();
  const instructor = document.getElementById('class-input-instructor').value.trim();
  const color = document.getElementById('class-input-color').value;

  if (!subject || !startTime || !endTime) {
    window.showToast('Please provide subject and class timings', 'error');
    return;
  }

  storage.addTimetableClass({ subject, day, startTime, endTime, location, instructor, color });
  window.showToast('Class added to schedule', 'success');
  document.getElementById('class-modal').classList.remove('active');
  renderTimetable();
  if (window.refreshAllViews) window.refreshAllViews();
}

window.openClassModal = openClassModal;

window.deleteClassItem = (id) => {
  if (confirm('Delete this class from timetable?')) {
    storage.deleteTimetableClass(id);
    window.showToast('Class removed', 'info');
    renderTimetable();
    if (window.refreshAllViews) window.refreshAllViews();
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
