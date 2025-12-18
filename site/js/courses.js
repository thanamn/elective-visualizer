/**
 * Courses view: filtering, searching, rendering
 */

function setupCourses(courses) {
  state.courses = courses.slice();
  // derive categories
  const set = new Set();
  for (const c of state.courses) {
    if (Array.isArray(c.course_category)) c.course_category.forEach(x => x && set.add(String(x)));
  }
  state.categories = Array.from(set).sort((a, b) => a.localeCompare(b));

  // populate category select
  if (els.categorySelect) {
    els.categorySelect.innerHTML = '<option value="">All</option>' + state.categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  }

  // attach filter listeners
  setupSearch();
  if (els.sortSelect) els.sortSelect.addEventListener('change', () => { state.filters.sort = els.sortSelect.value; applyCoursesFilters(); });
  if (els.daySelect) els.daySelect.addEventListener('change', () => { state.filters.day = els.daySelect.value; applyCoursesFilters(); });
  if (els.langSelect) els.langSelect.addEventListener('change', () => { state.filters.lang = els.langSelect.value; applyCoursesFilters(); });
  if (els.halfSelect) els.halfSelect.addEventListener('change', () => { state.filters.half = els.halfSelect.value; applyCoursesFilters(); });
  if (els.yearSelect) els.yearSelect.addEventListener('change', () => { state.filters.year = els.yearSelect.value; applyCoursesFilters(); });
  if (els.categorySelect) els.categorySelect.addEventListener('change', () => { state.filters.category = els.categorySelect.value; applyCoursesFilters(); });
  if (els.resetFilters) els.resetFilters.addEventListener('click', resetAllFilters);

  applyCoursesFilters();
}

function resetAllFilters() {
  state.lastQuery = '';
  if (els.search) els.search.value = '';
  state.filters = { day: '', lang: '', half: '', year: '', category: '', sort: 'name' };
  if (els.sortSelect) els.sortSelect.value = 'name';
  if (els.daySelect) els.daySelect.value = '';
  if (els.langSelect) els.langSelect.value = '';
  if (els.halfSelect) els.halfSelect.value = '';
  if (els.yearSelect) els.yearSelect.value = '';
  if (els.categorySelect) els.categorySelect.value = '';
  applyCoursesFilters();
}

function applyCoursesFilters() {
  const q = (state.lastQuery || '').toLowerCase();
  const f = state.filters;
  let list = state.courses.filter(c => {
    if (q) {
      const hay = [c.name, c.teacher_name, c.reg_cu_name, c.course_no, c.short_description, c.course_owner].map(v => (v || '').toString().toLowerCase()).join(' ');
      if (!hay.includes(q)) return false;
    }
    if (f.lang && c.class_language !== f.lang) return false;
    if (f.year && !(Array.isArray(c.quota_type) && c.quota_type.includes(f.year))) return false;
    if (f.category && !(Array.isArray(c.course_category) && c.course_category.includes(f.category))) return false;
    if (f.day || f.half) {
      const sched = Array.isArray(c.schedule) ? c.schedule : [];
      const dayOk = !f.day || sched.some(s => s.day === f.day);
      const halfOk = !f.half || sched.some(s => s.semester_half === f.half);
      if (!dayOk || !halfOk) return false;
    }
    return true;
  });

  // sort
  switch (f.sort) {
    case 'enrolled':
      list.sort((a, b) => (b.total_enrolled || 0) - (a.total_enrolled || 0));
      break;
    case 'seat':
      list.sort((a, b) => (b.seat || 0) - (a.seat || 0));
      break;
    case 'newest':
      list.sort((a, b) => dateOrNull(b.updated_at) - dateOrNull(a.updated_at));
      break;
    case 'oldest':
      list.sort((a, b) => dateOrNull(a.created_at) - dateOrNull(b.created_at));
      break;
    case 'name':
    default:
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  state.coursesFiltered = list;
  renderCourses();
  setSummary(`Courses: ${state.coursesFiltered.length} / ${state.courses.length}` + (state.lastQuery ? ` · Filter: "${state.lastQuery}"` : ''));
}

function renderCourses() {
  const wrap = document.createElement('div');
  wrap.className = 'cards';
  for (const c of state.coursesFiltered) {
    wrap.appendChild(renderCourseCard(c));
  }
  els.content.replaceChildren(wrap);

  // add calendar button
  const calBtn = document.createElement('button');
  calBtn.textContent = '📅 View Calendar';
  calBtn.className = 'calendar-btn';
  calBtn.style.position = 'fixed';
  calBtn.style.bottom = '20px';
  calBtn.style.right = '20px';
  calBtn.style.zIndex = '50';
  calBtn.style.padding = '10px 16px';
  calBtn.style.borderRadius = '8px';
  calBtn.style.background = 'var(--accent)';
  calBtn.style.color = 'white';
  calBtn.style.border = 'none';
  calBtn.style.cursor = 'pointer';
  calBtn.addEventListener('click', () => window.showCalendarView());
  els.content.appendChild(calBtn);
}

function renderCourseCard(c) {
  const div = document.createElement('div');
  div.className = 'card';
  const title = document.createElement('h3');
  title.textContent = c.name || '(Untitled)';
  div.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'meta';
  const sec = c.section_no != null ? `Sec ${c.section_no}` : '';
  const courseNo = c.course_no ? `${c.course_no}` : '';
  const reg = c.reg_cu_name ? `${c.reg_cu_name}` : '';
  const parts = [courseNo, reg, sec].filter(Boolean).join(' · ');
  if (parts) meta.appendChild(textSpan(parts));
  if (c.teacher_name) meta.appendChild(pill(`👨‍🏫 ${c.teacher_name}`));
  if (c.class_language) meta.appendChild(pill(langLabel(c.class_language)));
  div.appendChild(meta);

  // schedule
  const schedDiv = document.createElement('div');
  schedDiv.className = 'sched';
  (Array.isArray(c.schedule) ? c.schedule : []).forEach(s => {
    const line = `${dayLabel(s.day)} ${timeFromIsoNoTZ(s.start_time)}–${timeFromIsoNoTZ(s.end_time)}${s.semester_half ? ` · ${halfLabel(s.semester_half)}` : ''}`;
    schedDiv.appendChild(textSpan(line));
  });
  if (!schedDiv.children.length) schedDiv.appendChild(textSpan('Schedule: —'));
  div.appendChild(schedDiv);

  // chips
  const chips = document.createElement('div');
  chips.className = 'chips';
  if (Array.isArray(c.course_category)) c.course_category.forEach(cat => chips.appendChild(chip(cat)));
  if (Array.isArray(c.quota_type)) c.quota_type.forEach(q => chips.appendChild(chip(yearLabel(q))));
  if (c.class_location && Array.isArray(c.class_location) && c.class_location.length) chips.appendChild(chip(`Room: ${c.class_location.join(', ')}`));
  if (c.course_owner) chips.appendChild(chip(`Owner: ${c.course_owner}`));
  div.appendChild(chips);

  // stats row
  const row = document.createElement('div');
  row.className = 'row';
  const cap = document.createElement('div');
  cap.className = 'stat';
  const enrolled = c.total_enrolled || 0;
  const seat = c.seat || 0;
  cap.innerHTML = `👥 <strong>${enrolled}</strong> / ${seat}`;
  row.appendChild(cap);
  if (c._count && typeof c._count.course_rankings === 'number') {
    const r = document.createElement('div');
    r.className = 'stat';
    r.innerHTML = `⭐ ${c._count.course_rankings}`;
    row.appendChild(r);
  }
  div.appendChild(row);

  // description
  if (c.short_description || c.description) {
    const desc = document.createElement('div');
    desc.className = 'desc';
    if (c.short_description && String(c.short_description).trim()) {
      desc.textContent = String(c.short_description).trim();
    } else if (c.description) {
      desc.innerHTML = sanitizeHtml(c.description);
    }
    div.appendChild(desc);
  }

  // details button
  const btnRow = document.createElement('div');
  btnRow.className = 'row';
  const detailsBtn = document.createElement('button');
  detailsBtn.textContent = 'View details';
  detailsBtn.className = 'secondary';
  detailsBtn.addEventListener('click', () => openModal(c));
  btnRow.appendChild(detailsBtn);
  div.appendChild(btnRow);

  return div;
}
