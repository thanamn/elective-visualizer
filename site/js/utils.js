/**
 * Utility functions for formatting and display
 */

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function textSpan(text) {
  const s = document.createElement('span');
  s.textContent = text;
  return s;
}

function chip(text) {
  const s = document.createElement('span');
  s.className = 'chip';
  s.textContent = text;
  return s;
}

function pill(text) {
  const s = document.createElement('span');
  s.className = 'pill';
  s.textContent = text;
  return s;
}

function langLabel(x) {
  return x === 'THAI' ? 'TH' : x === 'ENGLISH' ? 'EN' : x || '';
}

function yearLabel(x) {
  return x === 'YEAR_TWO' ? 'Y2' : x === 'YEAR_THREE' ? 'Y3' : x || '';
}

function halfLabel(x) {
  if (x === 'FULL_SEMESTER') return 'Full';
  if (x === 'FIRST_HALF') return '1st Half';
  if (x === 'SECOND_HALF') return '2nd Half';
  return x || '';
}

function dayLabel(x) {
  const map = {
    MONDAY: 'Mon',
    TUESDAY: 'Tue',
    WEDNESDAY: 'Wed',
    THURSDAY: 'Thu',
    FRIDAY: 'Fri',
    SATURDAY: 'Sat',
    SUNDAY: 'Sun'
  };
  return map[x] || (x || '');
}

function timeFromIsoNoTZ(s) {
  if (!s || typeof s !== 'string') return '—';
  const d = new Date(s);
  if (isNaN(d)) return '—';
  try {
    // Render time in Thai timezone (Asia/Bangkok), 24-hour format
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: 'Asia/Bangkok'
    }).format(d);
  } catch (e) {
    // Fallback: manual UTC+7 conversion
    const h = (d.getUTCHours() + 7) % 24;
    const m = d.getUTCMinutes();
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}

function dateOrNull(s) {
  const t = Date.parse(s || '');
  return isNaN(t) ? 0 : t;
}

function valueToString(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.map(valueToString).join(', ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function valueForSort(v) {
  if (v == null) return '';
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'string') return v.toLowerCase();
  if (Array.isArray(v)) return v.length;
  if (typeof v === 'object') return JSON.stringify(v).toLowerCase();
  return String(v).toLowerCase();
}

function compare(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function sanitizeHtml(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}
