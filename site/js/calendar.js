/**
 * Calendar view with 18-week semester grid
 */

const dayMap = { MONDAY: 0, TUESDAY: 1, WEDNESDAY: 2, THURSDAY: 3, FRIDAY: 4, SATURDAY: 5, SUNDAY: 6 };
const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const sessionLabels = ['Morning\n(เช้า)', 'Afternoon\n(บ่าย)'];

// Fixed courses that always appear on calendar
const FIXED_COURSES = [
  {
    id: 'FIXED_OS_NETWORK',
    name: 'OS & Network',
    schedule: [
      // Mon morning W1-W6 (08:00 Thai = 01:00 UTC)
      { day: 'MONDAY', start_time: '1970-01-01T01:00:00.000Z', end_time: '1970-01-01T04:00:00.000Z', semester_half: 'FIRST_HALF', weeks: [1,2,3,4,5,6] },
      // Mon afternoon W1-W6 (13:00 Thai = 06:00 UTC)
      { day: 'MONDAY', start_time: '1970-01-01T06:00:00.000Z', end_time: '1970-01-01T09:00:00.000Z', semester_half: 'FIRST_HALF', weeks: [1,2,3,4,5,6] },
      // Tue afternoon W1-W6 (13:00 Thai = 06:00 UTC)
      { day: 'TUESDAY', start_time: '1970-01-01T06:00:00.000Z', end_time: '1970-01-01T09:00:00.000Z', semester_half: 'FIRST_HALF', weeks: [1,2,3,4,5,6] },
      // Wed morning & afternoon W1-W6
      { day: 'WEDNESDAY', start_time: '1970-01-01T01:00:00.000Z', end_time: '1970-01-01T04:00:00.000Z', semester_half: 'FIRST_HALF', weeks: [1,2,3,4,5,6] },
      { day: 'WEDNESDAY', start_time: '1970-01-01T06:00:00.000Z', end_time: '1970-01-01T09:00:00.000Z', semester_half: 'FIRST_HALF', weeks: [1,2,3,4,5,6] },
      // Thu morning & afternoon W1-W6
      { day: 'THURSDAY', start_time: '1970-01-01T01:00:00.000Z', end_time: '1970-01-01T04:00:00.000Z', semester_half: 'FIRST_HALF', weeks: [1,2,3,4,5,6] },
      { day: 'THURSDAY', start_time: '1970-01-01T06:00:00.000Z', end_time: '1970-01-01T09:00:00.000Z', semester_half: 'FIRST_HALF', weeks: [1,2,3,4,5,6] },
      // Fri morning W1-W6 (08:00 Thai = 01:00 UTC)
      { day: 'FRIDAY', start_time: '1970-01-01T01:00:00.000Z', end_time: '1970-01-01T04:00:00.000Z', semester_half: 'FIRST_HALF', weeks: [1,2,3,4,5,6] },
    ]
  },
  {
    id: 'FIXED_AI_ML',
    name: 'AI/ML',
    schedule: [
      // Mon morning & afternoon W7-W9
      { day: 'MONDAY', start_time: '1970-01-01T01:00:00.000Z', end_time: '1970-01-01T04:00:00.000Z', semester_half: 'FIRST_HALF', weeks: [7,8,9] },
      { day: 'MONDAY', start_time: '1970-01-01T06:00:00.000Z', end_time: '1970-01-01T09:00:00.000Z', semester_half: 'FIRST_HALF', weeks: [7,8,9] },
      // Thu morning W7-W18
      { day: 'THURSDAY', start_time: '1970-01-01T01:00:00.000Z', end_time: '1970-01-01T04:00:00.000Z', semester_half: 'FULL_SEMESTER', weeks: [7,8,9,10,11,12,13,14,15,16,17,18] },
      // Thu afternoon W7-W9
      { day: 'THURSDAY', start_time: '1970-01-01T06:00:00.000Z', end_time: '1970-01-01T09:00:00.000Z', semester_half: 'FIRST_HALF', weeks: [7,8,9] },
    ]
  },
  {
    id: 'FIXED_COMMUNICATION',
    name: 'Communication & Presentation',
    schedule: [
      // Tue morning W1-W18 (08:00 Thai = 01:00 UTC)
      { day: 'TUESDAY', start_time: '1970-01-01T01:00:00.000Z', end_time: '1970-01-01T04:00:00.000Z', semester_half: 'FULL_SEMESTER', weeks: Array.from({length:18}, (_, i) => i+1) },
    ]
  },
  {
    id: 'FIXED_FRIDAY_ACTIVITY',
    name: 'Friday Activity',
    schedule: [
      // Fri afternoon W1-W18 (13:00 Thai = 06:00 UTC)
      { day: 'FRIDAY', start_time: '1970-01-01T06:00:00.000Z', end_time: '1970-01-01T09:00:00.000Z', semester_half: 'FULL_SEMESTER', weeks: Array.from({length:18}, (_, i) => i+1) },
    ]
  },
];

function getWeekStartDate(weekNum) {
  const jan5 = new Date(2025, 0, 5);
  const weekStart = new Date(jan5);
  weekStart.setDate(jan5.getDate() + (weekNum - 1) * 7);
  return weekStart;
}

function formatWeekHeader(weekNum) {
  return `W${weekNum}`;
}

function showCalendarView() {
  els.content.classList.add('hidden');
  els.calendarSection?.classList.remove('hidden');
  renderCalendarView();
}

function hideCalendarView() {
  els.calendarSection?.classList.add('hidden');
  els.content.classList.remove('hidden');
  
  // Reset toggle buttons
  const viewListBtn = document.getElementById('viewList');
  const viewCalendarBtn = document.getElementById('viewCalendar');
  if (viewListBtn) viewListBtn.classList.add('active');
  if (viewCalendarBtn) viewCalendarBtn.classList.remove('active');
}

function renderCalendarView() {
  if (!els.calendarGrid) return;
  els.calendarGrid.replaceChildren();

  // Attach filter listeners to calendar view
  if (els.sortSelect) els.sortSelect.addEventListener('change', () => { state.filters.sort = els.sortSelect.value; renderCalendarView(); });
  if (els.daySelect) els.daySelect.addEventListener('change', () => { state.filters.day = els.daySelect.value; renderCalendarView(); });
  if (els.langSelect) els.langSelect.addEventListener('change', () => { state.filters.lang = els.langSelect.value; renderCalendarView(); });
  if (els.halfSelect) els.halfSelect.addEventListener('change', () => { state.filters.half = els.halfSelect.value; renderCalendarView(); });
  if (els.yearSelect) els.yearSelect.addEventListener('change', () => { state.filters.year = els.yearSelect.value; renderCalendarView(); });
  if (els.categorySelect) els.categorySelect.addEventListener('change', () => { state.filters.category = els.categorySelect.value; renderCalendarView(); });

  // course selector
  const selectorDiv = document.createElement('div');
  selectorDiv.className = 'course-selector';
  
  // Get filtered courses based on current filter state
  let filteredCourses = state.courses;
  
  // Apply filters
  if (state.filters.day) {
    filteredCourses = filteredCourses.filter(c => {
      if (!c.schedule) return false;
      return c.schedule.some(s => s.day === state.filters.day);
    });
  }
  
  if (state.filters.lang) {
    filteredCourses = filteredCourses.filter(c => c.class_language === state.filters.lang);
  }
  
  if (state.filters.half) {
    filteredCourses = filteredCourses.filter(c => {
      if (!c.schedule) return false;
      return c.schedule.some(s => s.semester_half === state.filters.half);
    });
  }

  if (state.filters.year) {
    filteredCourses = filteredCourses.filter(c => Array.isArray(c.quota_type) && c.quota_type.includes(state.filters.year));
  }

  if (state.filters.category) {
    filteredCourses = filteredCourses.filter(c => Array.isArray(c.course_category) && c.course_category.includes(state.filters.category));
  }
  
  // Sort
  const sortBy = state.filters.sort || 'name';
  filteredCourses.sort((a, b) => {
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'enrolled') return (b.total_enrolled || 0) - (a.total_enrolled || 0);
    if (sortBy === 'seat') return (b.seat || 0) - (a.seat || 0);
    if (sortBy === 'date') return (a.id || '').localeCompare(b.id || '');
    return 0;
  });
  
  for (const c of filteredCourses) {
    const item = document.createElement('div');
    item.className = 'course-selector-item';
    item.style.cursor = 'pointer';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `cal-check-${c.id}`;
    checkbox.checked = calendarState.selectedCourses.has(c.id);
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      if (e.target.checked) calendarState.selectedCourses.add(c.id);
      else calendarState.selectedCourses.delete(c.id);
      renderCalendar();
    });

    const labelWrapper = document.createElement('div');
    labelWrapper.style.flex = '1';
    labelWrapper.style.cursor = 'pointer';
    
    const label = document.createElement('label');
    label.htmlFor = `cal-check-${c.id}`;
    label.textContent = c.name || '(Untitled)';
    label.style.cursor = 'pointer';
    label.style.display = 'block';
    
    const ownerSpan = document.createElement('span');
    ownerSpan.style.fontSize = '11px';
    ownerSpan.style.color = 'var(--muted)';
    ownerSpan.style.display = 'block';
    ownerSpan.style.marginTop = '2px';
    ownerSpan.textContent = c.course_owner ? `by ${c.course_owner}` : '';
    
    labelWrapper.appendChild(label);
    labelWrapper.appendChild(ownerSpan);

    // Info button
    const infoBtn = document.createElement('button');
    infoBtn.className = 'course-info-btn';
    infoBtn.textContent = '';
    infoBtn.title = 'View details';
    infoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(c);
    });

    // Make entire card clickable
    item.addEventListener('click', () => {
      checkbox.checked = !checkbox.checked;
      if (checkbox.checked) calendarState.selectedCourses.add(c.id);
      else calendarState.selectedCourses.delete(c.id);
      renderCalendar();
    });

    item.appendChild(checkbox);
    item.appendChild(labelWrapper);
    item.appendChild(infoBtn);
    selectorDiv.appendChild(item);
  }
  els.calendarGrid.appendChild(selectorDiv);

  // Render calendar at bottom
  renderCalendar();
}

function renderCalendar() {
  if (!els.calendarGrid) return;
  const existing = els.calendarGrid.querySelector('table');
  if (existing) existing.remove();

  calendarState.mergedCells.clear();
  const selected = state.courses.filter(c => calendarState.selectedCourses.has(c.id));

  const TOTAL_WEEKS = 18;
  const TOTAL_DAYS = 6; 
  const SESSIONS = 2;
  const TOTAL_ROWS = TOTAL_DAYS * SESSIONS;

  // 1. Initialize a flat grid for easy scanning [row][week]
  const grid = Array.from({ length: TOTAL_ROWS }, () => Array(TOTAL_WEEKS).fill(null));

  // 2. Helper to fill the grid with both Fixed and Selected courses
  const allCourses = [...FIXED_COURSES, ...selected];
  allCourses.forEach(course => {
    if (!Array.isArray(course.schedule)) return;
    course.schedule.forEach(sched => {
      const d = dayMap[sched.day];
      if (d === undefined || d >= TOTAL_DAYS) return;
      
      // Times are in UTC, convert to Thai time (UTC+7) to determine session
      const startHour = sched.start_time ? parseInt(sched.start_time.slice(11, 13)) : 0;
      const thaiHour = (startHour + 7) % 24;
      const s = thaiHour >= 12 ? 1 : 0; // 12+ = afternoon, else morning
      const r = (d * SESSIONS) + s;

      let weeks = sched.weeks || [];
      if (!weeks.length) {
        if (sched.semester_half === 'FULL_SEMESTER') weeks = Array.from({length:18}, (_, i) => i+1);
        else if (sched.semester_half === 'FIRST_HALF') weeks = Array.from({length:9}, (_, i) => i+1);
        else if (sched.semester_half === 'SECOND_HALF') weeks = Array.from({length:9}, (_, i) => i+10);
      }

      weeks.forEach(w => {
        if (grid[r] && w <= TOTAL_WEEKS) {
          if (!grid[r][w-1]) grid[r][w-1] = [];
          grid[r][w-1].push({ course, sched });
        }
      });
    });
  });

  const table = document.createElement('table');
  table.className = 'cal-table';

  // Render Headers
  const headerRow = document.createElement('tr');
  const corner = document.createElement('th');
  corner.className = 'cal-week-header';
  corner.colSpan = 2;
  corner.textContent = 'Day / Session';
  headerRow.appendChild(corner);
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const th = document.createElement('th');
    th.className = 'cal-week-header';
    th.textContent = `W${w}`;
    headerRow.appendChild(th);
  }
  table.appendChild(headerRow);

  // 3. Render Body using Rectangle Detection
  const processed = new Set(); // Tracks "row,col"

  for (let r = 0; r < TOTAL_ROWS; r++) {
    const tr = document.createElement('tr');
    const d = Math.floor(r / SESSIONS);
    const s = r % SESSIONS;

    if (s === 0) {
      const dayLabel = document.createElement('td');
      dayLabel.className = 'cal-day-header';
      dayLabel.rowSpan = SESSIONS;
      dayLabel.textContent = dayLabels[d];
      tr.appendChild(dayLabel);
    }

    const sessLabel = document.createElement('td');
    sessLabel.className = 'cal-session-label';
    sessLabel.textContent = sessionLabels[s];
    tr.appendChild(sessLabel);

    for (let w = 0; w < TOTAL_WEEKS; w++) {
      if (processed.has(`${r},${w}`)) continue;

      const cell = document.createElement('td');
      cell.className = 'cal-cell';
      cell.classList.add(w < 9 ? 'first-half' : 'second-half');

      const entries = grid[r][w];
      if (entries && entries.length > 0) {
        const hasConflict = entries.length > 1;
        
        // Helper to check if two entry arrays have the same course IDs
        const sameEntries = (arr1, arr2) => {
          if (!arr1 || !arr2 || arr1.length !== arr2.length) return false;
          const ids1 = arr1.map(e => e.course.id).sort();
          const ids2 = arr2.map(e => e.course.id).sort();
          return ids1.every((id, i) => id === ids2[i]);
        };
        
        // If there's a conflict, try to merge cells with the same conflict pattern
        if (hasConflict) {
          cell.classList.add('has-conflict');
          
          // Detect max horizontal width (colSpan) for same conflict
          let colSpan = 0;
          while (w + colSpan < TOTAL_WEEKS && sameEntries(grid[r][w + colSpan], entries)) {
            colSpan++;
          }

          // Detect max vertical height (rowSpan) for same conflict
          let rowSpan = 0;
          while (r + rowSpan < TOTAL_ROWS) {
            let rowMatch = true;
            for (let checkW = w; checkW < w + colSpan; checkW++) {
              if (!sameEntries(grid[r + rowSpan][checkW], entries)) {
                rowMatch = false;
                break;
              }
            }
            if (rowMatch) rowSpan++;
            else break;
          }

          if (colSpan > 1) cell.colSpan = colSpan;
          if (rowSpan > 1) cell.rowSpan = rowSpan;

          // Mark all these cells as processed
          for (let sr = 0; sr < rowSpan; sr++) {
            for (let sw = 0; sw < colSpan; sw++) {
              processed.add(`${r + sr},${w + sw}`);
            }
          }
          
          // Create a wrapper for stacked courses
          const wrapper = document.createElement('div');
          wrapper.className = 'conflict-wrapper';
          
          // Show all conflicting courses
          entries.forEach((entry, index) => {
            const courseEl = document.createElement('div');
            courseEl.className = 'cal-course conflict';
            
            // Add special styling for conflicting fixed courses
            if (entry.course.id === 'FIXED_OS_NETWORK') {
              courseEl.classList.add('fixed-conflict');
            } else if (entry.course.id === 'FIXED_AI_ML') {
              courseEl.classList.add('fixed-conflict-blue');
            }
            
            courseEl.textContent = entry.course.name;
            courseEl.title = `⚠️ CONFLICT with ${entries.length - 1} other course(s)`;
            wrapper.appendChild(courseEl);
            
            // Add separator except for last item
            if (index < entries.length - 1) {
              const sep = document.createElement('div');
              sep.className = 'conflict-separator';
              wrapper.appendChild(sep);
            }
          });
          
          cell.appendChild(wrapper);
        } else {
          // No conflict - normal merge logic
          const targetId = entries[0].course.id;

          // Detect max horizontal width (colSpan)
          let colSpan = 0;
          while (w + colSpan < TOTAL_WEEKS && 
                 grid[r][w + colSpan]?.length === 1 &&
                 grid[r][w + colSpan][0].course.id === targetId) {
            colSpan++;
          }

          // Detect max vertical height (rowSpan)
          let rowSpan = 0;
          while (r + rowSpan < TOTAL_ROWS) {
            let rowMatch = true;
            for (let checkW = w; checkW < w + colSpan; checkW++) {
              const checkEntries = grid[r + rowSpan][checkW];
              if (!checkEntries || checkEntries.length !== 1 || checkEntries[0].course.id !== targetId) {
                rowMatch = false;
                break;
              }
            }
            if (rowMatch) rowSpan++;
            else break;
          }

          if (colSpan > 1) cell.colSpan = colSpan;
          if (rowSpan > 1) cell.rowSpan = rowSpan;

          // Mark all these cells as processed
          for (let sr = 0; sr < rowSpan; sr++) {
            for (let sw = 0; sw < colSpan; sw++) {
              processed.add(`${r + sr},${w + sw}`);
            }
          }

          // Build UI element
          const entry = entries[0];
          const courseEl = document.createElement('div');
          courseEl.className = 'cal-course';
          if (entry.course.id.startsWith('FIXED_')) {
            courseEl.classList.add('fixed');
            if (['FIXED_COMMUNICATION', 'FIXED_FRIDAY_ACTIVITY'].includes(entry.course.id)) {
              courseEl.classList.add('fixed-grey');
            } else if (entry.course.id === 'FIXED_OS_NETWORK') {
              courseEl.classList.add('fixed-orange');
            } else if (entry.course.id === 'FIXED_AI_ML') {
              courseEl.classList.add('fixed-blue');
            }
          } else {
            courseEl.classList.add(w < 9 ? 'first-half' : 'second-half');
          }
          courseEl.textContent = entry.course.name;
          cell.appendChild(courseEl);
        }
      } else {
        processed.add(`${r},${w}`);
      }
      tr.appendChild(cell);
    }
    table.appendChild(tr);
  }
  els.calendarGrid.appendChild(table);

  // update info
  if (els.calendarInfo) {
    els.calendarInfo.textContent = `Selected: ${selected.length} course(s) | Weeks 1–9: 1st Half | Weeks 10–18: 2nd Half`;
  }
}

// expose for external use
window.showCalendarView = showCalendarView;
window.calendarState = calendarState;
