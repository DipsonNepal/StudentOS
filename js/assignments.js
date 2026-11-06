/**
 * StudentOS - Assignment Management Module
 * Handles academic assignments, submission deadlines, subject filtering, and status workflows.
 */

import { storage } from './storage.js';
import { calculateDaysRemaining, filterAssignments } from './logic.js';

let currentFilter = 'all';
let currentSubject = 'all';
let searchQuery = '';
let editingAssignmentId = null;

export function initAssignments() {
  bindEvents();
  renderAssignments();
}

function bindEvents() {
  // Tabs
  const tabs = document.querySelectorAll('.assignment-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-filter') || 'all';
      renderAssignments();
    });
  });

  // Subject filter
  const subjectSelect = document.getElementById('assignment-subject-select');
  if (subjectSelect) {
    subjectSelect.addEventListener('change', (e) => {
      currentSubject = e.target.value;
      renderAssignments();
    });
  }

  // Search input
  const searchInput = document.getElementById('assignment-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderAssignments();
    });
  }

  // Add button
  const addBtn = document.getElementById('btn-add-assignment');
  if (addBtn) {
    addBtn.addEventListener('click', () => openAssignmentModal());
  }

  // Form submit
  const form = document.getElementById('assignment-form');
  if (form) {
    form.addEventListener('submit', handleAssignmentFormSubmit);
  }
}

export function renderAssignments() {
  const container = document.getElementById('assignments-grid-container');
  if (!container) return;

  const allAssignments = storage.getAssignments();
  populateSubjectFilter(allAssignments);

  const filtered = filterAssignments(allAssignments, {
    filter: currentFilter,
    subject: currentSubject,
    searchQuery: searchQuery
  });

  // Update sidebar badge
  const pendingCount = allAssignments.filter(a => !a.completed && a.status !== 'Completed').length;
  const badge = document.getElementById('sidebar-assignment-badge');
  if (badge) badge.textContent = pendingCount;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon"><i data-lucide="book-open"></i></div>
        <h3>No assignments found</h3>
        <p>No coursework found for the selected filter.</p>
        <button class="btn btn-primary" onclick="window.openAssignmentModal()">+ Add New Assignment</button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(item => {
    const daysInfo = calculateDaysRemaining(item.dueDate);
    const isCompleted = item.status === 'Completed' || !!item.completed;

    return `
      <div class="assignment-card" data-id="${item.id}">
        <div class="assignment-card-header">
          <div>
            <div class="assignment-subject">${escapeHtml(item.subject || 'General')}</div>
            <div class="assignment-title">${escapeHtml(item.title)}</div>
          </div>
          <span class="badge badge-${(item.priority || 'medium').toLowerCase()}">${item.priority || 'Medium'}</span>
        </div>

        <div class="assignment-desc">${escapeHtml(item.description || 'No additional instructions provided.')}</div>

        <div class="assignment-meta-row">
          <div class="days-badge ${daysInfo.statusClass}">
            <i data-lucide="clock" style="width:14px;height:14px;"></i>
            <span>${daysInfo.text}</span>
          </div>

          <div style="display:flex;align-items:center;gap:6px;">
            <select onchange="window.updateAssignmentStatus('${item.id}', this.value)" style="width:auto;padding:4px 8px;font-size:11.5px;">
              <option value="Not Started" ${item.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
              <option value="In Progress" ${item.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Completed" ${isCompleted ? 'selected' : ''}>Completed</option>
            </select>
            <button class="btn-icon" onclick="window.editAssignmentItem('${item.id}')" title="Edit">
              <i data-lucide="pencil" style="width:15px;height:15px;"></i>
            </button>
            <button class="btn-icon" onclick="window.deleteAssignmentItem('${item.id}')" title="Delete">
              <i data-lucide="trash-2" style="width:15px;height:15px;color:var(--accent-rose);"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function populateSubjectFilter(assignments) {
  const select = document.getElementById('assignment-subject-select');
  if (!select) return;

  const subjects = Array.from(new Set(assignments.map(a => a.subject).filter(Boolean)));
  const currentVal = select.value;
  select.innerHTML = `<option value="all">All Subjects</option>` +
    subjects.map(s => `<option value="${escapeHtml(s)}" ${s === currentVal ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('');
}

export function openAssignmentModal(id = null) {
  editingAssignmentId = id;
  const modal = document.getElementById('assignment-modal');
  const titleEl = document.getElementById('assignment-modal-title');
  const form = document.getElementById('assignment-form');

  if (!modal || !form) return;

  if (id) {
    const item = storage.getAssignments().find(a => a.id === id);
    if (!item) return;
    titleEl.textContent = 'Edit Assignment';
    document.getElementById('assign-input-title').value = item.title || '';
    document.getElementById('assign-input-subject').value = item.subject || '';
    document.getElementById('assign-input-desc').value = item.description || '';
    document.getElementById('assign-input-priority').value = item.priority || 'Medium';
    document.getElementById('assign-input-duedate').value = item.dueDate || '';
    document.getElementById('assign-input-status').value = item.status || 'Not Started';
    document.getElementById('assign-input-weight').value = item.weight || '';
  } else {
    titleEl.textContent = 'Add New Assignment';
    form.reset();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    document.getElementById('assign-input-duedate').value = futureDate.toISOString().split('T')[0];
  }

  modal.classList.add('active');
  document.getElementById('assign-input-title').focus();
}

function handleAssignmentFormSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('assign-input-title').value.trim();
  const subject = document.getElementById('assign-input-subject').value.trim();
  const description = document.getElementById('assign-input-desc').value.trim();
  const priority = document.getElementById('assign-input-priority').value;
  const dueDate = document.getElementById('assign-input-duedate').value;
  const status = document.getElementById('assign-input-status').value;
  const weight = document.getElementById('assign-input-weight').value.trim();

  if (!title || !subject) {
    window.showToast('Please provide both title and subject', 'error');
    return;
  }

  if (editingAssignmentId) {
    storage.updateAssignment(editingAssignmentId, { title, subject, description, priority, dueDate, status, weight });
    window.showToast('Assignment updated', 'success');
  } else {
    storage.addAssignment({ title, subject, description, priority, dueDate, status, weight });
    window.showToast('Assignment added', 'success');
  }

  document.getElementById('assignment-modal').classList.remove('active');
  renderAssignments();
  if (window.refreshAllViews) window.refreshAllViews();
}

window.openAssignmentModal = openAssignmentModal;

window.updateAssignmentStatus = (id, newStatus) => {
  storage.updateAssignment(id, { status: newStatus });
  window.showToast(`Status updated to ${newStatus}`, 'info');
  renderAssignments();
  if (window.refreshAllViews) window.refreshAllViews();
};

window.editAssignmentItem = (id) => {
  openAssignmentModal(id);
};

window.deleteAssignmentItem = (id) => {
  if (confirm('Delete this assignment permanently?')) {
    storage.deleteAssignment(id);
    window.showToast('Assignment removed', 'info');
    renderAssignments();
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
