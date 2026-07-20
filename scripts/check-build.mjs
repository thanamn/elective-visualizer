import worker from "../dist/server/index.js";

const expectedRoutes = [
  ["/", "text/html", "Refresh courses in about a minute."],
  ["/2-2568/", "text/html", "Semester 2/2568"],
  ["/style.css", "text/css", "--paper"],
  ["/js/app.js", "text/javascript", "FIXED_COURSES"],
  ["/js/semester-2-2568.js", "text/javascript", "\"2-2568\""],
  ["/js/semester-1-2569.js", "text/javascript", "\"1-2569\""],
  ["/elective_latest.json", "application/json", "\"courses\""],
  ["/elective_1_2569.json", "application/json", "\"courses\""],
  ["/favicon.png", "image/png", null],
  ["/og.png", "image/png", null],
  ["/assets/company-logos/chulalongkorn-university.png", "image/png", null],
  ["/assets/company-logos/accenture.svg", "image/svg+xml", "<svg"],
  ["/assets/company-logos/the-monk-studios.png", "image/png", null],
  ["/assets/company-logos/bgrimm-power.svg", "image/svg+xml", "<svg"],
  ["/assets/company-logos/playtorium.png", "image/png", null],
  ["/assets/company-logos/relearn-solution.jpg", "image/jpeg", null],
  ["/assets/company-logos/huawei.png", "image/png", null],
  ["/assets/company-logos/acis.png", "image/png", null],
  ["/assets/company-logos/attra-inter-group.png", "image/png", null],
  ["/assets/company-logos/pttgc.svg", "image/svg+xml", "<svg"],
  ["/assets/company-logos/sea-bridge.png", "image/png", null],
  ["/assets/company-logos/look-alive-studio.jpg", "image/jpeg", null],
  ["/assets/company-logos/kmutt.png", "image/png", null],
  ["/assets/company-logos/stelligence.png", "image/png", null],
  ["/assets/company-logos/fintech-thailand.png", "image/png", null],
  ["/assets/company-logos/sense-info-tech.png", "image/png", null],
  ["/assets/company-logos/greenmoons.png", "image/png", null],
  ["/assets/company-logos/nipa-cloud.svg", "image/svg+xml", "<svg"],
  ["/assets/company-logos/demeter-ict.png", "image/png", null],
  ["/assets/company-logos/nida.svg", "image/svg+xml", "<svg"],
];

for (const [route, contentType, expectedText] of expectedRoutes) {
  const response = await worker.fetch(new Request(`https://example.test${route}`));
  if (response.status !== 200) throw new Error(`${route} returned ${response.status}`);
  if (!response.headers.get("content-type")?.startsWith(contentType)) {
    throw new Error(`${route} returned an unexpected content type`);
  }
  if (expectedText && !(await response.text()).includes(expectedText)) {
    throw new Error(`${route} did not contain the expected content`);
  }
}

const missing = await worker.fetch(new Request("https://example.test/missing"));
if (missing.status !== 404) throw new Error("Missing routes must return 404");

const latestSemesterRedirect = await worker.fetch(new Request("https://example.test/1-2569/"), { redirect: "manual" });
if (latestSemesterRedirect.status !== 301 || latestSemesterRedirect.headers.get("location") !== "https://example.test/") {
  throw new Error("The former latest-semester route must redirect to the homepage");
}

const previousSemesterRedirect = await worker.fetch(new Request("https://example.test/2-2568"), { redirect: "manual" });
if (previousSemesterRedirect.status !== 301 || previousSemesterRedirect.headers.get("location") !== "https://example.test/2-2568/") {
  throw new Error("The previous-semester route must redirect to its trailing-slash URL");
}

console.log("Worker route checks passed");
