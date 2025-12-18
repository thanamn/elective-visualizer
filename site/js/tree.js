/**
 * Tree view (fallback for raw JSON display)
 */

function renderTree(data) {
  const root = document.createElement('div');
  root.className = 'tree';
  root.appendChild(renderNode(data, 'root'));
  const note = document.createElement('div');
  note.className = 'note';
  note.textContent = 'Tip: Serve this folder over HTTP (e.g., VS Code Live Server) so fetch works reliably.';
  root.appendChild(note);
  return root;
}

function renderNode(val, key) {
  if (isPlainObject(val)) {
    const details = document.createElement('details');
    details.open = key === 'root';
    const summary = document.createElement('summary');
    summary.innerHTML = key === 'root' ? '{ … } object' : `<span class="k">"${escapeHtml(key)}"</span>: { … }`;
    details.appendChild(summary);
    for (const k of Object.keys(val)) {
      details.appendChild(renderNode(val[k], k));
    }
    return details;
  }
  if (Array.isArray(val)) {
    const details = document.createElement('details');
    details.open = key === 'root';
    const summary = document.createElement('summary');
    summary.innerHTML = key === 'root' ? `[ … ] array(${val.length})` : `<span class="k">"${escapeHtml(key)}"</span>: [ … ] (${val.length})`;
    details.appendChild(summary);
    val.forEach((v, i) => details.appendChild(renderNode(v, String(i))));
    return details;
  }
  const leaf = document.createElement('div');
  leaf.innerHTML = `<span class="k">"${escapeHtml(key)}"</span>: ${renderLeaf(val)}`;
  return leaf;
}

function renderLeaf(v) {
  if (v === null) return '<span class="null">null</span>';
  if (typeof v === 'string') return `<span class="s">"${escapeHtml(v)}"</span>`;
  if (typeof v === 'number') return `<span class="n">${v}</span>`;
  if (typeof v === 'boolean') return `<span class="b">${v}</span>`;
  return `<span class="x">${escapeHtml(String(v))}</span>`;
}
