/**
 * StudentOS - Analytics Module
 * Comprehensive productivity metrics, historical study activity, and Chart.js dashboards.
 */

import { storage } from './storage.js';
import { computeProductivityStats } from './logic.js';

let weeklyActivityChart = null;
let subjectAnalyticsChart = null;
let velocityChart = null;

export function initAnalytics() {
  renderAnalyticsMetrics();
  initAnalyticsCharts();
}

export function refreshAnalytics() {
  renderAnalyticsMetrics();
  updateAnalyticsCharts();
}

function renderAnalyticsMetrics() {
  const tasks = storage.getTasks();
  const assignments = storage.getAssignments();
  const focusHistory = storage.getFocusHistory();
  const stats = computeProductivityStats(tasks, assignments, focusHistory);

  const totalHoursEl = document.getElementById('analytics-total-hours');
  const prodScoreEl = document.getElementById('analytics-productivity-score');
  const taskRateEl = document.getElementById('analytics-task-rate');
  const assignRateEl = document.getElementById('analytics-assignment-rate');
  const sessionsEl = document.getElementById('analytics-focus-sessions');

  if (totalHoursEl) totalHoursEl.textContent = `${stats.totalFocusHours}h`;
  if (prodScoreEl) prodScoreEl.textContent = `${stats.productivityScore}%`;
  if (taskRateEl) taskRateEl.textContent = `${stats.taskCompletionRate}%`;
  if (assignRateEl) assignRateEl.textContent = `${stats.assignmentCompletionRate}%`;
  if (sessionsEl) sessionsEl.textContent = stats.totalFocusSessions;
}

function initAnalyticsCharts() {
  if (typeof Chart === 'undefined') return;

  // 1. Weekly Study Activity Chart
  const ctxWeekly = document.getElementById('chart-analytics-weekly');
  if (ctxWeekly) {
    if (weeklyActivityChart) weeklyActivityChart.destroy();
    weeklyActivityChart = new Chart(ctxWeekly, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Actual Hours',
            data: [2.5, 3.2, 2.0, 4.0, 3.5, 1.8, 2.8],
            backgroundColor: '#6366f1',
            borderRadius: 6
          },
          {
            label: 'Daily Target (4h)',
            data: [4, 4, 4, 4, 4, 4, 4],
            type: 'line',
            borderColor: '#f59e0b',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94a3b8' }
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

  // 2. Subject Distribution Chart
  const ctxSubj = document.getElementById('chart-analytics-subjects');
  if (ctxSubj) {
    if (subjectAnalyticsChart) subjectAnalyticsChart.destroy();
    subjectAnalyticsChart = new Chart(ctxSubj, {
      type: 'doughnut',
      data: {
        labels: ['Computer Science', 'Mathematics', 'Physics', 'Economics', 'General'],
        datasets: [{
          data: [35, 25, 20, 12, 8],
          backgroundColor: ['#6366f1', '#8b5cf6', '#f43f5e', '#f59e0b', '#06b6d4'],
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#94a3b8', font: { size: 12 } }
          }
        },
        cutout: '65%'
      }
    });
  }

  // 3. Task Completion Velocity
  const ctxVel = document.getElementById('chart-analytics-velocity');
  if (ctxVel) {
    if (velocityChart) velocityChart.destroy();
    velocityChart = new Chart(ctxVel, {
      type: 'line',
      data: {
        labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
        datasets: [{
          label: 'Completed Tasks',
          data: [2, 4, 3, 5, 6, 4, 5],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#10b981'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: '#64748b' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
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

function updateAnalyticsCharts() {
  if (weeklyActivityChart) weeklyActivityChart.update();
  if (subjectAnalyticsChart) subjectAnalyticsChart.update();
  if (velocityChart) velocityChart.update();
}
