/**
 * Main app initialization and event handlers
 */

function sanitizeHtml(html) {
  // very small sanitizer: allow only a subset of tags and a/href
  const div = document.createElement('div');
  div.innerHTML = html || '';
  const allowed = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'P', 'BR', 'UL', 'OL', 'LI', 'SPAN', 'A']);
  const walker = document.createTreeWalker(div, NodeFilter.SHOW_ELEMENT, null);
  const toRemove = [];
  while (walker.nextNode()) {
    const el = walker.currentNode;
    if (!allowed.has(el.tagName)) {
      toRemove.push(el);
      continue;
    }
    if (el.tagName === 'A') {
      // keep only href, target, rel
      const href = el.getAttribute('href');
      el.getAttributeNames().forEach(n => {
        if (!['href', 'target', 'rel'].includes(n)) el.removeAttribute(n);
      });
      if (href && href.startsWith('javascript:')) el.removeAttribute('href');
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer nofollow');
    } else {
      // strip all attributes
      el.getAttributeNames().forEach(n => el.removeAttribute(n));
    }
  }
  toRemove.forEach(el => el.replaceWith(document.createTextNode(el.textContent || '')));
  return div.innerHTML;
}

// Modal event listeners
if (els.modalClose) els.modalClose.addEventListener('click', closeModal);
if (els.modal) {
  els.modal.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.dataset && target.dataset.close) closeModal();
  });
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && els.modal && !els.modal.classList.contains('hidden')) closeModal();
});

// Calendar back button
if (els.calendarBackBtn) els.calendarBackBtn.addEventListener('click', hideCalendarView);

// View toggle buttons
const viewListBtn = document.getElementById('viewList');
const viewCalendarBtn = document.getElementById('viewCalendar');

if (viewListBtn && viewCalendarBtn) {
  viewListBtn.addEventListener('click', () => {
    hideCalendarView();
    viewListBtn.classList.add('active');
    viewCalendarBtn.classList.remove('active');
  });
  
  viewCalendarBtn.addEventListener('click', () => {
    window.showCalendarView();
    viewCalendarBtn.classList.add('active');
    viewListBtn.classList.remove('active');
  });
}

// Boot the app
document.addEventListener('DOMContentLoaded', () => {
  loadData();
});

// Fallback if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (state.view === 'auto') loadData();
  });
} else {
  if (state.view === 'auto') loadData();
}
