/**
 * Data loading and view routing
 */

// Try to load JSON next to index.html first (for GitHub Pages),
// then fall back to parent folder (for local dev layout),
// and finally from the repo's raw URL as a last resort.
const DATA_URL_CANDIDATES = [
  '../elective_2025.json',
  'https://raw.githubusercontent.com/thanamn/elective-visualizer/main/elective_2025.json'
];

async function loadData() {
  let lastErr = null;
  for (const url of DATA_URL_CANDIDATES) {
    setStatus(`Loading ${url}…`);
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
      state.raw = json;
      setStatus(`Loaded ${url}`);
      renderAuto(json);
      return;
    } catch (err) {
      lastErr = err;
    }
  }
  setStatus(`Failed to load data: ${lastErr ? lastErr.message : 'Unknown error'}`);
  renderError(lastErr || new Error('Failed to load data'));
}

function renderAuto(data) {
  els.content.innerHTML = '';
  if (data && Array.isArray(data.courses)) {
    state.view = 'courses';
    setupCourses(data.courses);
  } else if (isArrayOfObjects(data)) {
    state.view = 'table';
    setupTable(data);
  } else {
    state.view = 'tree';
    els.content.appendChild(renderTree(data));
    setSummary('Displaying raw JSON tree');
  }
}

function renderError(err) {
  const div = document.createElement('div');
  div.className = 'error';
  div.innerHTML = `<h2>Error</h2><pre>${escapeHtml(err.message || String(err))}</pre>`;
  els.content.appendChild(div);
}
