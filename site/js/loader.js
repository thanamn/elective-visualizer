/**
 * Data loading and view routing
 */

// Build candidate URLs based on ?data= param or defaults.
// Usage examples:
//   - Default: tries elective_latest.json then elective_2025.json from repo root (and raw GH)
//   - Custom:  ?data=elective_2025_2025-12-18T09-00.json
//   - Remote:  ?data=https://example.com/myfile.json
function buildDataUrls() {
  const params = new URLSearchParams(window.location.search);
  const dataParam = params.get('data');
  const chosen = dataParam === 'latest' ? 'elective_latest.json' : dataParam;
  const names = chosen ? [chosen] : ['elective_latest.json', 'elective_2025.json'];
  const urls = [];
  const seen = new Set();

  const add = (u) => {
    if (!u || seen.has(u)) return;
    seen.add(u);
    urls.push(u);
  };

  for (const name of names) {
    if (name.startsWith('http')) {
      add(name);
      continue;
    }
    // Relative to site/ going up one level (repo root)
    const sanitized = name.replace(/^\.\/+/, '');
    add(`../${sanitized}`);
    // Raw GitHub fallback
    add(`https://raw.githubusercontent.com/thanamn/elective-visualizer/main/${sanitized}`);
  }
  return urls;
}

async function loadData() {
  let lastErr = null;
  const candidates = buildDataUrls();
  for (const url of candidates) {
    setStatus(`Loading ${url}…`);
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
      state.raw = json;
      setStatus(`Loaded ${url}`);
      updateDataInfo(url, json);
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

function updateDataInfo(url, data) {
  const infoEl = document.getElementById('dataInfo');
  if (!infoEl) return;
  
  const fileName = url.split('/').pop().split('?')[0];
  const timestamp = data.data_gathered_at;
  
  let text = `Data source: ${fileName}`;
  if (timestamp) {
    try {
      const date = new Date(timestamp);
      const formatted = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      text += ` • Gathered: ${formatted}`;
    } catch (e) {
      text += ` • Gathered: ${timestamp}`;
    }
  }
  
  infoEl.textContent = text;
}
