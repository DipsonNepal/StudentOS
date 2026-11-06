import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDaysRemaining,
  filterAndSortTasks,
  filterAssignments,
  computeProductivityStats,
  getCalendarGrid,
  formatDateISO
} from '../js/logic.js';

test('calculateDaysRemaining correctly calculates today, overdue, and upcoming', () => {
  const refDate = new Date(2026, 10, 6); // Nov 6, 2026
  
  // Due today
  const todayResult = calculateDaysRemaining('2026-11-06', refDate);
  assert.equal(todayResult.isToday, true);
  assert.equal(todayResult.isOverdue, false);
  assert.equal(todayResult.text, 'Due today');

  // Due tomorrow
  const tomorrowResult = calculateDaysRemaining('2026-11-07', refDate);
  assert.equal(tomorrowResult.days, 1);
  assert.equal(tomorrowResult.text, 'Due tomorrow');

  // Due in 5 days
  const futureResult = calculateDaysRemaining('2026-11-11', refDate);
  assert.equal(futureResult.days, 5);
  assert.equal(futureResult.text, '5 days left');

  // Overdue by 2 days
  const overdueResult = calculateDaysRemaining('2026-11-04', refDate);
  assert.equal(overdueResult.isOverdue, true);
  assert.equal(overdueResult.days, -2);
  assert.equal(overdueResult.text, 'Overdue by 2 days');
});

test('filterAndSortTasks correctly filters by status, search, and sorts by priority', () => {
  const sampleTasks = [
    { id: '1', title: 'Calculus Homework', priority: 'Medium', completed: false, category: 'Homework', dueDate: '2026-11-10' },
    { id: '2', title: 'Biology Lab Report', priority: 'High', completed: false, category: 'Project', dueDate: '2026-11-08' },
    { id: '3', title: 'History Reading', priority: 'Low', completed: true, category: 'Reading', dueDate: '2026-11-05' }
  ];

  // Filter completed
  const completed = filterAndSortTasks(sampleTasks, { filter: 'completed' });
  assert.equal(completed.length, 1);
  assert.equal(completed[0].id, '3');

  // Filter pending
  const pending = filterAndSortTasks(sampleTasks, { filter: 'pending' });
  assert.equal(pending.length, 2);

  // Search
  const searched = filterAndSortTasks(sampleTasks, { searchQuery: 'lab' });
  assert.equal(searched.length, 1);
  assert.equal(searched[0].title, 'Biology Lab Report');

  // Sort by priority (High -> Medium -> Low)
  const sorted = filterAndSortTasks(sampleTasks, { sortBy: 'priority' });
  assert.equal(sorted[0].priority, 'High');
  assert.equal(sorted[1].priority, 'Medium');
  assert.equal(sorted[2].priority, 'Low');
});

test('computeProductivityStats aggregates completion rates and focus totals', () => {
  const tasks = [
    { completed: true },
    { completed: true },
    { completed: false }
  ];
  const assignments = [
    { status: 'Completed', dueDate: '2026-11-01' },
    { status: 'In Progress', dueDate: '2026-11-12' }
  ];
  const sessions = [
    { durationMinutes: 25 },
    { durationMinutes: 25 },
    { durationMinutes: 50 }
  ];

  const stats = computeProductivityStats(tasks, assignments, sessions);
  assert.equal(stats.totalTasks, 3);
  assert.equal(stats.completedTasks, 2);
  assert.equal(stats.taskCompletionRate, 67);
  assert.equal(stats.totalAssignments, 2);
  assert.equal(stats.completedAssignments, 1);
  assert.equal(stats.assignmentCompletionRate, 50);
  assert.equal(stats.totalFocusMinutes, 100);
  assert.equal(stats.totalFocusHours, '1.7');
  assert.equal(stats.totalFocusSessions, 3);
});

test('getCalendarGrid generates accurate month grid with week alignments', () => {
  // November 2026: 30 days, Nov 1 is Sunday
  const grid = getCalendarGrid(2026, 10);
  assert.ok(grid.length >= 30);
  assert.equal(grid.length % 7, 0); // Must be full weeks
  const nov1 = grid.find(d => d.dateStr === '2026-11-01');
  assert.ok(nov1);
  assert.equal(nov1.isCurrentMonth, true);
  assert.equal(nov1.dayNumber, 1);
});
