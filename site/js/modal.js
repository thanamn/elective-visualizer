/**
 * Modal dialog for course details
 */

let lastFocus = null;

function openModal(course) {
  lastFocus = document.activeElement;
  if (!els.modal) return;
  els.modalTitle.textContent = course.name || '(Untitled)';

  // meta
  els.modalMeta.replaceChildren();
  const sec = course.section_no != null ? `Sec ${course.section_no}` : '';
  const courseNo = course.course_no ? `${course.course_no}` : '';
  const reg = course.reg_cu_name ? `${course.reg_cu_name}` : '';
  const parts = [courseNo, reg, sec].filter(Boolean).join(' · ');
  if (parts) els.modalMeta.appendChild(textSpan(parts));
  if (course.teacher_name) els.modalMeta.appendChild(pill(`👨‍🏫 ${course.teacher_name}`));
  if (course.class_language) els.modalMeta.appendChild(pill(langLabel(course.class_language)));

  // schedule
  els.modalSched.replaceChildren();
  (Array.isArray(course.schedule) ? course.schedule : []).forEach(s => {
    const line = `${dayLabel(s.day)} ${timeFromIsoNoTZ(s.start_time)}–${timeFromIsoNoTZ(s.end_time)}${s.semester_half ? ` · ${halfLabel(s.semester_half)}` : ''}`;
    els.modalSched.appendChild(textSpan(line));
  });
  if (!els.modalSched.children.length) els.modalSched.appendChild(textSpan('Schedule: —'));

  // chips
  els.modalChips.replaceChildren();
  if (Array.isArray(course.course_category)) course.course_category.forEach(cat => els.modalChips.appendChild(chip(cat)));
  if (Array.isArray(course.quota_type)) course.quota_type.forEach(q => els.modalChips.appendChild(chip(yearLabel(q))));
  if (course.class_location && Array.isArray(course.class_location) && course.class_location.length) els.modalChips.appendChild(chip(`Room: ${course.class_location.join(', ')}`));
  if (course.course_owner) els.modalChips.appendChild(chip(`Owner: ${course.course_owner}`));

  // stats
  els.modalStats.replaceChildren();
  const cap = document.createElement('div');
  cap.className = 'stat';
  cap.innerHTML = `👥 <strong>${course.total_enrolled || 0}</strong> / ${course.seat || 0}`;
  els.modalStats.appendChild(cap);
  if (course._count && typeof course._count.course_rankings === 'number') {
    const r = document.createElement('div');
    r.className = 'stat';
    r.innerHTML = `⭐ ${course._count.course_rankings}`;
    els.modalStats.appendChild(r);
  }

  // description (full)
  els.modalDesc.innerHTML = '';
  if (course.description && String(course.description).trim()) {
    els.modalDesc.innerHTML = sanitizeHtml(course.description);
  } else if (course.short_description && String(course.short_description).trim()) {
    els.modalDesc.textContent = String(course.short_description).trim();
  } else {
    els.modalDesc.textContent = 'No description available.';
  }

  els.modal.classList.remove('hidden');
  els.modalClose?.focus();
}

function closeModal() {
  if (!els.modal) return;
  els.modal.classList.add('hidden');
  if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
}
