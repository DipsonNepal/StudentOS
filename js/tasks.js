/**
 * StudentOS - Tasks Management Module
 * Handles task creation, editing, deletion, completion toggle, filtering, search, and sorting.
 */

import { storage } from './storage.js';
import { calculateDaysRemaining, filterAndSortTasks } from './logic.js';

let currentFilter = 'all';
let currentCategory = 'all';
let currentPriority = 'all';
let currentSort = 'dueDate';
let searchQuery = '';
let editingTaskId = null;

export function initTasks() {
  bindEvents();
  renderTasks();
}

function bindEvents() {
  // Filter tabs
  const tabs = document.querySelectorAll('.task-filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-filter') || 'all';
      renderTasks();
    });
  });

  // Search input
  const searchInput = document.getElementById('task-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderTasks();
    });
  }

  // Category filter dropdown
  const categorySelect = document.getElementById('task-category-select');
  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      currentCategory = e.target.value;
      renderTasks();
    });
  }

  // Priority filter dropdown
  const prioritySelect = document.getElementById('task-priority-select');
  if (prioritySelect) {
    prioritySelect.addEventListener('change', (e) => {
      currentPriority = e.target.value;
      renderTasks();
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById('task-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderTasks();
    });
  }

  // Add task button
  const addTaskBtn = document.getElementById('btn-add-task');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => openTaskModal());
  }

  // Task form submit
  const taskForm = document.getElementById('task-form');
  if (taskForm) {
    taskForm.addEventListener('submit', handleTaskFormSubmit);
  }
}

export function renderTasks() {
  const container = document.getElementById('tasks-list-container');
  if (!container) return;

  const allTasks = storage.getTasks();
  const filtered = filterAndSortTasks(allTasks, {
    filter: currentFilter,
    category: currentCategory,
    priority: currentPriority,
    sortBy: currentSort,
    searchQuery: searchQuery
  });

  // Update count badge
  const pendingCount = allTasks.filter(t => !t.completed).length;
  const taskBadge = document.getElementById('sidebar-task-badge');
  if (taskBadge) taskBadge.textContent = pendingCount;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i data-lucide="check-circle-2"></i></div>
        <h3>No tasks found</h3>
        <p>${searchQuery ? 'Try adjusting your search query or filters.' : 'All caught up! Add a new task to stay organized.'}</p>
        <button class="btn btn-primary" onclick="window.openTaskModal()">+ Add New Task</button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(task => {
    const daysInfo = calculateDaysRemaining(task.dueDate);
    const isCompleted = !!task.completed;

    return `
      <div class="task-card ${isCompleted ? 'completed' : ''}" data-id="${task.id}">
        <div class="task-main-col">
          <div class="custom-checkbox ${isCompleted ? 'checked' : ''}" onclick="window.toggleTaskItem('${task.id}')" title="Toggle status">
            ${isCompleted ? '<i data-lucide="check" style="width:12px;height:12px;"></i>' : ''}
          </div>
          <div class="task-info">
            <div class="task-title">${escapeHtml(task.title)}</div>
            ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
            <div class="task-tags">
              <span class="badge badge-${(task.priority || 'medium').toLowerCase()}">${task.priority}</span>
              <span class="badge badge-category">${escapeHtml(task.category || 'General')}</span>
              <span class="days-badge ${daysInfo.statusClass}">
                <i data-lucide="calendar" style="width:12px;height:12px;display:inline;"></i>
                ${daysInfo.text}
              </span>
            </div>
          </div>
        </div>
        <div class="task-actions">
          <button class="btn-icon" onclick="window.editTaskItem('${task.id}')" title="Edit Task">
            <i data-lucide="pencil" style="width:16px;height:16px;"></i>
          </button>
          <button class="btn-icon" onclick="window.deleteTaskItem('${task.id}')" title="Delete Task">
            <i data-lucide="trash-2" style="width:16px;height:16px;color:var(--accent-rose);"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

export function openTaskModal(taskId = null) {
  editingTaskId = taskId;
  const modal = document.getElementById('task-modal');
  const titleEl = document.getElementById('task-modal-title');
  const form = document.getElementById('task-form');
  
  if (!modal || !form) return;

  if (taskId) {
    const task = storage.getTasks().find(t => t.id === taskId);
    if (!task) return;
    titleEl.textContent = 'Edit Task';
    document.getElementById('task-input-title').value = task.title || '';
    document.getElementById('task-input-desc').value = task.description || '';
    document.getElementById('task-input-priority').value = task.priority || 'Medium';
    document.getElementById('task-input-duedate').value = task.dueDate || '';
    document.getElementById('task-input-category').value = task.category || 'Homework';
  } else {
    titleEl.textContent = 'Add New Task';
    form.reset();
    // Default due date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('task-input-duedate').value = today;
  }

  modal.classList.add('active');
  document.getElementById('task-input-title').focus();
}

function handleTaskFormSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('task-input-title').value.trim();
  const description = document.getElementById('task-input-desc').value.trim();
  const priority = document.getElementById('task-input-priority').value;
  const dueDate = document.getElementById('task-input-duedate').value;
  const category = document.getElementById('task-input-category').value;

  if (!title) {
    window.showToast('Please enter a task title', 'error');
    return;
  }

  if (editingTaskId) {
    storage.updateTask(editingTaskId, { title, description, priority, dueDate, category });
    window.showToast('Task updated successfully', 'success');
  } else {
    storage.addTask({ title, description, priority, dueDate, category });
    window.showToast('New task added', 'success');
  }

  document.getElementById('task-modal').classList.remove('active');
  renderTasks();
  if (window.refreshAllViews) window.refreshAllViews();
}

// Window globally accessible methods for inline event hooks
window.openTaskModal = openTaskModal;

window.toggleTaskItem = (id) => {
  storage.toggleTaskCompleted(id);
  renderTasks();
  if (window.refreshAllViews) window.refreshAllViews();
};

window.editTaskItem = (id) => {
  openTaskModal(id);
};

window.deleteTaskItem = (id) => {
  if (confirm('Are you sure you want to delete this task?')) {
    storage.deleteTask(id);
    window.showToast('Task deleted', 'info');
    renderTasks();
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
