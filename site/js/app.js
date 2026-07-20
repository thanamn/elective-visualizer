"use strict";

const SEMESTER = window.ELECTIVE_SEMESTER;
if (!SEMESTER) throw new Error("Semester configuration was not loaded.");

const STORAGE_KEY = SEMESTER.storageKey;
const TOTAL_WEEKS = 18;
const DAYS = SEMESTER.days;
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

const FIXED_COURSES = SEMESTER.fixedCourses;
const FIXED_COURSE_CHOICE = SEMESTER.fixedCourseChoice || null;
const COMPANY_LOGOS = SEMESTER.companyLogos || {};
const PORTAL_IMPORT = SEMESTER.portalImport || null;
const IMPORT_STORAGE_KEY = PORTAL_IMPORT?.storageKey || "";
const MAX_IMPORT_BYTES = 4 * 1024 * 1024;

const state = {
  courses: [],
  filteredCourses: [],
  selectedIds: restorePlan(),
  filters: {
    search: "",
    days: new Set(),
    half: "",
    year: "",
    category: "",
    sort: "recommended",
  },
  currentView: "plan",
  fixedCourseChoice: restoreFixedCourseChoice(),
  timetableDensity: "comfortable",
  mobileTimetableView: "agenda",
  dataTimestamp: null,
  dataSource: "bundled",
  importedAt: null,
  toastTimer: null,
};

const ui = {
  dataStatus: document.getElementById("dataStatus"),
  reloadButton: document.getElementById("reloadButton"),
  importCoursesButton: document.getElementById("importCoursesButton"),
  importDialog: document.getElementById("importDialog"),
  importDialogCloseButton: document.getElementById("importDialogCloseButton"),
  openPortalLink: document.getElementById("openPortalLink"),
  pasteImportButton: document.getElementById("pasteImportButton"),
  manualImportDetails: document.getElementById("manualImportDetails"),
  importJsonInput: document.getElementById("importJsonInput"),
  importFileInput: document.getElementById("importFileInput"),
  importFileName: document.getElementById("importFileName"),
  importStatus: document.getElementById("importStatus"),
  applyImportButton: document.getElementById("applyImportButton"),
  resetImportButton: document.getElementById("resetImportButton"),
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
  dayFilter: document.getElementById("dayFilter"),
  halfSelect: document.getElementById("halfSelect"),
  yearSelect: document.getElementById("yearSelect"),
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
  selectionStrip: document.getElementById("selectionStrip"),
  timetableSection: document.querySelector(".timetable-section"),
  fixedCourseChoiceControl: document.getElementById("fixedCourseChoiceControl"),
  densityControl: document.getElementById("densityControl"),
  mobileViewControl: document.getElementById("mobileViewControl"),
  timetableNotice: document.getElementById("timetableNotice"),
  conflictList: document.getElementById("conflictList"),
  mobileAgenda: document.getElementById("mobileAgenda"),
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

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function bindEvents() {
  ui.reloadButton.addEventListener("click", loadData);
  ui.importCoursesButton?.addEventListener("click", openImportDialog);
  ui.importDialogCloseButton?.addEventListener("click", () => ui.importDialog.close());
  ui.pasteImportButton?.addEventListener("click", pasteAndImportCourses);
  ui.applyImportButton?.addEventListener("click", importPastedCourses);
  ui.resetImportButton?.addEventListener("click", resetImportedCourses);
  ui.importFileInput?.addEventListener("change", loadImportFile);
  if (ui.openPortalLink && PORTAL_IMPORT?.portalUrl) {
    ui.openPortalLink.href = PORTAL_IMPORT.portalUrl;
  }
  ui.importDialog?.addEventListener("click", (event) => closeDialogFromBackdrop(event, ui.importDialog));

  ui.searchInput.addEventListener("input", () => {
    state.filters.search = ui.searchInput.value.trim();
    applyFilters();
  });
  ui.dayFilter.addEventListener("change", () => {
    state.filters.days = new Set(
      [...ui.dayFilter.querySelectorAll('input[type="checkbox"]:checked')]
        .map((input) => input.value),
    );
    applyFilters();
  });
  ui.halfSelect.addEventListener("change", () => updateFilter("half", ui.halfSelect.value));
  ui.yearSelect.addEventListener("change", () => updateFilter("year", ui.yearSelect.value));
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
  ui.fixedCourseChoiceControl?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-fixed-choice]");
    if (button) setFixedCourseChoice(button.dataset.fixedChoice);
  });
  ui.densityControl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-density]");
    if (button) setTimetableDensity(button.dataset.density);
  });
  ui.mobileViewControl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mobile-view]");
    if (button) setMobileTimetableView(button.dataset.mobileView);
  });
  ui.timetableGrid.addEventListener("mouseover", handleTimetableHighlight);
  ui.timetableGrid.addEventListener("focusin", handleTimetableHighlight);
  ui.timetableGrid.addEventListener("mouseout", clearTimetableHighlight);
  ui.timetableGrid.addEventListener("focusout", clearTimetableHighlight);

  ui.dialogCloseButton.addEventListener("click", () => ui.courseDialog.close());
  ui.courseDialog.addEventListener("click", (event) => closeDialogFromBackdrop(event, ui.courseDialog));

  window.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target instanceof HTMLSelectElement;

    if (event.key === "/" && !isTyping && !ui.courseDialog.open && !ui.importDialog?.open) {
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

function closeDialogFromBackdrop(event, dialog) {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  const inside = event.clientX >= rect.left
    && event.clientX <= rect.right
    && event.clientY >= rect.top
    && event.clientY <= rect.bottom;
  if (!inside) dialog.close();
}

function updateFilter(key, value) {
  state.filters[key] = value;
  applyFilters();
}

async function loadData() {
  setLoadingState();
  const imported = restoreImportedCourses();
  if (imported) {
    applyCourseData(imported.data, {
      source: "imported",
      importedAt: imported.importedAt,
    });
    return;
  }

  const candidates = dataCandidates();
  let lastError = new Error("No data source was available.");

  for (const url of candidates) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const data = await response.json();
      if (!data || !Array.isArray(data.courses)) throw new Error("The file does not contain a course list.");

      applyCourseData(data);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  showLoadError(lastError);
}

function applyCourseData(data, { source = "bundled", importedAt = null } = {}) {
  state.courses = data.courses.map(normalizeCourse);
  state.dataTimestamp = data.data_gathered_at || importedAt || null;
  state.dataSource = source;
  state.importedAt = importedAt;
  pruneSavedPlan();
  populateCategories();
  updateDataSummary();
  applyFilters();
  ui.dataStatus.className = "data-status is-ready";
  ui.dataStatus.lastChild.textContent = source === "imported" ? "Imported data ready" : "Latest data ready";
}

function setLoadingState() {
  ui.reloadButton.disabled = true;
  ui.dataStatus.className = "data-status";
  ui.dataStatus.lastChild.textContent = "Loading course data";
  ui.courseGrid.setAttribute("aria-busy", "true");
}

function dataCandidates() {
  return [SEMESTER.dataPath];
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

function openImportDialog() {
  if (!PORTAL_IMPORT || !ui.importDialog) return;
  setImportStatus(
    state.dataSource === "imported"
      ? `Currently using ${state.courses.length} locally imported courses.`
      : "Open the portal and follow the three steps below.",
    state.dataSource === "imported" ? "success" : "",
  );
  ui.resetImportButton.disabled = state.dataSource !== "imported";
  if (typeof ui.importDialog.showModal === "function") ui.importDialog.showModal();
  else ui.importDialog.setAttribute("open", "");
}

async function pasteAndImportCourses() {
  if (!PORTAL_IMPORT) return;
  if (!navigator.clipboard?.readText) {
    revealManualImport("Automatic clipboard access is unavailable here. Paste the response below.", "error");
    return;
  }

  const originalLabel = ui.pasteImportButton.textContent;
  ui.pasteImportButton.disabled = true;
  ui.pasteImportButton.textContent = "Reading clipboard…";
  setImportStatus("Waiting for clipboard permission…");

  try {
    const text = await navigator.clipboard.readText();
    if (!String(text || "").trim()) {
      revealManualImport("Your clipboard is empty. Copy the Response JSON, then try again.", "error");
      return;
    }
    ui.importJsonInput.value = text;
    importCourseText(text);
  } catch {
    revealManualImport(
      "Chrome blocked clipboard access. Paste the copied response into the manual box below.",
      "error",
    );
  } finally {
    ui.pasteImportButton.disabled = false;
    ui.pasteImportButton.textContent = originalLabel;
  }
}

function revealManualImport(message, type = "") {
  if (ui.manualImportDetails) ui.manualImportDetails.open = true;
  setImportStatus(message, type);
  window.requestAnimationFrame(() => ui.importJsonInput?.focus());
}

async function loadImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) {
    ui.importFileName.textContent = "No file selected";
    return;
  }

  ui.importFileName.textContent = file.name;
  if (file.size > MAX_IMPORT_BYTES) {
    ui.importJsonInput.value = "";
    setImportStatus("That file is larger than 4 MB. Choose the course response JSON only.", "error");
    return;
  }

  try {
    ui.importJsonInput.value = await file.text();
    const preview = parseImportedPayload(ui.importJsonInput.value);
    setImportStatus(`${preview.courses.length} courses found. Ready to import.`, "success");
  } catch (error) {
    setImportStatus(error.message, "error");
  }
}

function importPastedCourses() {
  if (!PORTAL_IMPORT) return;
  importCourseText(ui.importJsonInput.value);
}

function importCourseText(text) {
  try {
    const data = parseImportedPayload(text);
    const importedAt = new Date().toISOString();
    persistImportedCourses(data, importedAt);
    applyCourseData(data, { source: "imported", importedAt });
    ui.importJsonInput.value = "";
    ui.importFileInput.value = "";
    ui.importFileName.textContent = "No file selected";
    ui.importDialog.close();
    showToast(`${data.courses.length} courses imported from the CEDT response.`);
    return true;
  } catch (error) {
    if (ui.manualImportDetails) ui.manualImportDetails.open = true;
    setImportStatus(error.message, "error");
    return false;
  }
}

async function resetImportedCourses() {
  if (!IMPORT_STORAGE_KEY) return;
  try {
    localStorage.removeItem(IMPORT_STORAGE_KEY);
  } catch {
    // Reloading still restores the bundled snapshot when storage is unavailable.
  }
  await loadData();
  ui.importDialog.close();
  showToast("Using the bundled Semester 1/2569 course snapshot.");
}

function parseImportedPayload(text) {
  const raw = String(text || "").trim();
  if (!raw) throw new Error("Paste the copied Response JSON, or choose a JSON file.");
  if (new Blob([raw]).size > MAX_IMPORT_BYTES) {
    throw new Error("That response is larger than 4 MB. Copy the course response only.");
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("This is not valid JSON. Copy from the request’s Response tab, not Headers.");
  }

  const candidates = [
    parsed,
    parsed?.data,
    parsed?.data?.data,
    parsed?.response,
    parsed?.response?.data,
  ];
  const payload = Array.isArray(parsed)
    ? { courses: parsed }
    : candidates.find((candidate) => candidate && Array.isArray(candidate.courses));

  if (!payload) {
    throw new Error('No "courses" list was found. Make sure you copied the response from the request named "all".');
  }
  if (!payload.courses.length) throw new Error("The response contains no courses.");

  const courses = payload.courses.map((course, index) => {
    const name = String(course?.name || course?.reg_cu_name || "").trim();
    const id = String(course?.id || "").trim();
    if (!course || typeof course !== "object" || !id || !name) {
      throw new Error(`Course ${index + 1} is missing an id or name.`);
    }
    return { ...course, id };
  });

  const uniqueIds = new Set(courses.map((course) => course.id));
  if (uniqueIds.size !== courses.length) {
    throw new Error("The response contains duplicate course ids, so it was not imported.");
  }

  const roundIds = new Set(courses.map((course) => String(course.round_id || "").trim()).filter(Boolean));
  if (PORTAL_IMPORT?.roundId && (roundIds.size !== 1 || !roundIds.has(PORTAL_IMPORT.roundId))) {
    throw new Error("This response belongs to a different elective round, so it was not mixed into Semester 1/2569.");
  }

  return {
    courses,
    total_courses: courses.length,
    message: typeof payload.message === "string" ? payload.message : "Imported from CEDT course response",
    data_gathered_at: new Date().toISOString(),
  };
}

function persistImportedCourses(data, importedAt) {
  try {
    localStorage.setItem(IMPORT_STORAGE_KEY, JSON.stringify({
      version: 1,
      importedAt,
      data,
    }));
  } catch {
    throw new Error("The browser could not save this course list. Check that local storage is available.");
  }
}

function restoreImportedCourses() {
  if (!IMPORT_STORAGE_KEY) return null;
  try {
    const stored = JSON.parse(localStorage.getItem(IMPORT_STORAGE_KEY) || "null");
    if (stored?.version !== 1 || !stored.data || !Array.isArray(stored.data.courses)) return null;
    if (!stored.data.courses.length) throw new Error("Stored course list is empty.");
    return stored;
  } catch {
    try {
      localStorage.removeItem(IMPORT_STORAGE_KEY);
    } catch {
      // A broken import is ignored if browser storage cannot be changed.
    }
    return null;
  }
}

function setImportStatus(message, type = "") {
  if (!ui.importStatus) return;
  ui.importStatus.textContent = message;
  ui.importStatus.className = `import-status${type ? ` is-${type}` : ""}`;
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

function normalizeCourse(course) {
  const categories = (Array.isArray(course.course_category) ? course.course_category : [])
    .map(normalizeCategory)
    .filter(Boolean);
  return {
    ...course,
    course_category: [...new Set(categories)],
  };
}

function normalizeCategory(value) {
  const category = String(value || "").trim();
  if (!category || category === "-") return "";
  if (/^cloud\s*\/?\s*system$/i.test(category)) return "Cloud / System";
  return category;
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
  ui.updatedAt.textContent = state.dataSource === "imported"
    ? `Imported from CEDT · ${formatted}`
    : `Data snapshot · ${formatted}`;
}

function parseDataTimestamp(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function applyFilters() {
  const query = normalizeText(state.filters.search);
  const { days, half, year, category, sort } = state.filters;

  let courses = state.courses.filter((course) => {
    if (query && !courseSearchText(course).includes(query)) return false;
    if (year && !(course.quota_type || []).includes(year)) return false;
    if (category && !(course.course_category || []).includes(category)) return false;

    const schedule = Array.isArray(course.schedule) ? course.schedule : [];
    if (days.size && !schedule.some((item) => days.has(item.day))) return false;
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
    || state.filters.days.size
    || state.filters.half
    || state.filters.year
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
    days: new Set(),
    half: "",
    year: "",
    category: "",
    sort: "recommended",
  };
  ui.searchInput.value = "";
  ui.dayFilter.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.checked = false;
  });
  ui.halfSelect.value = "";
  ui.yearSelect.value = "";
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

  const logoPath = organizationLogoPath(course);
  if (logoPath) {
    const watermark = element("img", "company-watermark");
    watermark.src = logoPath;
    watermark.alt = "";
    watermark.loading = "lazy";
    watermark.decoding = "async";
    watermark.setAttribute("aria-hidden", "true");
    card.append(watermark);
  }

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

function organizationLogoPath(course) {
  return COMPANY_LOGOS[String(course.course_owner || "").trim()] || "";
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
    "Cloud / System": "#b9dded",
    "Computer Graphics/UX": "#f2c8d7",
    "Startup": "#f2dd83",
    "Project Management": "#f2dd83",
    "Fintech": "#bed8f2",
    "Games": "#efc8a8",
    "IT Security": "#f3b6ad",
    "IT Certificate": "#d9d4f7",
    "Data science / AI": "#c9d1f5",
    "Robotics": "#b9dfdf",
    "IoTs": "#b9dfdf",
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
  if (value === "YEAR_FOURTH") return "Year 4";
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

function restoreFixedCourseChoice() {
  if (!FIXED_COURSE_CHOICE) return "";
  try {
    const value = localStorage.getItem(FIXED_COURSE_CHOICE.storageKey) || "";
    return FIXED_COURSE_CHOICE.options.some((option) => option.value === value) ? value : "";
  } catch {
    return "";
  }
}

function persistFixedCourseChoice() {
  if (!FIXED_COURSE_CHOICE) return;
  try {
    if (state.fixedCourseChoice) {
      localStorage.setItem(FIXED_COURSE_CHOICE.storageKey, state.fixedCourseChoice);
    } else {
      localStorage.removeItem(FIXED_COURSE_CHOICE.storageKey);
    }
  } catch {
    // The current choice still works when browser storage is unavailable.
  }
}

function setFixedCourseChoice(value) {
  if (!FIXED_COURSE_CHOICE) return;
  const option = FIXED_COURSE_CHOICE.options.find((item) => item.value === value);
  state.fixedCourseChoice = option?.value || "";
  persistFixedCourseChoice();
  updatePlanUI();
  showToast(option
    ? `Technical Writing set to ${option.label}.`
    : "Technical Writing section cleared.");
}

function activeFixedCourses() {
  if (!FIXED_COURSE_CHOICE) return FIXED_COURSES;
  const choiceIds = new Set(FIXED_COURSE_CHOICE.courseIds);
  const alwaysFixed = FIXED_COURSES.filter((course) => !choiceIds.has(course.id));
  const selectedOption = FIXED_COURSE_CHOICE.options.find(
    (option) => option.value === state.fixedCourseChoice,
  );
  if (!selectedOption) return alwaysFixed;
  const selectedCourse = FIXED_COURSES.find((course) => course.id === selectedOption.courseId);
  return selectedCourse ? [...alwaysFixed, selectedCourse] : alwaysFixed;
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
  const conflictCount = analysis.conflictGroups.length;

  ui.planStat.textContent = String(count);
  ui.planCountBadge.textContent = String(count);
  ui.planCountBadge.setAttribute("aria-label", `${count} selected ${pluralize(count, "course")}`);
  ui.planPreviewCount.textContent = String(count);
  ui.openPlanButton.disabled = count === 0;
  ui.clearPlanButton.disabled = count === 0;
  ui.planPlaceholder.hidden = count !== 0;
  ui.mobilePlanBar.hidden = count === 0 || state.currentView === "plan";
  ui.mobilePlanCount.textContent = `${count} ${pluralize(count, "course")}`;
  ui.mobilePlanStatus.textContent = conflictCount ? `${conflictCount} ${pluralize(conflictCount, "conflict")}` : "Clear";

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

function setTimetableDensity(value) {
  if (!["compact", "comfortable"].includes(value) || value === state.timetableDensity) return;
  state.timetableDensity = value;
  updatePlanUI();
}

function setMobileTimetableView(value) {
  if (!["agenda", "grid"].includes(value) || value === state.mobileTimetableView) return;
  state.mobileTimetableView = value;
  updateTimetableControls();
}

function updateTimetableControls() {
  if (ui.fixedCourseChoiceControl) {
    updateSegmentedControl(ui.fixedCourseChoiceControl, "fixedChoice", state.fixedCourseChoice);
  }
  updateSegmentedControl(ui.densityControl, "density", state.timetableDensity);
  updateSegmentedControl(ui.mobileViewControl, "mobileView", state.mobileTimetableView);

  ui.timetableSection.classList.toggle("is-compact", state.timetableDensity === "compact");
  ui.timetableSection.classList.toggle("show-mobile-grid", state.mobileTimetableView === "grid");
}

function updateSegmentedControl(container, dataKey, selectedValue) {
  container.querySelectorAll("button").forEach((button) => {
    const isActive = button.dataset[dataKey] === selectedValue;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderPlanView(selected, analysis) {
  const count = selected.length;
  const conflictCount = analysis.conflictGroups.length;
  const needsFixedCourseChoice = Boolean(FIXED_COURSE_CHOICE && !state.fixedCourseChoice);

  updateTimetableControls();
  renderSelectionStrip(selected);
  renderTimetable(analysis.grid);
  renderConflictList(analysis.conflictGroups);
  renderMobileAgenda(selected, analysis.conflictGroups);

  if (needsFixedCourseChoice) {
    ui.timetableNotice.textContent = count
      ? "Choose your Technical Writing section to complete the conflict check."
      : "Choose your Technical Writing section, then add electives to check your semester.";
    ui.timetableNotice.classList.remove("has-conflict");
    ui.timetableNotice.classList.add("needs-choice");
  } else if (!count) {
    ui.timetableNotice.textContent = "Add an elective to begin checking your semester.";
    ui.timetableNotice.classList.remove("has-conflict");
    ui.timetableNotice.classList.remove("needs-choice");
  } else if (conflictCount) {
    ui.timetableNotice.textContent = `${conflictCount} exact ${pluralize(conflictCount, "overlap")} detected. Review the times and weeks below.`;
    ui.timetableNotice.classList.add("has-conflict");
    ui.timetableNotice.classList.remove("needs-choice");
  } else {
    ui.timetableNotice.textContent = `All ${count} selected ${pluralize(count, "elective")} fit the mapped timetable.`;
    ui.timetableNotice.classList.remove("has-conflict");
    ui.timetableNotice.classList.remove("needs-choice");
  }
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
    const logoPath = organizationLogoPath(course);

    if (logoPath) {
      const logo = element("img", "selection-pill-logo");
      logo.src = logoPath;
      logo.alt = "";
      logo.decoding = "async";
      logo.setAttribute("aria-hidden", "true");
      logo.addEventListener("error", () => {
        logo.remove();
        pill.classList.remove("has-logo");
      }, { once: true });
      pill.classList.add("has-logo");
      pill.append(logo);
    }

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
    ...activeFixedCourses().map((course) => ({ ...course, isCore: true, color: course.color || "#d9d4f7" })),
    ...selected.map((course) => ({
      ...course,
      isCore: false,
      color: categoryColor((course.course_category || [])[0]),
    })),
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
          color: course.color,
          startMinutes: scheduleTimeMinutes(schedule.start_time),
          endMinutes: scheduleTimeMinutes(schedule.end_time),
          timeLabel: formatScheduleTime(schedule),
        });
        grid.set(key, cellEntries);
      });
    });
  });

  return { grid, conflictGroups: buildConflictGroups(grid) };
}

function buildConflictGroups(grid) {
  const groups = [];

  DAYS.forEach((day, dayIndex) => {
    [0, 1].forEach((sessionIndex) => {
      let week = 1;
      while (week <= TOTAL_WEEKS) {
        const entries = grid.get(timetableKey(dayIndex, sessionIndex, week)) || [];
        const pairs = cellConflictPairs(entries);
        if (!pairs.length) {
          week += 1;
          continue;
        }

        const signature = conflictPairSignature(pairs);
        let span = 1;
        while (week + span <= TOTAL_WEEKS) {
          const nextEntries = grid.get(timetableKey(dayIndex, sessionIndex, week + span)) || [];
          if (conflictPairSignature(cellConflictPairs(nextEntries)) !== signature) break;
          span += 1;
        }

        groups.push({
          day,
          dayIndex,
          sessionIndex,
          startWeek: week,
          endWeek: week + span - 1,
          entries: uniqueConflictEntries(pairs),
          pairs,
        });
        week += span;
      }
    });
  });

  return groups;
}

function scheduleTimeMinutes(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return ((date.getUTCHours() + 7) % 24) * 60 + date.getUTCMinutes();
}

function cellConflictPairs(entries) {
  const pairs = new Map();

  for (let first = 0; first < entries.length; first += 1) {
    for (let second = first + 1; second < entries.length; second += 1) {
      const firstEntry = entries[first];
      const secondEntry = entries[second];
      if (firstEntry.id === secondEntry.id) continue;
      if (firstEntry.isCore && secondEntry.isCore) continue;

      const overlapStart = Math.max(firstEntry.startMinutes, secondEntry.startMinutes);
      const overlapEnd = Math.min(firstEntry.endMinutes, secondEntry.endMinutes);
      if (overlapStart >= overlapEnd) continue;

      const ids = [firstEntry.id, secondEntry.id].sort();
      const id = `${ids.join("|")}|${overlapStart}-${overlapEnd}`;
      pairs.set(id, {
        id,
        first: firstEntry,
        second: secondEntry,
        overlapStart,
        overlapEnd,
      });
    }
  }

  return [...pairs.values()];
}

function conflictPairSignature(pairs) {
  return pairs.map((pair) => pair.id).sort().join("||");
}

function uniqueConflictEntries(pairs) {
  const entries = new Map();
  pairs.forEach((pair) => {
    entries.set(`${pair.first.id}|${pair.first.timeLabel}`, pair.first);
    entries.set(`${pair.second.id}|${pair.second.timeLabel}`, pair.second);
  });
  return [...entries.values()];
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
  const visible = visibleWeekRange();
  const fragment = document.createDocumentFragment();
  fragment.append(
    timetableCell("Day", "timetable-header timetable-sticky-day"),
    timetableCell("Session", "timetable-header timetable-sticky-session"),
  );
  for (let week = visible.start; week <= visible.end; week += 1) {
    fragment.append(timetableCell(`W${week}`, `timetable-header${week > 9 ? " is-second-half" : ""}`));
  }

  DAYS.forEach((day, dayIndex) => {
    [0, 1].forEach((sessionIndex) => {
      fragment.append(
        timetableCell(DAY_LABELS[day], "timetable-label timetable-sticky-day"),
        timetableCell(sessionIndex === 0 ? "Morning" : "Afternoon", "timetable-session timetable-sticky-session"),
      );

      let week = visible.start;
      while (week <= visible.end) {
        const entries = grid.get(timetableKey(dayIndex, sessionIndex, week)) || [];
        const weekSpan = entries.length
          ? consecutiveTimetableWeeks(grid, dayIndex, sessionIndex, week, entries, visible.end)
          : 1;
        const endWeek = week + weekSpan - 1;
        const conflictPairs = cellConflictPairs(entries);
        const conflictingIds = new Set(conflictPairs.flatMap((pair) => [pair.first.id, pair.second.id]));
        const slot = timetableCell(
          "",
          `timetable-slot${week > 9 ? " is-second-half" : ""}${weekSpan > 1 ? " has-span" : ""}`,
        );
        if (weekSpan > 1) slot.style.gridColumnEnd = `span ${weekSpan}`;

        if (entries.length === 1) {
          slot.append(createSlotCourse(entries[0], false, weekSpan));
          slot.setAttribute("aria-label", `${entries[0].name}, ${entries[0].timeLabel}, ${weekRangeLabel(week, endWeek)}`);
        } else if (entries.length > 1) {
          const stack = element("div", "slot-stack");
          entries.forEach((entry) => {
            stack.append(createSlotCourse(entry, conflictingIds.has(entry.id), weekSpan));
          });
          slot.append(stack);
          slot.setAttribute(
            "aria-label",
            `${conflictPairs.length ? "Conflict: " : ""}${entries.map((entry) => `${entry.name} ${entry.timeLabel}`).join(" and ")}, ${weekRangeLabel(week, endWeek)}`,
          );
        }
        fragment.append(slot);
        week += weekSpan;
      }
    });
  });

  const visibleWeekCount = visible.end - visible.start + 1;
  const weekWidth = state.timetableDensity === "compact" ? 34 : 52;
  ui.timetableGrid.style.setProperty("--visible-weeks", String(visibleWeekCount));
  ui.timetableGrid.style.minWidth = `${166 + visibleWeekCount * weekWidth}px`;
  ui.timetableGrid.replaceChildren(fragment);
}

function timetableCell(text, className) {
  return element("div", `timetable-cell ${className}`, text);
}

function consecutiveTimetableWeeks(grid, dayIndex, sessionIndex, startWeek, entries, endWeek = TOTAL_WEEKS) {
  const signature = timetableEntrySignature(entries);
  let weekSpan = 1;
  while (startWeek + weekSpan <= endWeek) {
    const nextEntries = grid.get(timetableKey(dayIndex, sessionIndex, startWeek + weekSpan)) || [];
    if (timetableEntrySignature(nextEntries) !== signature) break;
    weekSpan += 1;
  }
  return weekSpan;
}

function timetableEntrySignature(entries) {
  return entries
    .map((entry) => `${entry.isCore ? "core" : "elective"}:${entry.id}:${entry.startMinutes}-${entry.endMinutes}`)
    .sort()
    .join("|");
}

function visibleWeekRange() {
  return { start: 1, end: 18 };
}

function weekRangeLabel(startWeek, endWeek) {
  return startWeek === endWeek ? `week ${startWeek}` : `weeks ${startWeek}–${endWeek}`;
}

function createSlotCourse(entry, conflict, weekSpan = 1) {
  const course = element(
    entry.isCore ? "span" : "button",
    `slot-course${entry.isCore ? " is-core" : ""}${conflict ? " is-conflict" : ""}${weekSpan > 1 ? " is-connected" : ""}`,
    weekSpan > 1 ? entry.name : abbreviateCourseName(entry.name),
  );
  course.dataset.courseId = entry.id;
  course.style.setProperty("--course-color", entry.color || "#bde6d1");
  course.title = `${entry.name} · ${entry.timeLabel}${entry.isCore ? "" : " · Open course details"}`;
  if (!entry.isCore) {
    course.type = "button";
    course.setAttribute("aria-label", `Open ${entry.name} details. ${entry.timeLabel}.`);
    course.addEventListener("click", () => {
      const selectedCourse = state.courses.find((item) => item.id === entry.id);
      if (selectedCourse) openCourseDialog(selectedCourse);
    });
  }
  return course;
}

function handleTimetableHighlight(event) {
  const course = event.target.closest(".slot-course[data-course-id]");
  if (!course || !ui.timetableGrid.contains(course)) return;
  const courseId = course.dataset.courseId;
  ui.timetableGrid.classList.add("has-highlight");
  ui.timetableGrid.querySelectorAll(".slot-course[data-course-id]").forEach((slot) => {
    slot.classList.toggle("is-highlighted", slot.dataset.courseId === courseId);
  });
}

function clearTimetableHighlight(event) {
  const course = event.target.closest(".slot-course[data-course-id]");
  if (!course) return;
  const related = event.relatedTarget instanceof Element
    ? event.relatedTarget.closest(".slot-course[data-course-id]")
    : null;
  if (related?.dataset.courseId === course.dataset.courseId) return;
  ui.timetableGrid.classList.remove("has-highlight");
  ui.timetableGrid.querySelectorAll(".slot-course.is-highlighted").forEach((slot) => {
    slot.classList.remove("is-highlighted");
  });
}

function renderConflictList(conflictGroups) {
  const visible = visibleWeekRange();
  const visibleGroups = conflictGroups
    .filter((group) => group.endWeek >= visible.start && group.startWeek <= visible.end)
    .map((group) => ({
      ...group,
      visibleStart: Math.max(group.startWeek, visible.start),
      visibleEnd: Math.min(group.endWeek, visible.end),
    }));

  if (!visibleGroups.length) {
    ui.conflictList.replaceChildren();
    return;
  }

  const fragment = document.createDocumentFragment();
  visibleGroups.forEach((group) => {
    const card = element("article", "conflict-card");
    const heading = element("div", "conflict-card-heading");
    const title = element(
      "strong",
      "",
      `${DAY_LABELS[group.day]} ${group.sessionIndex === 0 ? "morning" : "afternoon"} · ${weekRangeLabel(group.visibleStart, group.visibleEnd)}`,
    );
    heading.append(
      title,
      element("span", "", `${group.pairs.length} exact ${pluralize(group.pairs.length, "clash")}`),
    );

    const pairList = element("div", "conflict-pairs");
    group.pairs.forEach((pair) => {
      const row = element("div", "conflict-pair");
      const names = element("div", "conflict-pair-names");
      names.append(
        conflictCourseButton(pair.first),
        element("span", "", "overlaps"),
        conflictCourseButton(pair.second),
      );
      row.append(
        names,
        element("strong", "conflict-time", `${formatMinutes(pair.overlapStart)}–${formatMinutes(pair.overlapEnd)}`),
      );
      pairList.append(row);
    });

    const actions = element("div", "conflict-actions");
    uniqueConflictEntries(group.pairs)
      .filter((entry) => !entry.isCore)
      .filter((entry, index, entries) => entries.findIndex((item) => item.id === entry.id) === index)
      .forEach((entry) => {
        const remove = element("button", "conflict-remove", `Remove ${entry.name}`);
        remove.type = "button";
        remove.addEventListener("click", () => toggleSelection(entry.id));
        actions.append(remove);
      });

    card.append(heading, pairList);
    if (actions.childElementCount) card.append(actions);
    fragment.append(card);
  });
  ui.conflictList.replaceChildren(fragment);
}

function conflictCourseButton(entry) {
  if (entry.isCore) return element("strong", "conflict-course is-core", entry.name);
  const button = element("button", "conflict-course", entry.name);
  button.type = "button";
  button.addEventListener("click", () => {
    const course = state.courses.find((item) => item.id === entry.id);
    if (course) openCourseDialog(course);
  });
  return button;
}

function renderMobileAgenda(selected, conflictGroups) {
  const visible = visibleWeekRange();
  const courses = [
    ...activeFixedCourses().map((course) => ({ ...course, isCore: true })),
    ...selected.map((course) => ({ ...course, isCore: false })),
  ];
  const agendaEntries = [];

  courses.forEach((course) => {
    (course.schedule || []).filter(isValidSchedule).forEach((schedule) => {
      const weeks = scheduleWeeks(schedule).filter((week) => week >= visible.start && week <= visible.end);
      if (!weeks.length) return;
      const sessionIndex = scheduleSession(schedule);
      const startMinutes = scheduleTimeMinutes(schedule.start_time);
      const endMinutes = scheduleTimeMinutes(schedule.end_time);
      const hasConflict = conflictGroups.some((group) => (
        group.day === schedule.day
        && group.sessionIndex === sessionIndex
        && group.endWeek >= weeks[0]
        && group.startWeek <= weeks[weeks.length - 1]
        && group.entries.some((entry) => (
          entry.id === course.id
          && entry.startMinutes === startMinutes
          && entry.endMinutes === endMinutes
        ))
      ));
      agendaEntries.push({
        id: course.id,
        name: cleanCourseName(course),
        day: schedule.day,
        isCore: course.isCore,
        color: course.color || "#d9d4f7",
        startMinutes,
        endMinutes,
        timeLabel: formatScheduleTime(schedule),
        weeks,
        hasConflict,
      });
    });
  });

  agendaEntries.sort((a, b) => (
    DAYS.indexOf(a.day) - DAYS.indexOf(b.day)
    || a.startMinutes - b.startMinutes
    || a.name.localeCompare(b.name)
  ));

  const fragment = document.createDocumentFragment();
  DAYS.forEach((day) => {
    const dayEntries = agendaEntries.filter((entry) => entry.day === day);
    if (!dayEntries.length) return;

    const section = element("section", "agenda-day");
    const heading = element("div", "agenda-day-heading");
    heading.append(
      element("h3", "", DAY_LABELS[day]),
      element("span", "", `${dayEntries.length} ${pluralize(dayEntries.length, "block")}`),
    );
    section.append(heading);

    dayEntries.forEach((entry) => {
      const row = element(
        "article",
        `agenda-item${entry.isCore ? " is-core" : ""}${entry.hasConflict ? " has-conflict" : ""}`,
      );
      row.style.setProperty("--agenda-color", entry.color);
      const time = element("div", "agenda-time");
      const [start, end] = entry.timeLabel.split("–");
      time.append(element("strong", "", start || entry.timeLabel), element("span", "", end || ""));

      const copy = element("div", "agenda-copy");
      if (entry.isCore) {
        copy.append(element("strong", "agenda-course", entry.name));
      } else {
        const details = element("button", "agenda-course", entry.name);
        details.type = "button";
        details.addEventListener("click", () => {
          const course = state.courses.find((item) => item.id === entry.id);
          if (course) openCourseDialog(course);
        });
        copy.append(details);
      }
      copy.append(element(
        "span",
        "",
        `${entry.isCore ? "Fixed course" : "Elective"} · ${weekListLabel(entry.weeks)}${entry.hasConflict ? " · Conflict" : ""}`,
      ));

      row.append(time, copy);
      if (!entry.isCore) {
        const remove = element("button", "agenda-remove", "×");
        remove.type = "button";
        remove.setAttribute("aria-label", `Remove ${entry.name} from your plan`);
        remove.addEventListener("click", () => toggleSelection(entry.id));
        row.append(remove);
      }
      section.append(row);
    });

    fragment.append(section);
  });

  ui.mobileAgenda.replaceChildren(fragment);
}

function weekListLabel(weeks) {
  if (!weeks.length) return "No weeks";
  const isConsecutive = weeks.every((week, index) => index === 0 || week === weeks[index - 1] + 1);
  if (isConsecutive) {
    return weeks.length === 1 ? `Week ${weeks[0]}` : `Weeks ${weeks[0]}–${weeks[weeks.length - 1]}`;
  }
  return `Weeks ${weeks.join(", ")}`;
}

function formatMinutes(minutes) {
  const normalized = ((minutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
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
