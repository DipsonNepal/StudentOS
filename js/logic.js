/**
 * StudentOS - Core Logic & Pure Functions
 * Decoupled from DOM for fast testing and deterministic computations.
 */

/**
 * Calculates days remaining until a due date.
 * @param {string} dueDateStr - ISO date string YYYY-MM-DD
 * @param {Date} [currentDate] - Reference date (defaults to now)
 * @returns {{ days: number, isOverdue: boolean, isToday: boolean, text: string, statusClass: string }}
 */
export function calculateDaysRemaining(dueDateStr, currentDate = new Date()) {
  if (!dueDateStr) {
    return { days: 0, isOverdue: false, isToday: false, text: 'No due date', statusClass: 'status-neutral' };
  }

  // Normalize dates to start of day in local time
  const [y, m, d] = dueDateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d, 23, 59, 59, 999);
  
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);

  const targetDayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
  const diffTime = targetDayStart.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      days: diffDays,
      isOverdue: true,
      isToday: false,
      text: overdueDays === 1 ? 'Overdue by 1 day' : `Overdue by ${overdueDays} days`,
      statusClass: 'status-overdue'
    };
  }

  if (diffDays === 0) {
    return {
      days: 0,
      isOverdue: false,
      isToday: true,
      text: 'Due today',
      statusClass: 'status-warning'
    };
  }

  if (diffDays === 1) {
    return {
      days: 1,
      isOverdue: false,
      isToday: false,
      text: 'Due tomorrow',
      statusClass: 'status-warning'
    };
  }

  return {
    days: diffDays,
    isOverdue: false,
    isToday: false,
    text: `${diffDays} days left`,
    statusClass: diffDays <= 3 ? 'status-warning' : 'status-safe'
  };
}

/**
 * Filter and sort tasks.
 */
export function filterAndSortTasks(tasks, { filter = 'all', category = 'all', priority = 'all', sortBy = 'dueDate', searchQuery = '' } = {}) {
  let result = [...tasks];

  // Search
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter(t => 
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q))
    );
  }

  // Filter status
  if (filter === 'completed') {
    result = result.filter(t => t.completed);
  } else if (filter === 'pending') {
    result = result.filter(t => !t.completed);
  } else if (filter === 'overdue') {
    result = result.filter(t => !t.completed && calculateDaysRemaining(t.dueDate).isOverdue);
  }

  // Category
  if (category && category !== 'all') {
    result = result.filter(t => t.category === category);
  }

  // Priority
  if (priority && priority !== 'all') {
    result = result.filter(t => t.priority === priority);
  }

  // Sorting
  const priorityWeights = { High: 3, Medium: 2, Low: 1 };
  result.sort((a, b) => {
    if (sortBy === 'priority') {
      const weightA = priorityWeights[a.priority] || 0;
      const weightB = priorityWeights[b.priority] || 0;
      if (weightB !== weightA) return weightB - weightA;
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    }
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (sortBy === 'title') {
      return (a.title || '').localeCompare(b.title || '');
    }
    return 0;
  });

  return result;
}

/**
 * Filter and sort assignments.
 */
export function filterAssignments(assignments, { filter = 'all', subject = 'all', searchQuery = '' } = {}) {
  let result = [...assignments];

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter(a => 
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.description && a.description.toLowerCase().includes(q)) ||
      (a.subject && a.subject.toLowerCase().includes(q))
    );
  }

  if (filter === 'completed') {
    result = result.filter(a => a.status === 'Completed' || a.completed);
  } else if (filter === 'upcoming') {
    result = result.filter(a => (a.status !== 'Completed' && !a.completed) && !calculateDaysRemaining(a.dueDate).isOverdue);
  } else if (filter === 'overdue') {
    result = result.filter(a => (a.status !== 'Completed' && !a.completed) && calculateDaysRemaining(a.dueDate).isOverdue);
  }

  if (subject && subject !== 'all') {
    result = result.filter(a => a.subject === subject);
  }

  result.sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  return result;
}

/**
 * Computes overall productivity statistics.
 */
export function computeProductivityStats(tasks = [], assignments = [], focusSessions = []) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(a => a.status === 'Completed' || a.completed).length;
  const pendingAssignments = totalAssignments - completedAssignments;
  const overdueAssignments = assignments.filter(a => (a.status !== 'Completed' && !a.completed) && calculateDaysRemaining(a.dueDate).isOverdue).length;
  const assignmentRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  // Total focus minutes
  const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);

  // Overall productivity index (weighted)
  const productivityScore = Math.min(100, Math.round(
    (taskRate * 0.5) + (assignmentRate * 0.4) + Math.min(10, focusSessions.length * 2)
  ));

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    taskCompletionRate: taskRate,
    totalAssignments,
    completedAssignments,
    pendingAssignments,
    overdueAssignments,
    assignmentCompletionRate: assignmentRate,
    totalFocusMinutes,
    totalFocusHours: (totalFocusMinutes / 60).toFixed(1),
    productivityScore,
    totalFocusSessions: focusSessions.length
  };
}

/**
 * Computes grid days for a given calendar month.
 */
export function getCalendarGrid(year, month) {
  // month is 0-indexed (0 = Jan, 11 = Dec)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Starting day of week: 0 = Sun, 1 = Mon ...
  const startDayOfWeek = firstDay.getDay(); // 0 is Sunday
  const daysInMonth = lastDay.getDate();

  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const grid = [];

  // Previous month padding
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const dateObj = new Date(year, month - 1, dayNum);
    grid.push({
      dateStr: formatDateISO(dateObj),
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: false
    });
  }

  // Current month days
  const todayISO = formatDateISO(new Date());
  for (let i = 1; i <= daysInMonth; i++) {
    const dateObj = new Date(year, month, i);
    const dateStr = formatDateISO(dateObj);
    grid.push({
      dateStr,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: dateStr === todayISO
    });
  }

  // Next month padding to fill complete weeks (up to 35 or 42 cells)
  const remainingCells = (7 - (grid.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const dateObj = new Date(year, month + 1, i);
    grid.push({
      dateStr: formatDateISO(dateObj),
      dayNumber: i,
      isCurrentMonth: false,
      isToday: false
    });
  }

  return grid;
}

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
