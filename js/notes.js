/**
 * StudentOS - Notes Manager Module
 * Fast note-taking, rich categories, pin system, accent colors, and debounced autosave.
 */

import { storage } from './storage.js';

let currentCategory = 'all';
let searchQuery = '';
let activeEditingNoteId = null;
let autosaveTimer = null;

export function initNotes() {
  bindEvents();
  renderNotes();
}

function bindEvents() {
  // Category tabs
  const tabs = document.querySelectorAll('.note-filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.getAttribute('data-category') || 'all';
      renderNotes();
    });
  });

  // Search input
  const searchInput = document.getElementById('note-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderNotes();
    });
  }

  // Add button
  const addBtn = document.getElementById('btn-add-note');
  if (addBtn) {
    addBtn.addEventListener('click', () => openNoteEditor(null));
  }

  // Editor modal inputs for autosave
  const noteTitleInput = document.getElementById('editor-note-title');
  const noteBodyInput = document.getElementById('editor-note-content');
  const noteCategorySelect = document.getElementById('editor-note-category');
  const noteColorSelect = document.getElementById('editor-note-color');

  const triggerAutosave = () => {
    clearTimeout(autosaveTimer);
    const indicator = document.getElementById('editor-autosave-indicator');
    if (indicator) indicator.textContent = 'Saving...';

    autosaveTimer = setTimeout(() => {
      saveActiveNote();
      if (indicator) indicator.textContent = 'Saved';
    }, 600);
  };

  if (noteTitleInput) noteTitleInput.addEventListener('input', triggerAutosave);
  if (noteBodyInput) noteBodyInput.addEventListener('input', triggerAutosave);
  if (noteCategorySelect) noteCategorySelect.addEventListener('change', triggerAutosave);
  if (noteColorSelect) noteColorSelect.addEventListener('change', triggerAutosave);
}

export function renderNotes() {
  const container = document.getElementById('notes-grid-container');
  if (!container) return;

  const allNotes = storage.getNotes();

  let filtered = allNotes.filter(n => {
    if (currentCategory !== 'all' && n.category !== currentCategory) return false;
    if (searchQuery) {
      const matchTitle = (n.title || '').toLowerCase().includes(searchQuery);
      const matchBody = (n.content || '').toLowerCase().includes(searchQuery);
      return matchTitle || matchBody;
    }
    return true;
  });

  // Sort pinned notes to the top, then by updatedAt desc
  filtered.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon"><i data-lucide="file-text"></i></div>
        <h3>No notes found</h3>
        <p>${searchQuery ? 'No notes matched your search.' : 'Capture lectures, formulas, and ideas in one place.'}</p>
        <button class="btn btn-primary" onclick="window.openNoteEditor(null)">+ Create Note</button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(note => {
    const formattedDate = new Date(note.updatedAt || Date.now()).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return `
      <div class="note-card note-${note.color || 'indigo'}" onclick="window.openNoteEditor('${note.id}')">
        <div class="note-card-header">
          <div class="note-title">${escapeHtml(note.title)}</div>
          <button class="note-pin-btn ${note.pinned ? 'pinned' : ''}" 
                  onclick="event.stopPropagation(); window.toggleNotePin('${note.id}')" 
                  title="${note.pinned ? 'Unpin note' : 'Pin note to top'}">
            <i data-lucide="pin" style="width:16px;height:16px;"></i>
          </button>
        </div>

        <div class="note-body">${escapeHtml(note.content || 'Empty note...')}</div>

        <div class="note-footer">
          <span class="badge badge-category" style="font-size:10.5px;">${escapeHtml(note.category || 'General')}</span>
          <div style="display:flex;align-items:center;gap:6px;">
            <span>${formattedDate}</span>
            <button class="btn-icon" style="width:24px;height:24px;" 
                    onclick="event.stopPropagation(); window.deleteNoteItem('${note.id}')" title="Delete note">
              <i data-lucide="trash-2" style="width:13px;height:13px;color:var(--accent-rose);"></i>
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

export function openNoteEditor(noteId = null) {
  activeEditingNoteId = noteId;
  const modal = document.getElementById('note-editor-modal');
  const titleInput = document.getElementById('editor-note-title');
  const contentInput = document.getElementById('editor-note-content');
  const categorySelect = document.getElementById('editor-note-category');
  const colorSelect = document.getElementById('editor-note-color');
  const indicator = document.getElementById('editor-autosave-indicator');

  if (!modal) return;

  if (noteId) {
    const note = storage.getNotes().find(n => n.id === noteId);
    if (!note) return;
    titleInput.value = note.title || '';
    contentInput.value = note.content || '';
    categorySelect.value = note.category || 'General';
    colorSelect.value = note.color || 'indigo';
    if (indicator) indicator.textContent = 'Saved';
  } else {
    // Creating a fresh note right away
    const newNote = storage.addNote({
      title: 'Untitled Note',
      content: '',
      category: 'General',
      color: 'indigo'
    });
    activeEditingNoteId = newNote.id;
    titleInput.value = newNote.title;
    contentInput.value = '';
    categorySelect.value = 'General';
    colorSelect.value = 'indigo';
    if (indicator) indicator.textContent = 'New draft';
  }

  modal.classList.add('active');
  titleInput.focus();
}

function saveActiveNote() {
  if (!activeEditingNoteId) return;

  const title = document.getElementById('editor-note-title').value.trim() || 'Untitled Note';
  const content = document.getElementById('editor-note-content').value;
  const category = document.getElementById('editor-note-category').value;
  const color = document.getElementById('editor-note-color').value;

  storage.updateNote(activeEditingNoteId, { title, content, category, color });
  renderNotes();
}

window.openNoteEditor = openNoteEditor;

window.closeNoteEditor = () => {
  saveActiveNote();
  const modal = document.getElementById('note-editor-modal');
  if (modal) modal.classList.remove('active');
  activeEditingNoteId = null;
  renderNotes();
};

window.toggleNotePin = (id) => {
  storage.toggleNotePinned(id);
  renderNotes();
};

window.deleteNoteItem = (id) => {
  if (confirm('Delete this note permanently?')) {
    storage.deleteNote(id);
    window.showToast('Note deleted', 'info');
    renderNotes();
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
