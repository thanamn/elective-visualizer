"use strict";

const STORAGE_KEY = "cedt-elective-plan-v2";
const TOTAL_WEEKS = 18;
const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DAY_LABELS = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};
const DAY_SHORT = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

const FIXED_COURSES = [
  {
    id: "FIXED_OS_NETWORK",
    name: "OS & Network",
    schedule: [
      fixedSchedule("MONDAY", "01:00", "04:00", [1, 2, 3, 4, 5, 6]),
      fixedSchedule("MONDAY", "06:00", "09:00", [1, 2, 3, 4, 5, 6]),
      fixedSchedule("TUESDAY", "06:00", "09:00", [1, 2, 3, 4, 5, 6]),
      fixedSchedule("WEDNESDAY", "01:00", "04:00", [1, 2, 3, 4, 5, 6]),
      fixedSchedule("WEDNESDAY", "06:00", "09:00", [1, 2, 3, 4, 5, 6]),
      fixedSchedule("THURSDAY", "01:00", "04:00", [1, 2, 3, 4, 5, 6]),
      fixedSchedule("THURSDAY", "06:00", "09:00", [1, 2, 3, 4, 5, 6]),
      fixedSchedule("FRIDAY", "01:00", "04:00", [1, 2, 3, 4, 5, 6]),
    ],
  },
  {
    id: "FIXED_AI_ML",
    name: "AI/ML",
    schedule: [
      fixedSchedule("MONDAY", "01:00", "04:00", [7, 8, 9]),
      fixedSchedule("MONDAY", "06:00", "09:00", [7, 8, 9]),
      fixedSchedule("THURSDAY", "01:00", "04:00", [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]),
      fixedSchedule("THURSDAY", "06:00", "09:00", [7, 8, 9]),
    ],
  },
  {
    id: "FIXED_COMMUNICATION",
    name: "Communication",
    schedule: [
      fixedSchedule("TUESDAY", "01:00", "04:00", range(1, 18)),
    ],
  },
  {
    id: "FIXED_FRIDAY_ACTIVITY",
    name: "Friday Activity",
    schedule: [
      fixedSchedule("FRIDAY", "06:00", "09:00", range(1, 18)),
    ],
  },
];

const state = {
  courses: [],
  filteredCourses: [],
  selectedIds: restorePlan(),
  filters: {
    search: "",
    day: "",
    half: "",
    year: "",
    language: "",
    category: "",
    sort: "recommended",
  },
  currentView: "explore",
  dataTimestamp: null,
  toastTimer: null,
};

const ui = {
  dataStatus: document.getElementById("dataStatus"),
  reloadButton: document.getElementById("reloadButton"),
  courseStat: document.getElementById("courseStat"),
  categoryStat: document.getElementById("categoryStat"),
  planStat: document.getElementById("planStat"),
  updatedAt: document.getElementById("updatedAt"),
  exploreTab: document.getElementById("exploreTab"),
  planTab: document.getElementById("planTab"),
  planCountBadge: document.getElementById("planCountBadge"),
  exploreView: document.getElementById("exploreView"),
  planView: document.getElementById("planView"),
  searchInput: document.getElementById("searchInput"),
  daySelect: document.getElementById("daySelect"),
  halfSelect: document.getElementById("halfSelect"),
  yearSelect: document.getElementById("yearSelect"),
  languageSelect: document.getElementById("languageSelect"),
  categorySelect: document.getElementById("categorySelect"),
  sortSelect: document.getElementById("sortSelect"),
  resetFilters: document.getElementById("resetFilters"),
  emptyResetButton: document.getElementById("emptyResetButton"),
  resultsTitle: document.getElementById("resultsTitle"),
  resultsCount: document.getElementById("resultsCount"),
  courseGrid: document.getElementById("courseGrid"),
  emptyState: document.getElementById("emptyState"),
  planPreviewCount: document.getElementById("planPreviewCount"),
  planPlaceholder: document.getElementById("planPlaceholder"),
  miniPlanList: document.getElementById("miniPlanList"),
  planPreviewStatus: document.getElementById("planPreviewStatus"),
  openPlanButton: document.getElementById("openPlanButton"),
  backToCoursesButton: document.getElementById("backToCoursesButton"),
  clearPlanButton: document.getElementById("clearPlanButton"),
  selectedSummary: document.getElementById("selectedSummary"),
  conflictSummary: document.getElementById("conflictSummary"),
  termSummary: document.getElementById("termSummary"),
  selectionStrip: document.getElementById("selectionStrip"),
  timetableNotice: document.getElementById("timetableNotice"),
  timetableGrid: document.getElementById("timetableGrid"),
  mobilePlanBar: document.getElementById("mobilePlanBar"),
  mobilePlanCount: document.getElementById("mobilePlanCount"),
  mobilePlanStatus: document.getElementById("mobilePlanStatus"),
  mobileOpenPlanButton: document.getElementById("mobileOpenPlanButton"),
  courseDialog: document.getElementById("courseDialog"),
  dialogCloseButton: document.getElementById("dialogCloseButton"),
  dialogContent: document.getElementById("dialogContent"),
  toast: document.getElementById("toast"),
};

bindEvents();
loadData();

function fixedSchedule(day, start, end, weeks) {
  return {
    day,
    start_time: `1970-01-01T${start}:00.000Z`,
    end_time: `1970-01-01T${end}:00.000Z`,
    weeks,
  };
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function bindEvents() {
  ui.reloadButton.addEventListener("click", loadData);
  ui.searchInput.addEventListener("input", () => {
    state.filters.search = ui.searchInput.value.trim();
    applyFilters();
  });
  ui.daySelect.addEventListener("change", () => updateFilter("day", ui.daySelect.value));
  ui.halfSelect.addEventListener("change", () => updateFilter("half", ui.halfSelect.value));
  ui.yearSelect.addEventListener("change", () => updateFilter("year", ui.yearSelect.value));
  ui.languageSelect.addEventListener("change", () => updateFilter("language", ui.languageSelect.value));
  ui.categorySelect.addEventListener("change", () => updateFilter("category", ui.categorySelect.value));
  ui.sortSelect.addEventListener("change", () => updateFilter("sort", ui.sortSelect.value));
  ui.resetFilters.addEventListener("click", resetFilters);
  ui.emptyResetButton.addEventListener("click", resetFilters);

  ui.exploreTab.addEventListener("click", () => setView("explore"));
  ui.planTab.addEventListener("click", () => setView("plan"));
  ui.openPlanButton.addEventListener("click", () => setView("plan", true));
  ui.mobileOpenPlanButton.addEventListener("click", () => setView("plan", true));
  ui.backToCoursesButton.addEventListener("click", () => setView("explore", true));
  ui.clearPlanButton.addEventListener("click", clearPlan);

  ui.dialogCloseButton.addEventListener("click", () => ui.courseDialog.close());
  ui.courseDialog.addEventListener("click", (event) => {
    if (event.target !== ui.courseDialog) return;
    const rect = ui.courseDialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left
      && event.clientX <= rect.right
      && event.clientY >= rect.top
      && event.clientY <= rect.bottom;
    if (!inside) ui.courseDialog.close();
  });

  window.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target instanceof HTMLSelectElement;

    if (event.key === "/" && !isTyping && !ui.courseDialog.open) {
      event.preventDefault();
      ui.searchInput.focus();
    }

    if (event.key === "Escape" && document.activeElement === ui.searchInput && ui.searchInput.value) {
      ui.searchInput.value = "";
      state.filters.search = "";
      applyFilters();
    }
  });
}

function updateFilter(key, value) {
  state.filters[key] = value;
  applyFilters();
}

async function loadData() {
  setLoadingState();
  const candidates = dataCandidates();
  let lastError = new Error("No data source was available.");

  for (const url of candidates) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const data = await response.json();
      if (!data || !Array.isArray(data.courses)) throw new Error("The file does not contain a course list.");

      state.courses = data.courses.slice();
      state.dataTimestamp = data.data_gathered_at || null;
      pruneSavedPlan();
      populateCategories();
      updateDataSummary();
      applyFilters();
      ui.dataStatus.className = "data-status is-ready";
      ui.dataStatus.lastChild.textContent = "Latest data ready";
      return;
    } catch (error) {
      lastError = error;
    }
  }

  showLoadError(lastError);
}

function setLoadingState() {
  ui.reloadButton.disabled = true;
  ui.dataStatus.className = "data-status";
  ui.dataStatus.lastChild.textContent = "Loading course data";
  ui.courseGrid.setAttribute("aria-busy", "true");
}

function dataCandidates() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("data");
  const urls = [];

  if (requested && (/^https?:\/\//i.test(requested) || !requested.includes("://"))) {
    urls.push(requested);
  }

  urls.push(
    "./elective_latest.json",
    "../elective_latest.json",
    "https://raw.githubusercontent.com/thanamn/elective-visualizer/main/elective_latest.json",
  );

  return [...new Set(urls)];
}

function showLoadError(error) {
  ui.reloadButton.disabled = false;
  ui.dataStatus.className = "data-status is-error";
  ui.dataStatus.lastChild.textContent = "Course data unavailable";
  ui.resultsCount.textContent = "Could not load courses";
  ui.courseGrid.setAttribute("aria-busy", "false");

  const panel = element("div", "empty-state");
  const mark = element("span", "empty-mark", "!");
  mark.setAttribute("aria-hidden", "true");
  const title = element("h3", "", "The course snapshot could not be loaded.");
  const copy = element("p", "", error?.message || "Please try again.");
  const retry = element("button", "primary-button", "Try again");
  retry.type = "button";
  retry.addEventListener("click", loadData);
  panel.append(mark, title, copy, retry);
  ui.courseGrid.replaceChildren(panel);
}

function populateCategories() {
  const categories = uniqueCategories();
  ui.categorySelect.replaceChildren(new Option("All areas", ""));
  categories.forEach((category) => ui.categorySelect.add(new Option(category, category)));
}

function uniqueCategories() {
  return [...new Set(
    state.courses.flatMap((course) => Array.isArray(course.course_category) ? course.course_category : [])
      .map((category) => String(category || "").trim())
      .filter((category) => category && category !== "-"),
  )].sort((a, b) => a.localeCompare(b));
}

function updateDataSummary() {
  ui.reloadButton.disabled = false;
  ui.courseStat.textContent = String(state.courses.length);
  ui.categoryStat.textContent = String(uniqueCategories().length);

  if (!state.dataTimestamp) {
    ui.updatedAt.textContent = "Latest available course snapshot";
    return;
  }

  const timestamp = parseDataTimestamp(state.dataTimestamp);
  if (!timestamp) {
    ui.updatedAt.textContent = `Snapshot: ${state.dataTimestamp}`;
    return;
  }

  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(timestamp);
  ui.updatedAt.textContent = `Data snapshot · ${formatted}`;
}

function parseDataTimestamp(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function applyFilters() {
  const query = normalizeText(state.filters.search);
  const { day, half, year, language, category, sort } = state.filters;

  let courses = state.courses.filter((course) => {
    if (query && !courseSearchText(course).includes(query)) return false;
    if (year && !(course.quota_type || []).includes(year)) return false;
    if (language && course.class_language !== language) return false;
    if (category && !(course.course_category || []).includes(category)) return false;

    const schedule = Array.isArray(course.schedule) ? course.schedule : [];
    if (day && !schedule.some((item) => item.day === day)) return false;
    if (half && !schedule.some((item) => item.semester_half === half)) return false;
    return true;
  });

  courses.sort(courseSorter(sort));
  state.filteredCourses = courses;
  renderCourses();
  updateFilterSummary();
}

function courseSearchText(course) {
  return normalizeText([
    course.name,
    course.reg_cu_name,
    course.course_no,
    course.teacher_name,
    course.course_owner,
    course.short_description,
    stripHtml(course.description),
    ...(course.course_category || []),
  ].filter(Boolean).join(" "));
}

function normalizeText(value) {
  return String(value || "").toLocaleLowerCase().normalize("NFKC");
}

function courseSorter(sort) {
  return (a, b) => {
    if (sort === "interest") return interestCount(b) - interestCount(a) || cleanCourseName(a).localeCompare(cleanCourseName(b));
    if (sort === "availability") return availableSeats(b) - availableSeats(a) || interestCount(b) - interestCount(a);
    if (sort === "name") return cleanCourseName(a).localeCompare(cleanCourseName(b));
    return recommendationScore(b) - recommendationScore(a) || cleanCourseName(a).localeCompare(cleanCourseName(b));
  };
}

function recommendationScore(course) {
  const interest = interestCount(course);
  const seats = positiveNumber(course.seat);
  const overCapacityPenalty = Math.max(0, interest - seats) * 0.72;
  const scheduleBonus = validSchedules(course).length ? 8 : 0;
  const descriptionBonus = descriptionText(course).length > 40 ? 5 : 0;
  return interest - overCapacityPenalty + scheduleBonus + descriptionBonus;
}

function updateFilterSummary() {
  const count = state.filteredCourses.length;
  const total = state.courses.length;
  const hasFilters = Boolean(
    state.filters.search
    || state.filters.day
    || state.filters.half
    || state.filters.year
    || state.filters.language
    || state.filters.category
    || state.filters.sort !== "recommended",
  );

  ui.resultsCount.textContent = `${count} of ${total} courses`;
  ui.resultsTitle.textContent = state.filters.search
    ? `Results for “${state.filters.search}”`
    : hasFilters
      ? "Matching electives"
      : "All electives";
  ui.resetFilters.hidden = !hasFilters;
  ui.emptyState.hidden = count !== 0;
  ui.courseGrid.hidden = count === 0;
}

function resetFilters() {
  state.filters = {
    search: "",
    day: "",
    half: "",
    year: "",
    language: "",
    category: "",
    sort: "recommended",
  };
  ui.searchInput.value = "";
  ui.daySelect.value = "";
  ui.halfSelect.value = "";
  ui.yearSelect.value = "";
  ui.languageSelect.value = "";
  ui.categorySelect.value = "";
  ui.sortSelect.value = "recommended";
  applyFilters();
  ui.searchInput.focus();
}

function renderCourses() {
  const fragment = document.createDocumentFragment();
  state.filteredCourses.forEach((course) => fragment.append(createCourseCard(course)));
  ui.courseGrid.replaceChildren(fragment);
  ui.courseGrid.setAttribute("aria-busy", "false");
}

function createCourseCard(course) {
  const card = element("article", "course-card");
  card.style.setProperty("--card-accent", categoryColor((course.course_category || [])[0]));
  if (state.selectedIds.has(course.id)) card.classList.add("is-selected");

  const topLine = element("div", "card-topline");
  const codeParts = [
    course.course_no || course.reg_cu_name || "CEDT elective",
    course.section_no != null ? `Sec ${course.section_no}` : "",
  ].filter(Boolean);
  topLine.append(
    element("span", "course-code", codeParts.join(" · ")),
    createDemandTag(course),
  );

  const title = element("h3", "", cleanCourseName(course));
  const owner = element("p", "course-owner", ownerLine(course));
  const schedules = createScheduleList(course);
  const tags = createCourseTags(course);
  const interest = createInterestBlock(course);

  const actions = element("div", "card-actions");
  const detailsButton = element("button", "secondary-button", "Details");
  detailsButton.type = "button";
  detailsButton.setAttribute("aria-label", `View details for ${cleanCourseName(course)}`);
  detailsButton.addEventListener("click", () => openCourseDialog(course));

  const isSelected = state.selectedIds.has(course.id);
  const planButton = element("button", `primary-button plan-toggle${isSelected ? " is-added" : ""}`);
  planButton.type = "button";
  planButton.setAttribute("aria-pressed", String(isSelected));
  planButton.setAttribute("aria-label", `${isSelected ? "Remove" : "Add"} ${cleanCourseName(course)} ${isSelected ? "from" : "to"} your plan`);
  planButton.textContent = isSelected ? "✓ In my plan" : "+ Add to plan";
  planButton.addEventListener("click", () => toggleSelection(course.id));
  actions.append(detailsButton, planButton);

  card.append(topLine, title, owner, schedules, tags, interest, actions);
  return card;
}

function createDemandTag(course) {
  const { label, level } = demandStatus(course);
  return element("span", `demand-tag${level ? ` ${level}` : ""}`, label);
}

function demandStatus(course) {
  const seats = positiveNumber(course.seat);
  const interest = interestCount(course);
  if (!seats) return { label: "No seat data", level: "" };
  const ratio = interest / seats;
  if (ratio > 1) return { label: "High demand", level: "is-high" };
  if (ratio >= 0.72) return { label: "Competitive", level: "is-tight" };
  return { label: "Room to rank", level: "" };
}

function createScheduleList(course) {
  const list = element("ul", "schedule-list");
  const schedules = validSchedules(course);

  if (!schedules.length) {
    const item = element("li", "schedule-item");
    item.append(
      element("span", "schedule-day", "TBD"),
      element("span", "", "Schedule to be confirmed"),
    );
    list.append(item);
    return list;
  }

  schedules.slice(0, 3).forEach((schedule) => {
    const item = element("li", "schedule-item");
    item.append(
      element("span", "schedule-day", DAY_SHORT[schedule.day] || "TBD"),
      element("span", "", `${formatScheduleTime(schedule)} · ${halfLabel(schedule.semester_half)}`),
    );
    list.append(item);
  });

  if (schedules.length > 3) {
    list.append(element("li", "schedule-item", `+ ${schedules.length - 3} more time blocks`));
  }
  return list;
}

function createCourseTags(course) {
  const container = element("div", "course-tags");
  const values = [
    ...(course.course_category || []).filter((value) => value && value !== "-").slice(0, 2),
    ...(course.quota_type || []).map(yearLabel),
    course.class_language === "ENGLISH" ? "English" : "",
  ].filter(Boolean);
  values.forEach((value) => container.append(element("span", "course-tag", value)));
  return container;
}

function createInterestBlock(course) {
  const interest = interestCount(course);
  const seats = positiveNumber(course.seat);
  const ratio = seats ? interest / seats : 0;
  const level = ratio > 1 ? "is-high" : ratio >= 0.72 ? "is-tight" : "";
  const block = element("div", "interest-block");
  const copy = element("div", "interest-copy");
  copy.append(
    element("strong", "", `${interest} ranked`),
    element("span", "", seats ? `${seats} seats` : "Seats not listed"),
  );

  const track = element("div", "interest-track");
  track.setAttribute("aria-label", seats ? `${interest} rankings for ${seats} seats` : `${interest} rankings`);
  const fill = element("div", `interest-fill${level ? ` ${level}` : ""}`);
  fill.style.width = `${Math.min(100, ratio * 100)}%`;
  track.append(fill);
  block.append(copy, track);
  return block;
}

function interestCount(course) {
  const rankings = course?._count?.course_rankings;
  return positiveNumber(Number.isFinite(rankings) ? rankings : course.total_enrolled);
}

function availableSeats(course) {
  return positiveNumber(course.seat) - interestCount(course);
}

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function ownerLine(course) {
  const teacher = String(course.teacher_name || "").trim();
  const owner = String(course.course_owner || "").trim();
  const usefulTeacher = teacher && teacher !== "-" ? teacher : "";
  const usefulOwner = owner && owner !== "ไม่ระบุ" ? owner : "";
  if (usefulTeacher && usefulOwner) return `${usefulTeacher} · ${usefulOwner}`;
  return usefulTeacher || usefulOwner || "Instructor to be announced";
}

function categoryColor(category) {
  const map = {
    "Research Concept / Math": "#d9d4f7",
    "Software": "#bde6d1",
    "Cloud/system": "#b9dded",
    "Computer Graphics/UX": "#f2c8d7",
    "Startup": "#f2dd83",
    "Project Management": "#f2dd83",
    "Fintech": "#bed8f2",
    "Games": "#efc8a8",
    "IT Security": "#f3b6ad",
    "Data science / AI": "#c9d1f5",
    "Robotics": "#b9dfdf",
    "ESG": "#cfe3b7",
  };
  return map[category] || "#d9d4f7";
}

function cleanCourseName(course) {
  const raw = String(course?.name || course?.reg_cu_name || course?.course_no || "Untitled elective");
  const withoutEmoji = raw
    .replace(/\p{Extended_Pictographic}/gu, " ")
    .replace(/[\u200D\uFE0F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return withoutEmoji || raw.trim();
}

function validSchedules(course) {
  return (Array.isArray(course.schedule) ? course.schedule : []).filter(isValidSchedule);
}

function isValidSchedule(schedule) {
  if (!schedule || !DAYS.includes(schedule.day)) return false;
  const start = new Date(schedule.start_time);
  const end = new Date(schedule.end_time);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  let durationMinutes = (end.getTime() - start.getTime()) / 60000;
  if (durationMinutes < 0) durationMinutes += 24 * 60;
  return durationMinutes >= 30 && durationMinutes <= 12 * 60;
}

function formatScheduleTime(schedule) {
  return `${formatTime(schedule.start_time)}–${formatTime(schedule.end_time)}`;
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function halfLabel(value) {
  if (value === "FIRST_HALF") return "First half";
  if (value === "SECOND_HALF") return "Second half";
  if (value === "FULL_SEMESTER") return "Full semester";
  return "Schedule";
}

function yearLabel(value) {
  if (value === "YEAR_TWO") return "Year 2";
  if (value === "YEAR_THREE") return "Year 3";
  return value || "";
}

function toggleSelection(courseId) {
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) return;

  const wasSelected = state.selectedIds.has(courseId);
  if (wasSelected) state.selectedIds.delete(courseId);
  else state.selectedIds.add(courseId);

  persistPlan();
  applyFilters();
  updatePlanUI();

  showToast(wasSelected
    ? `${cleanCourseName(course)} removed from your plan.`
    : `${cleanCourseName(course)} added to your plan.`);

  if (ui.courseDialog.open) renderDialogContent(course);
}

function clearPlan() {
  const count = state.selectedIds.size;
  if (!count) return;
  state.selectedIds.clear();
  persistPlan();
  applyFilters();
  updatePlanUI();
  showToast(`${count} ${pluralize(count, "course")} removed from your plan.`);
}

function selectedCourses() {
  return state.courses.filter((course) => state.selectedIds.has(course.id));
}

function persistPlan() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.selectedIds]));
  } catch {
    // Browsing storage can be unavailable; the in-memory plan still works.
  }
}

function restorePlan() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

function pruneSavedPlan() {
  const availableIds = new Set(state.courses.map((course) => course.id));
  state.selectedIds = new Set([...state.selectedIds].filter((id) => availableIds.has(id)));
  persistPlan();
  updatePlanUI();
}

function updatePlanUI() {
  const selected = selectedCourses();
  const analysis = analyzePlan(selected);
  const count = selected.length;
  const conflictCount = analysis.conflictPairs.size;

  ui.planStat.textContent = String(count);
  ui.planCountBadge.textContent = String(count);
  ui.planCountBadge.setAttribute("aria-label", `${count} selected ${pluralize(count, "course")}`);
  ui.planPreviewCount.textContent = String(count);
  ui.openPlanButton.disabled = count === 0;
  ui.clearPlanButton.disabled = count === 0;
  ui.planPlaceholder.hidden = count !== 0;
  ui.mobilePlanBar.hidden = count === 0 || state.currentView === "plan";
  ui.mobilePlanCount.textContent = `${count} ${pluralize(count, "course")}`;
  ui.mobilePlanStatus.textContent = conflictCount ? `${conflictCount} ${pluralize(conflictCount, "conflict")} found` : "No conflicts";

  ui.planPreviewStatus.textContent = conflictCount
    ? `${conflictCount} possible ${pluralize(conflictCount, "conflict")}—check the timetable.`
    : "No timetable conflicts.";
  ui.planPreviewStatus.classList.toggle("has-conflict", conflictCount > 0);

  renderMiniPlan(selected);
  renderPlanView(selected, analysis);
}

function renderMiniPlan(selected) {
  const fragment = document.createDocumentFragment();
  selected.forEach((course, index) => {
    const item = element("li", "mini-plan-item");
    const number = element("span", "mini-plan-index", String(index + 1).padStart(2, "0"));
    const copy = element("div", "mini-plan-copy");
    copy.append(
      element("strong", "", cleanCourseName(course)),
      element("span", "", conciseSchedule(course)),
    );
    const remove = element("button", "mini-plan-remove", "×");
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${cleanCourseName(course)} from your plan`);
    remove.addEventListener("click", () => toggleSelection(course.id));
    item.append(number, copy, remove);
    fragment.append(item);
  });
  ui.miniPlanList.replaceChildren(fragment);
}

function conciseSchedule(course) {
  const schedule = validSchedules(course);
  if (!schedule.length) return "Schedule TBD";
  return schedule.slice(0, 2)
    .map((item) => `${DAY_SHORT[item.day]} ${formatScheduleTime(item)}`)
    .join(" · ");
}

function setView(view, shouldScroll = false) {
  state.currentView = view;
  const isExplore = view === "explore";
  ui.exploreView.hidden = !isExplore;
  ui.planView.hidden = isExplore;
  ui.exploreTab.classList.toggle("is-active", isExplore);
  ui.planTab.classList.toggle("is-active", !isExplore);
  ui.exploreTab.setAttribute("aria-selected", String(isExplore));
  ui.planTab.setAttribute("aria-selected", String(!isExplore));
  updatePlanUI();

  if (shouldScroll) {
    document.querySelector(".workspace").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderPlanView(selected, analysis) {
  const count = selected.length;
  const conflictCount = analysis.conflictPairs.size;
  ui.selectedSummary.textContent = count ? `${count} selected ${pluralize(count, "elective")}` : "No electives selected";
  ui.conflictSummary.textContent = conflictCount ? `${conflictCount} ${pluralize(conflictCount, "conflict")} found` : "Clear so far";
  ui.termSummary.textContent = formatTermSummary(selected);

  renderSelectionStrip(selected);
  renderTimetable(analysis.grid);

  if (!count) {
    ui.timetableNotice.textContent = "Add an elective to begin checking your semester.";
    ui.timetableNotice.classList.remove("has-conflict");
  } else if (conflictCount) {
    ui.timetableNotice.textContent = `${conflictCount} possible ${pluralize(conflictCount, "conflict")} detected. Red cells show the courses that overlap.`;
    ui.timetableNotice.classList.add("has-conflict");
  } else {
    ui.timetableNotice.textContent = `All ${count} selected ${pluralize(count, "elective")} fit the mapped timetable.`;
    ui.timetableNotice.classList.remove("has-conflict");
  }
}

function formatTermSummary(courses) {
  if (!courses.length) return "—";
  let full = 0;
  let half = 0;
  courses.forEach((course) => {
    const formats = new Set(validSchedules(course).map((item) => item.semester_half));
    if (formats.has("FULL_SEMESTER")) full += 1;
    else half += 1;
  });
  const parts = [];
  if (full) parts.push(`${full} full`);
  if (half) parts.push(`${half} half`);
  return parts.join(" · ") || "Schedule TBD";
}

function renderSelectionStrip(selected) {
  if (!selected.length) {
    ui.selectionStrip.replaceChildren(
      element("div", "selection-empty", "Your selected courses will appear here."),
    );
    return;
  }

  const fragment = document.createDocumentFragment();
  selected.forEach((course) => {
    const pill = element("div", "selection-pill");
    const label = element("span", "", cleanCourseName(course));
    const remove = element("button", "", "×");
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${cleanCourseName(course)} from your plan`);
    remove.addEventListener("click", () => toggleSelection(course.id));
    pill.append(label, remove);
    fragment.append(pill);
  });
  ui.selectionStrip.replaceChildren(fragment);
}

function analyzePlan(selected) {
  const grid = new Map();
  const entries = [
    ...FIXED_COURSES.map((course) => ({ ...course, isCore: true })),
    ...selected.map((course) => ({ ...course, isCore: false })),
  ];

  entries.forEach((course) => {
    (course.schedule || []).filter(isValidSchedule).forEach((schedule) => {
      const dayIndex = DAYS.indexOf(schedule.day);
      if (dayIndex < 0) return;
      const sessionIndex = scheduleSession(schedule);
      scheduleWeeks(schedule).forEach((week) => {
        const key = timetableKey(dayIndex, sessionIndex, week);
        const cellEntries = grid.get(key) || [];
        cellEntries.push({
          id: course.id,
          name: cleanCourseName(course),
          isCore: course.isCore,
        });
        grid.set(key, cellEntries);
      });
    });
  });

  const conflictPairs = new Set();
  grid.forEach((cellEntries) => {
    if (cellEntries.length < 2 || !cellEntries.some((entry) => !entry.isCore)) return;
    for (let first = 0; first < cellEntries.length; first += 1) {
      for (let second = first + 1; second < cellEntries.length; second += 1) {
        conflictPairs.add([cellEntries[first].id, cellEntries[second].id].sort().join("|"));
      }
    }
  });

  return { grid, conflictPairs };
}

function scheduleSession(schedule) {
  const date = new Date(schedule.start_time);
  const bangkokHour = (date.getUTCHours() + 7) % 24;
  return bangkokHour >= 12 ? 1 : 0;
}

function scheduleWeeks(schedule) {
  if (Array.isArray(schedule.weeks) && schedule.weeks.length) {
    return schedule.weeks.filter((week) => week >= 1 && week <= TOTAL_WEEKS);
  }
  if (schedule.semester_half === "FIRST_HALF") return range(1, 9);
  if (schedule.semester_half === "SECOND_HALF") return range(10, 18);
  return range(1, 18);
}

function timetableKey(dayIndex, sessionIndex, week) {
  return `${dayIndex}|${sessionIndex}|${week}`;
}

function renderTimetable(grid) {
  const fragment = document.createDocumentFragment();
  fragment.append(
    timetableCell("Day", "timetable-header"),
    timetableCell("Session", "timetable-header"),
  );
  for (let week = 1; week <= TOTAL_WEEKS; week += 1) {
    fragment.append(timetableCell(`W${week}`, `timetable-header${week > 9 ? " is-second-half" : ""}`));
  }

  DAYS.forEach((day, dayIndex) => {
    [0, 1].forEach((sessionIndex) => {
      fragment.append(
        timetableCell(DAY_LABELS[day], "timetable-label"),
        timetableCell(sessionIndex === 0 ? "Morning" : "Afternoon", "timetable-session"),
      );

      for (let week = 1; week <= TOTAL_WEEKS; week += 1) {
        const entries = grid.get(timetableKey(dayIndex, sessionIndex, week)) || [];
        const slot = timetableCell("", `timetable-slot${week > 9 ? " is-second-half" : ""}`);

        if (entries.length === 1) {
          slot.append(createSlotCourse(entries[0], false));
        } else if (entries.length > 1) {
          const stack = element("div", "slot-stack");
          entries.forEach((entry) => stack.append(createSlotCourse(entry, true)));
          slot.append(stack);
          slot.setAttribute("aria-label", `Conflict: ${entries.map((entry) => entry.name).join(" and ")}`);
        }
        fragment.append(slot);
      }
    });
  });

  ui.timetableGrid.replaceChildren(fragment);
}

function timetableCell(text, className) {
  return element("div", `timetable-cell ${className}`, text);
}

function createSlotCourse(entry, conflict) {
  const course = element(
    "span",
    `slot-course${entry.isCore ? " is-core" : ""}${conflict ? " is-conflict" : ""}`,
    abbreviateCourseName(entry.name),
  );
  course.title = entry.name;
  return course;
}

function abbreviateCourseName(name) {
  const clean = String(name || "").trim();
  if (clean.length <= 14) return clean;
  const words = clean.split(/\s+/).filter(Boolean);
  const acronym = words.map((word) => word[0]).join("").toUpperCase();
  if (acronym.length >= 2 && acronym.length <= 7) return acronym;
  return `${clean.slice(0, 12)}…`;
}

function openCourseDialog(course) {
  renderDialogContent(course);
  if (typeof ui.courseDialog.showModal === "function") ui.courseDialog.showModal();
  else ui.courseDialog.setAttribute("open", "");
}

function renderDialogContent(course) {
  const fragment = document.createDocumentFragment();
  const categories = (course.course_category || []).filter((value) => value && value !== "-");
  const kicker = element("p", "dialog-kicker", [
    course.course_no || course.reg_cu_name || "CEDT elective",
    course.section_no != null ? `Section ${course.section_no}` : "",
    categories[0] || "",
  ].filter(Boolean).join(" · "));
  const title = element("h2", "", cleanCourseName(course));
  title.id = "dialogTitle";
  const teacher = element("p", "dialog-teacher", ownerLine(course));

  const facts = element("div", "dialog-facts");
  facts.append(
    dialogFact("Interest", `${interestCount(course)} rankings`),
    dialogFact("Capacity", positiveNumber(course.seat) ? `${positiveNumber(course.seat)} seats` : "Not listed"),
    dialogFact("Eligibility", (course.quota_type || []).map(yearLabel).join(" & ") || "Not listed"),
  );

  const scheduleSection = element("section", "dialog-section");
  scheduleSection.append(element("h3", "", "Class schedule"));
  const scheduleList = element("ul", "dialog-schedule");
  const schedules = validSchedules(course);
  if (schedules.length) {
    schedules.forEach((schedule) => {
      scheduleList.append(element(
        "li",
        "",
        `${DAY_LABELS[schedule.day]} · ${formatScheduleTime(schedule)} · ${halfLabel(schedule.semester_half)}`,
      ));
    });
  } else {
    scheduleList.append(element("li", "", "Schedule to be confirmed"));
  }
  scheduleSection.append(scheduleList);

  const topicsSection = element("section", "dialog-section");
  topicsSection.append(element("h3", "", "Study areas"));
  const topics = element("div", "course-tags");
  [...categories, course.class_language === "ENGLISH" ? "English-taught" : "Thai-taught"]
    .filter(Boolean)
    .forEach((value) => topics.append(element("span", "course-tag", value)));
  topicsSection.append(topics);

  const descriptionSection = element("section", "dialog-section");
  descriptionSection.append(element("h3", "", "About this course"));
  const description = element("div", "dialog-description");
  const rawDescription = String(course.description || "").trim();
  const shortDescription = String(course.short_description || "").trim();
  if (rawDescription && stripHtml(rawDescription).trim()) {
    description.innerHTML = sanitizeHtml(rawDescription);
  } else {
    description.textContent = shortDescription || "No course description has been provided yet.";
  }
  descriptionSection.append(description);

  const actions = element("div", "dialog-actions");
  const selected = state.selectedIds.has(course.id);
  const planButton = element("button", `primary-button${selected ? " plan-toggle is-added" : ""}`);
  planButton.type = "button";
  planButton.setAttribute("aria-pressed", String(selected));
  planButton.textContent = selected ? "✓ In my plan" : "+ Add to my plan";
  planButton.addEventListener("click", () => toggleSelection(course.id));
  actions.append(planButton);

  fragment.append(kicker, title, teacher, facts, scheduleSection, topicsSection, descriptionSection, actions);
  ui.dialogContent.replaceChildren(fragment);
}

function dialogFact(label, value) {
  const fact = element("div", "dialog-fact");
  fact.append(element("span", "", label), element("strong", "", value));
  return fact;
}

function descriptionText(course) {
  return String(course.short_description || "").trim() || stripHtml(course.description || "").trim();
}

function stripHtml(value) {
  const temporary = document.createElement("div");
  temporary.innerHTML = String(value || "");
  return temporary.textContent || "";
}

function sanitizeHtml(value) {
  const template = document.createElement("template");
  template.innerHTML = String(value || "");
  const allowedTags = new Set(["P", "BR", "UL", "OL", "LI", "STRONG", "EM", "B", "I", "U", "A"]);
  const nodes = [...template.content.querySelectorAll("*")];

  nodes.forEach((node) => {
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...node.childNodes);
      return;
    }

    const rawHref = node.tagName === "A" ? node.getAttribute("href") || "" : "";
    [...node.attributes].forEach((attribute) => node.removeAttribute(attribute.name));
    if (node.tagName === "A") {
      if (/^https?:\/\//i.test(rawHref)) {
        node.setAttribute("href", rawHref);
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer nofollow");
      }
    }
  });
  return template.innerHTML;
}

function showToast(message) {
  window.clearTimeout(state.toastTimer);
  ui.toast.textContent = message;
  ui.toast.classList.add("is-visible");
  state.toastTimer = window.setTimeout(() => ui.toast.classList.remove("is-visible"), 2600);
}

function pluralize(count, singular) {
  return count === 1 ? singular : `${singular}s`;
}

function element(tagName, className = "", text = "") {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== "") node.textContent = text;
  return node;
}
