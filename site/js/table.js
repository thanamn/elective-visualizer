/**
 * Table view (fallback for non-course data)
 */

function setupTable(arr) {
  state.rows = arr.slice();
  const sample = arr.slice(0, 500);
  const keySet = new Set();
  for (const r of sample) Object.keys(r).forEach(k => keySet.add(k));
  state.keys = Array.from(keySet);

  state.sortKey = state.keys[0] || null;
  state.sortDir = 'asc';
  state.filtered = state.rows.slice();

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';

  const table = document.createElement('table');
  table.className = 'table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const k of state.keys) {
    const th = document.createElement('th');
    th.className = 'th-sortable';
    th.tabIndex = 0;
    th.setAttribute('role', 'button');
    th.setAttribute('aria-label', `Sort by ${k}`);
    th.dataset.key = k;

    const label = document.createElement('span');
    label.textContent = k;
    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.textContent = '⇅';

    th.appendChild(label);
    th.appendChild(arrow);
    th.addEventListener('click', () => toggleSort(k));
    th.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort(k); }
    });
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  wrap.appendChild(table);
  els.content.appendChild(wrap);

  setupSearch();
  applySortAndRender();
}

function setupSearch() {
  els.search.value = state.lastQuery;
  els.search.addEventListener('input', onSearchChanged);
  els.clearSearch.addEventListener('click', () => {
    els.search.value = '';
    onSearchChanged();
    els.search.focus();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.activeElement !== els.search) {
      els.search.value = '';
      onSearchChanged();
    }
  });
  els.reload.addEventListener('click', () => loadData());
}

function onSearchChanged() {
  const q = (els.search.value || '').trim().toLowerCase();
  state.lastQuery = q;
  if (state.view === 'courses') {
    applyCoursesFilters();
    return;
  }
  if (!q) {
    state.filtered = state.rows.slice();
    applySortAndRender();
    return;
  }

  state.filtered = state.rows.filter(r =>
    state.keys.some(k => valueToString(r[k]).toLowerCase().includes(q))
  );
  applySortAndRender();
}

function toggleSort(key) {
  if (state.sortKey === key) {
    state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    state.sortKey = key;
    state.sortDir = 'asc';
  }
  applySortAndRender();
}

function applySortAndRender() {
  const key = state.sortKey;
  if (key) {
    const dir = state.sortDir === 'asc' ? 1 : -1;
    state.filtered.sort((a, b) => compare(valueForSort(a[key]), valueForSort(b[key])) * dir);
  }
  renderTableBody();
  updateHeaderSortIndicator();
  setSummary(`Rows: ${state.filtered.length} / ${state.rows.length}` + (state.lastQuery ? ` · Filter: "${state.lastQuery}"` : ''));
}

function renderTableBody() {
  const tbody = document.querySelector('.table tbody');
  if (!tbody) return;
  const frag = document.createDocumentFragment();
  for (const row of state.filtered) {
    const tr = document.createElement('tr');
    for (const k of state.keys) {
      const td = document.createElement('td');
      const val = row[k];
      if (val == null || val === '') {
        td.innerHTML = '<span class="cell-null">—</span>';
      } else if (Array.isArray(val)) {
        td.innerHTML = val.length ? val.map(x => `<span class="cell-chip">${escapeHtml(valueToString(x))}</span>`).join(' ') : '<span class="cell-null">[]</span>';
      } else if (typeof val === 'object') {
        td.textContent = valueToString(val);
      } else {
        td.textContent = String(val);
      }
      tr.appendChild(td);
    }
    frag.appendChild(tr);
  }
  tbody.replaceChildren(frag);
}

function updateHeaderSortIndicator() {
  document.querySelectorAll('.th-sortable').forEach(th => {
    const active = th.dataset.key === state.sortKey;
    th.classList.toggle('active', active);
    const arrow = th.querySelector('.arrow');
    if (active && arrow) arrow.textContent = state.sortDir === 'asc' ? '↑' : '↓';
    else if (arrow) arrow.textContent = '⇅';
  });
}
