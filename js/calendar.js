/**
 * StudentOS - Calendar Module
 * Interactive monthly calendar with task/assignment plotting, day inspection, and event scheduling.
 */

import { storage } from './storage.js';
import { getCalendarGrid, formatDateISO } from './logic.js';

let displayedYear = new Date().getFullYear();
let displayedMonth = new Date().getMonth(); // 0-indexed

export function initCalendar() {
  bindEvents();
  renderCalendar();
}

function bindEvents() {
  const prevBtn = document.getElementById('cal-prev-month');
  const nextBtn = document.getElementById('cal-next-month');
  const todayBtn = document.getElementById('cal-today-btn');
  const addEventBtn = document.getElementById('btn-add-calendar-event');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      displayedMonth--;
      if (displayedMonth < 0) {
        displayedMonth = 11;
        displayedYear--;
      }
      renderCalendar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      displayedMonth++;
      if (displayedMonth > 11) {
        displayedMonth = 0;
        displayedYear++;
      }
      renderCalendar();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      const now = new Date();
      displayedYear = now.getFullYear();
      displayedMonth = now.getMonth();
      renderCalendar();
    });
  }

  if (addEventBtn) {
    addEventBtn.addEventListener('click', () => openCalendarEventModal());
  }

  const form = document.getElementById('calendar-event-form');
  if (form) {
    form.addEventListener('submit', handleCalendarEventSubmit);
  }
}

export function renderCalendar() {
  const gridEl = document.getElementById('calendar-grid-cells');
  const titleEl = document.getElementById('calendar-month-heading');
  if (!gridEl || !titleEl) return;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  titleEl.textContent = `${monthNames[displayedMonth]} ${displayedYear}`;

  const grid = getCalendarGrid(displayedYear, displayedMonth);
  const tasks = storage.getTasks();
  const assignments = storage.getAssignments();
  const events = storage.getCalendarEvents();

  gridEl.innerHTML = grid.map(cell => {
    // Collect items on this date
    const dayTasks = tasks.filter(t => t.dueDate === cell.dateStr);
    const dayAssigns = assignments.filter(a => a.dueDate === cell.dateStr);
    const dayEvents = events.filter(e => e.date === cell.dateStr);

    let pillsHtml = '';

    dayTasks.slice(0, 2).forEach(t => {
      pillsHtml += `<div class="calendar-event-pill event-task" title="Task: ${escapeHtml(t.title)}">• ${escapeHtml(t.title)}</div>`;
    });

    dayAssigns.slice(0, 2).forEach(a => {
      pillsHtml += `<div class="calendar-event-pill event-assignment" title="Assignment: ${escapeHtml(a.title)}">📖 ${escapeHtml(a.title)}</div>`;
    });

    dayEvents.slice(0, 2).forEach(e => {
      pillsHtml += `<div class="calendar-event-pill event-custom" title="Event: ${escapeHtml(e.title)}">⭐ ${escapeHtml(e.title)}</div>`;
    });

    const totalItems = dayTasks.length + dayAssigns.length + dayEvents.length;
    if (totalItems > 4) {
      pillsHtml += `<div style="font-size:10px;color:var(--text-dim);font-weight:600;">+${totalItems - 4} more</div>`;
    }

    return `
      <div class="calendar-cell ${cell.isCurrentMonth ? '' : 'other-month'} ${cell.isToday ? 'today' : ''}" 
           onclick="window.openDayScheduleModal('${cell.dateStr}')">
        <div class="calendar-cell-top">
          <span class="calendar-cell-num">${cell.dayNumber}</span>
          ${totalItems > 0 ? `<span style="font-size:10px;font-weight:700;color:var(--accent-primary);">${totalItems}</span>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;overflow:hidden;">
          ${pillsHtml}
        </div>
      </div>
    `;
  }).join('');
}

export function openDayScheduleModal(dateStr) {
  const modal = document.getElementById('day-schedule-modal');
  const titleEl = document.getElementById('day-schedule-date-title');
  const bodyEl = document.getElementById('day-schedule-content');

  if (!modal || !titleEl || !bodyEl) return;

  const dateObj = new Date(dateStr + 'T00:00:00');
  titleEl.textContent = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const tasks = storage.getTasks().filter(t => t.dueDate === dateStr);
  const assigns = storage.getAssignments().filter(a => a.dueDate === dateStr);
  const events = storage.getCalendarEvents().filter(e => e.date === dateStr);

  let html = '';

  if (tasks.length === 0 && assigns.length === 0 && events.length === 0) {
    html = `<div class="empty-state" style="padding:20px;"><p>No tasks, assignments, or events scheduled for this day.</p></div>`;
  } else {
    if (tasks.length > 0) {
      html += `<h4 style="font-size:13px;color:var(--accent-primary);text-transform:uppercase;letter-spacing:0.04em;">Tasks (${tasks.length})</h4>`;
      tasks.forEach(t => {
        html += `
          <div class="dashboard-list-item">
            <div class="dashboard-item-info">
              <h4>${escapeHtml(t.title)}</h4>
              <p>${t.category} • Priority: ${t.priority} • ${t.completed ? 'Completed' : 'Pending'}</p>
            </div>
          </div>
        `;
      });
    }

    if (assigns.length > 0) {
      html += `<h4 style="font-size:13px;color:var(--accent-amber);text-transform:uppercase;letter-spacing:0.04em;margin-top:12px;">Assignments (${assigns.length})</h4>`;
      assigns.forEach(a => {
        html += `
          <div class="dashboard-list-item">
            <div class="dashboard-item-info">
              <h4>${escapeHtml(a.title)}</h4>
              <p>${a.subject} • Status: ${a.status} • Weight: ${a.weight || 'N/A'}</p>
            </div>
          </div>
        `;
      });
    }

    if (events.length > 0) {
      html += `<h4 style="font-size:13px;color:var(--accent-emerald);text-transform:uppercase;letter-spacing:0.04em;margin-top:12px;">Events (${events.length})</h4>`;
      events.forEach(e => {
        html += `
          <div class="dashboard-list-item">
            <div class="dashboard-item-info">
              <h4>${escapeHtml(e.title)} (${e.time || 'All Day'})</h4>
              <p>${e.type} ${e.notes ? '• ' + escapeHtml(e.notes) : ''}</p>
            </div>
            <button class="btn-icon" onclick="window.deleteCalendarEventItem('${e.id}')" title="Delete">
              <i data-lucide="trash-2" style="width:14px;height:14px;color:var(--accent-rose);"></i>
            </button>
          </div>
        `;
      });
    }
  }

  bodyEl.innerHTML = html;
  document.getElementById('day-schedule-add-btn').onclick = () => {
    modal.classList.remove('active');
    openCalendarEventModal(dateStr);
  };

  modal.classList.add('active');
  if (window.lucide) window.lucide.createIcons();
}

export function openCalendarEventModal(defaultDate = null) {
  const modal = document.getElementById('calendar-event-modal');
  const form = document.getElementById('calendar-event-form');
  if (!modal || !form) return;

  form.reset();
  document.getElementById('event-input-date').value = defaultDate || formatDateISO(new Date());
  modal.classList.add('active');
  document.getElementById('event-input-title').focus();
}

function handleCalendarEventSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('event-input-title').value.trim();
  const date = document.getElementById('event-input-date').value;
  const time = document.getElementById('event-input-time').value;
  const type = document.getElementById('event-input-type').value;
  const notes = document.getElementById('event-input-notes').value.trim();

  if (!title || !date) {
    window.showToast('Please fill out the event title and date', 'error');
    return;
  }

  storage.addCalendarEvent({ title, date, time, type, notes });
  window.showToast('Event scheduled', 'success');
  document.getElementById('calendar-event-modal').classList.remove('active');
  renderCalendar();
}

window.openDayScheduleModal = openDayScheduleModal;
window.openCalendarEventModal = openCalendarEventModal;

window.deleteCalendarEventItem = (id) => {
  storage.deleteCalendarEvent(id);
  window.showToast('Event removed', 'info');
  document.getElementById('day-schedule-modal').classList.remove('active');
  renderCalendar();
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
