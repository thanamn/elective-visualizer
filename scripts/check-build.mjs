import worker from "../dist/server/index.js";

const expectedRoutes = [
  ["/", "text/html", "CEDT Elective Explorer"],
  ["/style.css", "text/css", "--paper"],
  ["/js/app.js", "text/javascript", "FIXED_COURSES"],
  ["/elective_latest.json", "application/json", "\"courses\""],
  ["/og.png", "image/png", null],
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

console.log("Worker route checks passed");
