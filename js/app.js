/**
 * StudentOS - Master App Orchestrator
 * Coordinates view navigation, modals, toasts, global search (Cmd+K), and submodules.
 */

import { storage } from './storage.js';
import { calculateDaysRemaining } from './logic.js';
import { initDashboard, refreshDashboard } from './dashboard.js';
import { initTasks, renderTasks, openTaskModal } from './tasks.js';
import { initAssignments, renderAssignments, openAssignmentModal } from './assignments.js';
import { initCalendar, renderCalendar, openCalendarEventModal } from './calendar.js';
import { initTimetable, renderTimetable, openClassModal } from './timetable.js';
import { initNotes, renderNotes, openNoteEditor } from './notes.js';
import { initTimer } from './timer.js';
import { initAnalytics, refreshAnalytics } from './analytics.js';
import { initSettings, applyTheme } from './settings.js';

let currentActiveView = 'overview';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial theme load
  const settings = storage.getSettings();
  applyTheme(settings.theme || 'dark');

  // 2. Initialize submodules
  initDashboard();
  initTasks();
  initAssignments();
  initCalendar();
  initTimetable();
  initNotes();
  initTimer();
  initAnalytics();
  initSettings();

  // 3. Global handlers & Navigation
  setupNavigation();
  setupSidebarToggles();
  setupNotifications();
  setupProfileMenu();
  setupCommandPalette();
  setupModalDismissals();
  setupQuickActions();

  // 4. Update date in header
  updateHeaderDate();

  // 5. Initialize icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

/**
 * Navigation & Page View Switching
 */
function setupNavigation() {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.getAttribute('data-view');
      if (targetView) {
        switchView(targetView);
        // On mobile, close sidebar after clicking nav
        document.body.classList.remove('sidebar-open');
      }
    });
  });
}

export function switchView(viewName) {
  currentActiveView = viewName;

  // Update sidebar active item
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  navItems.forEach(item => {
    if (item.getAttribute('data-view') === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Switch view visibility
  const views = document.querySelectorAll('.page-view');
  views.forEach(v => {
    if (v.id === `view-${viewName}`) {
      v.classList.add('active');
    } else {
      v.classList.remove('active');
    }
  });

  // Update Breadcrumb & Page title
  const titleEl = document.getElementById('header-page-title');
  const breadcrumbEl = document.getElementById('header-breadcrumb-page');
  const viewTitles = {
    overview: 'Overview',
    tasks: 'My Tasks',
    assignments: 'Coursework & Assignments',
    calendar: 'Academic Calendar',
    timetable: 'Weekly Timetable',
    notes: 'Notes & Resources',
    timer: 'Pomodoro Focus Timer',
    analytics: 'Productivity Analytics',
    settings: 'Preferences & Settings'
  };

  const name = viewTitles[viewName] || 'StudentOS';
  if (titleEl) titleEl.textContent = name;
  if (breadcrumbEl) breadcrumbEl.textContent = name;

  // Refresh relevant views on switch
  if (viewName === 'overview') refreshDashboard();
  if (viewName === 'tasks') renderTasks();
  if (viewName === 'assignments') renderAssignments();
  if (viewName === 'calendar') renderCalendar();
  if (viewName === 'timetable') renderTimetable();
  if (viewName === 'notes') renderNotes();
  if (viewName === 'analytics') refreshAnalytics();

  window.scrollTo(0, 0);
  if (window.lucide) window.lucide.createIcons();
}

window.switchView = switchView;

/**
 * Sidebar Collapse & Mobile Hamburger
 */
function setupSidebarToggles() {
  const collapseBtn = document.getElementById('btn-collapse-sidebar');
  const mobileToggleBtn = document.getElementById('btn-mobile-menu');
  const backdrop = document.getElementById('sidebar-backdrop');

  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-collapsed');
    });
  }

  if (mobileToggleBtn) {
    mobileToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-open');
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', () => {
      document.body.classList.remove('sidebar-open');
    });
  }
}

/**
 * Header Date display
 */
function updateHeaderDate() {
  const dateEl = document.getElementById('header-current-date');
  if (dateEl) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    dateEl.textContent = new Date().toLocaleDateString('en-US', options);
  }
}

/**
 * Notifications dropdown
 */
function setupNotifications() {
  const notifBtn = document.getElementById('btn-notifications');
  const notifDropdown = document.getElementById('notifications-dropdown');
  const listEl = document.getElementById('notifications-list');

  if (!notifBtn || !notifDropdown || !listEl) return;

  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notifDropdown.classList.toggle('active');
    populateNotifications(listEl);
  });

  document.addEventListener('click', (e) => {
    if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
      notifDropdown.classList.remove('active');
    }
  });
}

function populateNotifications(listEl) {
  const tasks = storage.getTasks();
  const assignments = storage.getAssignments();

  const urgentItems = [];

  assignments.forEach(a => {
    if (a.completed || a.status === 'Completed') return;
    const r = calculateDaysRemaining(a.dueDate);
    if (r.isOverdue) {
      urgentItems.push({ title: a.title, subtitle: `${a.subject} • ${r.text}`, type: 'overdue' });
    } else if (r.isToday || r.days === 1) {
      urgentItems.push({ title: a.title, subtitle: `${a.subject} • ${r.text}`, type: 'soon' });
    }
  });

  tasks.forEach(t => {
    if (t.completed) return;
    const r = calculateDaysRemaining(t.dueDate);
    if (r.isOverdue || r.isToday) {
      urgentItems.push({ title: t.title, subtitle: `Task • ${r.text}`, type: r.isOverdue ? 'overdue' : 'soon' });
    }
  });

  if (urgentItems.length === 0) {
    listEl.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:12px;">No urgent alerts. Everything is on schedule! 🚀</div>`;
  } else {
    listEl.innerHTML = urgentItems.map(item => `
      <div class="notification-item">
        <strong style="color: ${item.type === 'overdue' ? 'var(--accent-rose)' : 'var(--accent-amber)'};">${escapeHtml(item.title)}</strong>
        <span style="color:var(--text-muted);">${escapeHtml(item.subtitle)}</span>
      </div>
    `).join('');
  }
}

/**
 * Profile dropdown menu
 */
function setupProfileMenu() {
  const profileBtn = document.getElementById('btn-profile-dropdown');
  const dropdown = document.getElementById('profile-dropdown-menu');

  if (!profileBtn || !dropdown) return;

  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && !profileBtn.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });
}

/**
 * Global Command Palette / Search (Ctrl+K or Cmd+K)
 */
function setupCommandPalette() {
  const modal = document.getElementById('search-modal');
  const searchInput = document.getElementById('global-search-input');
  const resultsList = document.getElementById('global-search-results');
  const triggerBtn = document.getElementById('btn-global-search');

  if (!modal || !searchInput || !resultsList) return;

  const openSearch = () => {
    modal.classList.add('active');
    searchInput.value = '';
    renderSearchResults('');
    searchInput.focus();
  };

  const closeSearch = () => {
    modal.classList.remove('active');
  };

  if (triggerBtn) triggerBtn.addEventListener('click', openSearch);

  // Global hotkey Ctrl+K / Cmd+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (modal.classList.contains('active')) {
        closeSearch();
      } else {
        openSearch();
      }
    }
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeSearch();
    }
  });

  searchInput.addEventListener('input', (e) => {
    renderSearchResults(e.target.value.toLowerCase().trim());
  });

  function renderSearchResults(query) {
    const results = [];

    // Quick navigation entries
    const pages = [
      { title: 'Go to Overview Dashboard', view: 'overview', icon: 'layout-dashboard', tag: 'View' },
      { title: 'Go to Tasks', view: 'tasks', icon: 'check-square', tag: 'View' },
      { title: 'Go to Assignments', view: 'assignments', icon: 'book-open', tag: 'View' },
      { title: 'Go to Calendar', view: 'calendar', icon: 'calendar', tag: 'View' },
      { title: 'Go to Timetable', view: 'timetable', icon: 'clock', tag: 'View' },
      { title: 'Go to Notes', view: 'notes', icon: 'file-text', tag: 'View' },
      { title: 'Go to Focus Timer', view: 'timer', icon: 'timer', tag: 'View' },
      { title: 'Go to Analytics', view: 'analytics', icon: 'bar-chart-2', tag: 'View' },
      { title: 'Go to Settings', view: 'settings', icon: 'settings', tag: 'View' }
    ];

    pages.forEach(p => {
      if (!query || p.title.toLowerCase().includes(query)) {
        results.push(p);
      }
    });

    if (query) {
      // Search tasks
      storage.getTasks().forEach(t => {
        if ((t.title || '').toLowerCase().includes(query) || (t.description || '').toLowerCase().includes(query)) {
          results.push({
            title: t.title,
            view: 'tasks',
            icon: 'check-circle-2',
            tag: 'Task'
          });
        }
      });

      // Search assignments
      storage.getAssignments().forEach(a => {
        if ((a.title || '').toLowerCase().includes(query) || (a.subject || '').toLowerCase().includes(query)) {
          results.push({
            title: a.title,
            view: 'assignments',
            icon: 'book',
            tag: a.subject || 'Assignment'
          });
        }
      });

      // Search notes
      storage.getNotes().forEach(n => {
        if ((n.title || '').toLowerCase().includes(query) || (n.content || '').toLowerCase().includes(query)) {
          results.push({
            title: n.title,
            view: 'notes',
            icon: 'file-text',
            tag: 'Note'
          });
        }
      });
    }

    if (results.length === 0) {
      resultsList.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-muted);">No results found matching "${escapeHtml(query)}"</div>`;
    } else {
      resultsList.innerHTML = results.slice(0, 8).map(r => `
        <div class="search-result-item" onclick="window.selectSearchResult('${r.view}')">
          <div class="search-result-left">
            <i data-lucide="${r.icon || 'arrow-right'}" style="width:16px;height:16px;color:var(--accent-primary);"></i>
            <span>${escapeHtml(r.title)}</span>
          </div>
          <span class="search-result-tag">${escapeHtml(r.tag)}</span>
        </div>
      `).join('');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  window.selectSearchResult = (targetView) => {
    closeSearch();
    switchView(targetView);
  };
}

/**
 * Universal Modal Dismissals
 */
function setupModalDismissals() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
    });
  });
}

/**
 * Quick Action Buttons (Dashboard top)
 */
function setupQuickActions() {
  const quickTask = document.getElementById('dash-quick-task');
  const quickAssign = document.getElementById('dash-quick-assignment');
  const quickNote = document.getElementById('dash-quick-note');
  const quickTimer = document.getElementById('dash-quick-timer');

  if (quickTask) quickTask.addEventListener('click', () => openTaskModal());
  if (quickAssign) quickAssign.addEventListener('click', () => openAssignmentModal());
  if (quickNote) quickNote.addEventListener('click', () => openNoteEditor(null));
  if (quickTimer) quickTimer.addEventListener('click', () => switchView('timer'));
}

/**
 * Global Toast System
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle-2';
  if (type === 'error') iconName = 'alert-triangle';

  toast.innerHTML = `
    <i data-lucide="${iconName}" style="width:18px;height:18px;"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3200);
}

window.showToast = showToast;

/**
 * Re-render hook when data changes across views
 */
export function refreshAllViews() {
  refreshDashboard();
  renderTasks();
  renderAssignments();
  renderCalendar();
  renderTimetable();
  renderNotes();
  refreshAnalytics();
}

window.refreshAllViews = refreshAllViews;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
