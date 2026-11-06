/**
 * StudentOS - Dashboard / Overview Module
 * Renders home metrics, interactive charts, quick lists, and action triggers.
 */

import { storage } from './storage.js';
import { calculateDaysRemaining, computeProductivityStats } from './logic.js';

let productivityChart = null;
let distributionChart = null;
let studyHoursChart = null;

const MOTIVATIONAL_QUOTES = [
  { text: "Consistency is what transforms average into excellence.", author: "Anonymous" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus is a muscle. The more you practice, the stronger it gets.", author: "Cal Newport" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" }
];

export function initDashboard() {
  renderGreeting();
  renderMetrics();
  renderQuickLists();
  initCharts();
}

export function refreshDashboard() {
  renderGreeting();
  renderMetrics();
  renderQuickLists();
  updateCharts();
}

function renderGreeting() {
  const settings = storage.getSettings();
  const greetingEl = document.getElementById('dash-greeting-text');
  const quoteEl = document.getElementById('dash-quote-text');
  const dateEl = document.getElementById('dash-date-badge');

  if (greetingEl) {
    const hour = new Date().getHours();
    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
    else if (hour >= 17) timeGreeting = 'Good evening';
    
    greetingEl.textContent = `${timeGreeting}, ${settings.userName}! 👋`;
  }

  if (quoteEl) {
    const dayIndex = new Date().getDay() % MOTIVATIONAL_QUOTES.length;
    const q = MOTIVATIONAL_QUOTES[dayIndex];
    quoteEl.textContent = `"${q.text}" — ${q.author}`;
  }

  if (dateEl) {
    const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    dateEl.textContent = new Date().toLocaleDateString('en-US', options);
  }
}

function renderMetrics() {
  const tasks = storage.getTasks();
  const assignments = storage.getAssignments();
  const focusHistory = storage.getFocusHistory();
  const stats = computeProductivityStats(tasks, assignments, focusHistory);

  // Set metric text values
  const totalTasksEl = document.getElementById('metric-total-tasks');
  const completedTasksEl = document.getElementById('metric-completed-tasks');
  const pendingAssignEl = document.getElementById('metric-pending-assignments');
  const productivityScoreEl = document.getElementById('metric-productivity-score');
  const focusHoursEl = document.getElementById('metric-focus-hours');
  const upcomingDeadlinesEl = document.getElementById('metric-upcoming-deadlines');

  if (totalTasksEl) totalTasksEl.textContent = stats.totalTasks;
  if (completedTasksEl) completedTasksEl.textContent = `${stats.completedTasks} (${stats.taskCompletionRate}%)`;
  if (pendingAssignEl) pendingAssignEl.textContent = stats.pendingAssignments;
  if (productivityScoreEl) productivityScoreEl.textContent = `${stats.productivityScore}%`;
  if (focusHoursEl) focusHoursEl.textContent = `${stats.totalFocusHours}h`;

  // Count upcoming deadlines in next 48h
  const urgentCount = assignments.filter(a => {
    if (a.completed || a.status === 'Completed') return false;
    const r = calculateDaysRemaining(a.dueDate);
    return r.days >= 0 && r.days <= 2;
  }).length;
  if (upcomingDeadlinesEl) upcomingDeadlinesEl.textContent = urgentCount;

  // Progress bars
  const taskProgressFill = document.getElementById('dash-task-progress-fill');
  if (taskProgressFill) {
    taskProgressFill.style.width = `${stats.taskCompletionRate}%`;
  }
}

function renderQuickLists() {
  const tasks = storage.getTasks();
  const assignments = storage.getAssignments();
  const timetable = storage.getTimetable();

  // 1. Priority tasks today
  const priorityListEl = document.getElementById('dash-priority-tasks-list');
  if (priorityListEl) {
    const pendingTasks = tasks.filter(t => !t.completed).slice(0, 4);
    if (pendingTasks.length === 0) {
      priorityListEl.innerHTML = `<div class="empty-state" style="padding:20px;"><p>No pending priority tasks! Great job!</p></div>`;
    } else {
      priorityListEl.innerHTML = pendingTasks.map(t => {
        const daysInfo = calculateDaysRemaining(t.dueDate);
        return `
          <div class="dashboard-list-item" data-task-id="${t.id}">
            <div class="dashboard-item-left">
              <div class="custom-checkbox ${t.completed ? 'checked' : ''}" onclick="window.toggleTaskItem('${t.id}')">
                ${t.completed ? '<i data-lucide="check" style="width:12px;height:12px;"></i>' : ''}
              </div>
              <div class="dashboard-item-info">
                <h4>${escapeHtml(t.title)}</h4>
                <p><span class="${daysInfo.statusClass}">${daysInfo.text}</span> • ${t.category || 'General'}</p>
              </div>
            </div>
            <span class="badge badge-${(t.priority || 'medium').toLowerCase()}">${t.priority}</span>
          </div>
        `;
      }).join('');
    }
  }

  // 2. Upcoming deadlines
  const deadlinesListEl = document.getElementById('dash-deadlines-list');
  if (deadlinesListEl) {
    const pendingAssigns = assignments
      .filter(a => !a.completed && a.status !== 'Completed')
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
      .slice(0, 4);

    if (pendingAssigns.length === 0) {
      deadlinesListEl.innerHTML = `<div class="empty-state" style="padding:20px;"><p>No pending assignment deadlines.</p></div>`;
    } else {
      deadlinesListEl.innerHTML = pendingAssigns.map(a => {
        const r = calculateDaysRemaining(a.dueDate);
        return `
          <div class="dashboard-list-item">
            <div class="dashboard-item-info">
              <h4>${escapeHtml(a.title)}</h4>
              <p><strong style="color:var(--accent-primary);">${escapeHtml(a.subject)}</strong> • <span class="${r.statusClass}">${r.text}</span></p>
            </div>
            <span class="badge badge-${(a.priority || 'medium').toLowerCase()}">${a.priority}</span>
          </div>
        `;
      }).join('');
    }
  }

  // 3. Today's classes
  const classesListEl = document.getElementById('dash-classes-list');
  if (classesListEl) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    const todayClasses = timetable
      .filter(c => c.day === currentDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (todayClasses.length === 0) {
      classesListEl.innerHTML = `<div class="empty-state" style="padding:20px;"><p>No classes scheduled for today (${currentDay}) 🎉</p></div>`;
    } else {
      classesListEl.innerHTML = todayClasses.map(c => `
        <div class="dashboard-list-item">
          <div class="dashboard-item-info">
            <h4>${escapeHtml(c.subject)}</h4>
            <p><i data-lucide="map-pin" style="width:12px;height:12px;display:inline;"></i> ${escapeHtml(c.location)} ${c.instructor ? '• ' + escapeHtml(c.instructor) : ''}</p>
          </div>
          <span class="badge badge-category" style="font-weight:600;">${c.startTime} - ${c.endTime}</span>
        </div>
      `).join('');
    }
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function initCharts() {
  if (typeof Chart === 'undefined') return;

  // Chart 1: Weekly Productivity Trend
  const ctxProd = document.getElementById('chart-weekly-productivity');
  if (ctxProd) {
    if (productivityChart) productivityChart.destroy();
    productivityChart = new Chart(ctxProd, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Productivity Score %',
          data: [65, 78, 72, 85, 90, 82, 88],
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.12)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#8b5cf6',
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f1f5f9',
            bodyColor: '#cbd5e1',
            borderColor: '#334155',
            borderWidth: 1
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#64748b' }
          }
        }
      }
    });
  }

  // Chart 2: Task & Assignment Breakdown
  const ctxDist = document.getElementById('chart-task-distribution');
  if (ctxDist) {
    if (distributionChart) distributionChart.destroy();
    const tasks = storage.getTasks();
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.length - completed;

    distributionChart = new Chart(ctxDist, {
      type: 'doughnut',
      data: {
        labels: ['Completed Tasks', 'Pending Tasks'],
        datasets: [{
          data: [completed || 1, pending || 1],
          backgroundColor: ['#10b981', '#6366f1'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', font: { size: 12 } }
          }
        },
        cutout: '70%'
      }
    });
  }

  // Chart 3: Study Hours Mon - Sun
  const ctxStudy = document.getElementById('chart-study-hours');
  if (ctxStudy) {
    if (studyHoursChart) studyHoursChart.destroy();
    studyHoursChart = new Chart(ctxStudy, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Study Hours',
          data: [2.5, 3.2, 2.0, 4.0, 3.5, 1.8, 2.8],
          backgroundColor: '#8b5cf6',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f1f5f9',
            bodyColor: '#cbd5e1'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#64748b' }
          }
        }
      }
    });
  }
}

function updateCharts() {
  if (distributionChart) {
    const tasks = storage.getTasks();
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.length - completed;
    distributionChart.data.datasets[0].data = [completed, pending];
    distributionChart.update();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
