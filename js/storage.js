/**
 * StudentOS - LocalStorage Data Layer & Persistence
 * Manages tasks, assignments, notes, timetable, calendar events, focus history, and user settings.
 */

const STORAGE_KEYS = {
  TASKS: 'studentos_tasks',
  ASSIGNMENTS: 'studentos_assignments',
  NOTES: 'studentos_notes',
  TIMETABLE: 'studentos_timetable',
  CALENDAR_EVENTS: 'studentos_calendar_events',
  FOCUS_HISTORY: 'studentos_focus_history',
  SETTINGS: 'studentos_settings',
  INITIALIZED: 'studentos_initialized_v2'
};

// Generate relative date string in YYYY-MM-DD
function getRelativeDateStr(dayOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_SETTINGS = {
  theme: 'dark',
  userName: 'Alex Rivera',
  userMajor: 'Computer Science & Engineering',
  userAvatar: '🧑‍💻',
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  soundAlerts: true,
  deadlineNotifications: true,
  dailyGoalHours: 4
};

const DEFAULT_TASKS = [
  {
    id: 't-1',
    title: 'Complete Distributed Systems Lab 3',
    description: 'Implement Paxos consensus protocol and verify election timeout scenarios.',
    priority: 'High',
    dueDate: getRelativeDateStr(0), // Today
    category: 'Homework',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 't-2',
    title: 'Read Physics Ch. 12: Quantum States',
    description: 'Review wave equations and solve practice problems 14 through 28.',
    priority: 'Medium',
    dueDate: getRelativeDateStr(1), // Tomorrow
    category: 'Reading',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 't-3',
    title: 'Linear Algebra Eigenvalues Problem Set',
    description: 'Calculate characteristic polynomials and orthogonal matrices.',
    priority: 'High',
    dueDate: getRelativeDateStr(2),
    category: 'Homework',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 't-4',
    title: 'Prepare Slide Deck for Database Seminar',
    description: 'Create 12 slides detailing B-Tree vs LSM Tree indexing tradeoffs.',
    priority: 'Medium',
    dueDate: getRelativeDateStr(3),
    category: 'Project',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 't-5',
    title: 'Review Midterm Feedback with TA',
    description: 'Visit office hours on Thursday 2 PM to clarify question 4 grading.',
    priority: 'Low',
    dueDate: getRelativeDateStr(4),
    category: 'General',
    completed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 't-6',
    title: 'Organic Chemistry Chapter 8 Quiz Prep',
    description: 'Flashcards on reaction mechanisms and chiral stereochemistry.',
    priority: 'Low',
    dueDate: getRelativeDateStr(-2), // Overdue
    category: 'Exam Prep',
    completed: false,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_ASSIGNMENTS = [
  {
    id: 'a-1',
    title: 'Operating Systems: Custom Memory Allocator',
    description: 'Build a thread-safe slab allocator with memory fragmentation benchmarks in C/C++.',
    subject: 'Computer Science',
    dueDate: getRelativeDateStr(3),
    priority: 'High',
    status: 'In Progress',
    weight: '25%',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'a-2',
    title: 'Calculus III: Vector Calculus Capstone',
    description: 'Stokes and Divergence theorem proofs with multi-variable simulation model.',
    subject: 'Mathematics',
    dueDate: getRelativeDateStr(7),
    priority: 'High',
    status: 'In Progress',
    weight: '20%',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'a-3',
    title: 'Electromagnetism Lab Report #4',
    description: 'Experimental measurement of Hall effect and magnetic dipole fields.',
    subject: 'Physics',
    dueDate: getRelativeDateStr(-1), // Overdue
    priority: 'High',
    status: 'In Progress',
    weight: '15%',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'a-4',
    title: 'Macroeconomics Policy Synthesis Essay',
    description: 'Comparative monetary policy response analysis of central banks.',
    subject: 'Economics',
    dueDate: getRelativeDateStr(12),
    priority: 'Medium',
    status: 'Not Started',
    weight: '15%',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'a-5',
    title: 'Data Structures: Red-Black Tree Implementation',
    description: 'Self-balancing binary tree with insertion rebalancing and deletion test suites.',
    subject: 'Computer Science',
    dueDate: getRelativeDateStr(-5),
    priority: 'Medium',
    status: 'Completed',
    weight: '15%',
    completed: true,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_NOTES = [
  {
    id: 'n-1',
    title: '🧠 Graph Algorithms & Complexity Quick Reference',
    category: 'Study Guide',
    color: 'indigo', // 'indigo', 'purple', 'teal', 'rose', 'amber', 'slate'
    pinned: true,
    content: `Key Complexity Cheatsheet:\n- Dijkstra with min-heap: O((V + E) log V)\n- Bellman-Ford: O(V * E) - handles negative cycles\n- Floyd-Warshall: O(V^3) - all-pairs shortest paths\n- Tarjan's SCC: O(V + E) using DFS lowlink values\n\nRemember: When graphs are DAGs, Topological Sort gives O(V + E) shortest paths!`,
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'n-2',
    title: '⚡ Thermodynamic Laws & Equations Summary',
    category: 'Exam Prep',
    color: 'purple',
    pinned: true,
    content: `1. First Law: dU = dQ - dW (Energy conservation)\n2. Second Law: dS >= dQ / T (Entropy non-decreasing in isolated system)\n3. Carnot Efficiency: η = 1 - (Tc / Th)\n4. Gibbs Free Energy: ΔG = ΔH - TΔS\n* Spontaneous reaction occurs when ΔG < 0!`,
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'n-3',
    title: '🚀 Capstone Project Ideas: AI Academic Planner',
    category: 'Ideas',
    color: 'teal',
    pinned: false,
    content: `- Autonomous calendar synchronization with syllabus PDFs\n- Real-time study workload balancing\n- Predictive grade trajectory based on assignments and exam trends\n- Focus timer with Spotify/ambient noise integration`,
    updatedAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'n-4',
    title: '📖 Literature Review: Hamlet Tragedy Architecture',
    category: 'Lecture Notes',
    color: 'amber',
    pinned: false,
    content: `Prof. Mercer Lecture Highlights:\n- Hesitation as tragic flaw vs calculated survival mechanism\n- The meta-theatrical play-within-a-play ("The Mousetrap")\n- Contrast with Laertes: action without reflection vs reflection without action.`,
    updatedAt: new Date(Date.now() - 259200000).toISOString()
  }
];

const DEFAULT_TIMETABLE = [
  { id: 'tt-1', day: 'Monday', startTime: '09:00', endTime: '10:30', subject: 'Data Structures & Algorithms', location: 'Turing Lecture Hall B', instructor: 'Prof. Donald Knuth', color: 'indigo' },
  { id: 'tt-2', day: 'Monday', startTime: '11:00', endTime: '12:30', subject: 'Linear Algebra', location: 'Math Building Rm 302', instructor: 'Dr. Katherine Johnson', color: 'purple' },
  { id: 'tt-3', day: 'Monday', startTime: '14:00', endTime: '15:30', subject: 'Economics 101', location: 'Hall of Commerce 101', instructor: 'Dr. John Nash', color: 'amber' },

  { id: 'tt-4', day: 'Tuesday', startTime: '10:00', endTime: '11:30', subject: 'Operating Systems', location: 'Science Center Lab 4', instructor: 'Prof. Ken Thompson', color: 'teal' },
  { id: 'tt-5', day: 'Tuesday', startTime: '13:30', endTime: '15:00', subject: 'Modern Physics II', location: 'Physics Amphitheater 1', instructor: 'Dr. Richard Feynman', color: 'rose' },

  { id: 'tt-6', day: 'Wednesday', startTime: '09:00', endTime: '10:30', subject: 'Data Structures & Algorithms', location: 'Turing Lecture Hall B', instructor: 'Prof. Donald Knuth', color: 'indigo' },
  { id: 'tt-7', day: 'Wednesday', startTime: '13:00', endTime: '15:00', subject: 'Systems Programming Lab', location: 'Computer Lab 304', instructor: 'TA Michael', color: 'teal' },

  { id: 'tt-8', day: 'Thursday', startTime: '10:00', endTime: '11:30', subject: 'Operating Systems', location: 'Science Center Lab 4', instructor: 'Prof. Ken Thompson', color: 'teal' },
  { id: 'tt-9', day: 'Thursday', startTime: '13:30', endTime: '15:00', subject: 'Modern Physics II', location: 'Physics Amphitheater 1', instructor: 'Dr. Richard Feynman', color: 'rose' },

  { id: 'tt-10', day: 'Friday', startTime: '11:00', endTime: '12:30', subject: 'Linear Algebra Discussion', location: 'Math Building Rm 302', instructor: 'Dr. Katherine Johnson', color: 'purple' },
  { id: 'tt-11', day: 'Friday', startTime: '14:00', endTime: '15:30', subject: 'Computer Science Colloquium', location: 'Main Auditorium', instructor: 'Guest Speakers', color: 'slate' }
];

const DEFAULT_CALENDAR_EVENTS = [
  { id: 'ce-1', title: 'Calculus Midterm Review Session', date: getRelativeDateStr(2), time: '16:00', type: 'Study Session', notes: 'Library Study Room 4B with study group' },
  { id: 'ce-2', title: 'Hackathon Project Pitch Meeting', date: getRelativeDateStr(5), time: '18:00', type: 'Extracurricular', notes: 'Virtual via Discord' },
  { id: 'ce-3', title: 'Physics Department Office Hours', date: getRelativeDateStr(1), time: '14:00', type: 'Office Hours', notes: 'Ask about question 4 in lab report' },
  { id: 'ce-4', title: 'Career Fair & Tech Expo', date: getRelativeDateStr(10), time: '10:00', type: 'Event', notes: 'Bring 10 copies of updated resume' }
];

const DEFAULT_FOCUS_HISTORY = [
  { id: 'fs-1', date: getRelativeDateStr(-6), durationMinutes: 120, subject: 'Computer Science' },
  { id: 'fs-2', date: getRelativeDateStr(-5), durationMinutes: 150, subject: 'Mathematics' },
  { id: 'fs-3', date: getRelativeDateStr(-4), durationMinutes: 90, subject: 'Physics' },
  { id: 'fs-4', date: getRelativeDateStr(-3), durationMinutes: 180, subject: 'Computer Science' },
  { id: 'fs-5', date: getRelativeDateStr(-2), durationMinutes: 140, subject: 'Economics' },
  { id: 'fs-6', date: getRelativeDateStr(-1), durationMinutes: 200, subject: 'Mathematics' },
  { id: 'fs-7', date: getRelativeDateStr(0), durationMinutes: 75, subject: 'Computer Science' }
];

class StorageManager {
  constructor() {
    this.init();
  }

  init() {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
        this.resetToDefaults();
      }
    } catch (e) {
      console.warn('LocalStorage error or unavailable:', e);
    }
  }

  resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(DEFAULT_TASKS));
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(DEFAULT_ASSIGNMENTS));
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(DEFAULT_NOTES));
    localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(DEFAULT_TIMETABLE));
    localStorage.setItem(STORAGE_KEYS.CALENDAR_EVENTS, JSON.stringify(DEFAULT_CALENDAR_EVENTS));
    localStorage.setItem(STORAGE_KEYS.FOCUS_HISTORY, JSON.stringify(DEFAULT_FOCUS_HISTORY));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  _getItem(key, fallback = []) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return fallback;
    }
  }

  _setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error writing ${key} to localStorage:`, e);
      return false;
    }
  }

  // --- Settings ---
  getSettings() {
    return { ...DEFAULT_SETTINGS, ...this._getItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS) };
  }

  saveSettings(newSettings) {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    this._setItem(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  // --- Tasks ---
  getTasks() {
    return this._getItem(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
  }

  addTask(taskData) {
    const tasks = this.getTasks();
    const newTask = {
      id: 't-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: taskData.title.trim(),
      description: taskData.description ? taskData.description.trim() : '',
      priority: taskData.priority || 'Medium',
      dueDate: taskData.dueDate || getRelativeDateStr(0),
      category: taskData.category || 'General',
      completed: false,
      createdAt: new Date().toISOString()
    };
    tasks.unshift(newTask);
    this._setItem(STORAGE_KEYS.TASKS, tasks);
    return newTask;
  }

  updateTask(id, updates) {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      this._setItem(STORAGE_KEYS.TASKS, tasks);
      return tasks[index];
    }
    return null;
  }

  toggleTaskCompleted(id) {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index].completed = !tasks[index].completed;
      this._setItem(STORAGE_KEYS.TASKS, tasks);
      return tasks[index];
    }
    return null;
  }

  deleteTask(id) {
    let tasks = this.getTasks();
    tasks = tasks.filter(t => t.id !== id);
    this._setItem(STORAGE_KEYS.TASKS, tasks);
    return true;
  }

  // --- Assignments ---
  getAssignments() {
    return this._getItem(STORAGE_KEYS.ASSIGNMENTS, DEFAULT_ASSIGNMENTS);
  }

  addAssignment(assignmentData) {
    const assignments = this.getAssignments();
    const newAssignment = {
      id: 'a-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: assignmentData.title.trim(),
      description: assignmentData.description ? assignmentData.description.trim() : '',
      subject: assignmentData.subject || 'General',
      dueDate: assignmentData.dueDate || getRelativeDateStr(3),
      priority: assignmentData.priority || 'Medium',
      status: assignmentData.status || 'Not Started',
      weight: assignmentData.weight || '',
      completed: assignmentData.status === 'Completed',
      createdAt: new Date().toISOString()
    };
    assignments.unshift(newAssignment);
    this._setItem(STORAGE_KEYS.ASSIGNMENTS, assignments);
    return newAssignment;
  }

  updateAssignment(id, updates) {
    const assignments = this.getAssignments();
    const index = assignments.findIndex(a => a.id === id);
    if (index !== -1) {
      assignments[index] = { ...assignments[index], ...updates };
      if (updates.status) {
        assignments[index].completed = updates.status === 'Completed';
      }
      this._setItem(STORAGE_KEYS.ASSIGNMENTS, assignments);
      return assignments[index];
    }
    return null;
  }

  deleteAssignment(id) {
    let assignments = this.getAssignments();
    assignments = assignments.filter(a => a.id !== id);
    this._setItem(STORAGE_KEYS.ASSIGNMENTS, assignments);
    return true;
  }

  // --- Notes ---
  getNotes() {
    return this._getItem(STORAGE_KEYS.NOTES, DEFAULT_NOTES);
  }

  addNote(noteData) {
    const notes = this.getNotes();
    const newNote = {
      id: 'n-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: noteData.title ? noteData.title.trim() : 'Untitled Note',
      content: noteData.content || '',
      category: noteData.category || 'General',
      color: noteData.color || 'indigo',
      pinned: !!noteData.pinned,
      updatedAt: new Date().toISOString()
    };
    notes.unshift(newNote);
    this._setItem(STORAGE_KEYS.NOTES, notes);
    return newNote;
  }

  updateNote(id, updates) {
    const notes = this.getNotes();
    const index = notes.findIndex(n => n.id === id);
    if (index !== -1) {
      notes[index] = { ...notes[index], ...updates, updatedAt: new Date().toISOString() };
      this._setItem(STORAGE_KEYS.NOTES, notes);
      return notes[index];
    }
    return null;
  }

  deleteNote(id) {
    let notes = this.getNotes();
    notes = notes.filter(n => n.id !== id);
    this._setItem(STORAGE_KEYS.NOTES, notes);
    return true;
  }

  toggleNotePinned(id) {
    const notes = this.getNotes();
    const index = notes.findIndex(n => n.id === id);
    if (index !== -1) {
      notes[index].pinned = !notes[index].pinned;
      notes[index].updatedAt = new Date().toISOString();
      this._setItem(STORAGE_KEYS.NOTES, notes);
      return notes[index];
    }
    return null;
  }

  // --- Timetable ---
  getTimetable() {
    return this._getItem(STORAGE_KEYS.TIMETABLE, DEFAULT_TIMETABLE);
  }

  addTimetableClass(entry) {
    const timetable = this.getTimetable();
    const newEntry = {
      id: 'tt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      day: entry.day || 'Monday',
      startTime: entry.startTime || '09:00',
      endTime: entry.endTime || '10:30',
      subject: entry.subject.trim(),
      location: entry.location ? entry.location.trim() : 'TBD',
      instructor: entry.instructor ? entry.instructor.trim() : '',
      color: entry.color || 'indigo'
    };
    timetable.push(newEntry);
    this._setItem(STORAGE_KEYS.TIMETABLE, timetable);
    return newEntry;
  }

  updateTimetableClass(id, updates) {
    const timetable = this.getTimetable();
    const index = timetable.findIndex(tt => tt.id === id);
    if (index !== -1) {
      timetable[index] = { ...timetable[index], ...updates };
      this._setItem(STORAGE_KEYS.TIMETABLE, timetable);
      return timetable[index];
    }
    return null;
  }

  deleteTimetableClass(id) {
    let timetable = this.getTimetable();
    timetable = timetable.filter(tt => tt.id !== id);
    this._setItem(STORAGE_KEYS.TIMETABLE, timetable);
    return true;
  }

  // --- Calendar Events ---
  getCalendarEvents() {
    return this._getItem(STORAGE_KEYS.CALENDAR_EVENTS, DEFAULT_CALENDAR_EVENTS);
  }

  addCalendarEvent(eventData) {
    const events = this.getCalendarEvents();
    const newEvent = {
      id: 'ce-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: eventData.title.trim(),
      date: eventData.date || getRelativeDateStr(0),
      time: eventData.time || '10:00',
      type: eventData.type || 'Event',
      notes: eventData.notes ? eventData.notes.trim() : ''
    };
    events.push(newEvent);
    this._setItem(STORAGE_KEYS.CALENDAR_EVENTS, events);
    return newEvent;
  }

  deleteCalendarEvent(id) {
    let events = this.getCalendarEvents();
    events = events.filter(e => e.id !== id);
    this._setItem(STORAGE_KEYS.CALENDAR_EVENTS, events);
    return true;
  }

  // --- Focus Session History ---
  getFocusHistory() {
    return this._getItem(STORAGE_KEYS.FOCUS_HISTORY, DEFAULT_FOCUS_HISTORY);
  }

  recordFocusSession(session) {
    const history = this.getFocusHistory();
    const newSession = {
      id: 'fs-' + Date.now(),
      date: getRelativeDateStr(0),
      durationMinutes: session.durationMinutes || 25,
      subject: session.subject || 'General Study',
      timestamp: new Date().toISOString()
    };
    history.push(newSession);
    this._setItem(STORAGE_KEYS.FOCUS_HISTORY, history);
    return newSession;
  }

  // --- Data Export & Import ---
  exportAllData() {
    return JSON.stringify({
      version: '2.4',
      exportDate: new Date().toISOString(),
      settings: this.getSettings(),
      tasks: this.getTasks(),
      assignments: this.getAssignments(),
      notes: this.getNotes(),
      timetable: this.getTimetable(),
      calendarEvents: this.getCalendarEvents(),
      focusHistory: this.getFocusHistory()
    }, null, 2);
  }

  importAllData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') throw new Error('Invalid backup format');
      if (data.settings) this._setItem(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.tasks) this._setItem(STORAGE_KEYS.TASKS, data.tasks);
      if (data.assignments) this._setItem(STORAGE_KEYS.ASSIGNMENTS, data.assignments);
      if (data.notes) this._setItem(STORAGE_KEYS.NOTES, data.notes);
      if (data.timetable) this._setItem(STORAGE_KEYS.TIMETABLE, data.timetable);
      if (data.calendarEvents) this._setItem(STORAGE_KEYS.CALENDAR_EVENTS, data.calendarEvents);
      if (data.focusHistory) this._setItem(STORAGE_KEYS.FOCUS_HISTORY, data.focusHistory);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const storage = new StorageManager();
