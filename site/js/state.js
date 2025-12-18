/**
 * Global state management
 */

const state = {
  raw: null,
  view: 'auto',
  keys: [],
  rows: [],
  filtered: [],
  sortKey: null,
  sortDir: 'asc',
  lastQuery: '',
  // courses view
  courses: [],
  coursesFiltered: [],
  categories: [],
  filters: {
    day: '',
    lang: '',
    half: '',
    year: '',
    category: '',
    sort: 'name',
  }
};

const calendarState = {
  selectedCourses: new Set(),
  mergedCells: new Set(),
};

// DOM element references
const els = {
  status: document.getElementById('fileStatus'),
  content: document.getElementById('content'),
  summary: document.getElementById('summary'),
  search: document.getElementById('searchInput'),
  clearSearch: document.getElementById('clearSearch'),
  reload: document.getElementById('reloadBtn'),
  sortSelect: document.getElementById('sortSelect'),
  daySelect: document.getElementById('daySelect'),
  langSelect: document.getElementById('langSelect'),
  halfSelect: document.getElementById('halfSelect'),
  yearSelect: document.getElementById('yearSelect'),
  categorySelect: document.getElementById('categorySelect'),
  resetFilters: document.getElementById('resetFilters'),
  // modal
  modal: document.getElementById('modal'),
  modalClose: document.getElementById('modalClose'),
  modalTitle: document.getElementById('modalTitle'),
  modalMeta: document.getElementById('modalMeta'),
  modalSched: document.getElementById('modalSched'),
  modalChips: document.getElementById('modalChips'),
  modalStats: document.getElementById('modalStats'),
  modalDesc: document.getElementById('modalDesc'),
  // calendar
  calendarSection: document.getElementById('calendarSection'),
  calendarGrid: document.getElementById('calendarGrid'),
  calendarInfo: document.getElementById('calendarInfo'),
  calendarBackBtn: document.getElementById('calendarBackBtn'),
};

// Utilities
function isPlainObject(x) {
  return x && typeof x === 'object' && !Array.isArray(x);
}

function isArrayOfObjects(x) {
  return Array.isArray(x) && x.length > 0 && x.every(isPlainObject);
}

function setStatus(text) {
  els.status.textContent = text;
}

function setSummary(text) {
  els.summary.textContent = text;
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(text).replace(/[&<>"']/g, c => map[c]);
}
