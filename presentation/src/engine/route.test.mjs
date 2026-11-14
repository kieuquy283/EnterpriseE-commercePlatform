import assert from "node:assert/strict"
import test from "node:test"
import { clampSlide, formatHash, parseHash } from "./route.ts"

const index = {
  ids: ["daymark-week-6"],
  defaultReportId: "daymark-week-6",
  slideCount: () => 8,
}

test("formatHash writes a one-based report and slide route", () => {
  assert.equal(formatHash("daymark-week-6", 0), "#/daymark-week-6/1")
  assert.equal(formatHash("daymark-week-6", 7), "#/daymark-week-6/8")
})

test("root hash selects the library while a report hash selects its slide", () => {
  assert.equal(parseHash("#/", index).status, "empty")
  assert.equal(parseHash("", index).status, "empty")
  assert.deepEqual(parseHash("#/daymark-week-6/1", index), {
    reportId: "daymark-week-6",
    slideIndex: 0,
    status: "ok",
  })
})

test("direct routes clamp unsupported slides and unknown reports safely", () => {
  assert.equal(parseHash("#/daymark-week-6/80", index).slideIndex, 7)
  assert.equal(parseHash("#/daymark-week-6/80", index).status, "unknown-slide")
  assert.equal(parseHash("#/missing/4", index).status, "unknown-report")
})

test("clampSlide bounds slide indexes", () => {
  assert.equal(clampSlide(-2, 5), 0)
  assert.equal(clampSlide(2.8, 5), 2)
  assert.equal(clampSlide(50, 5), 4)
  assert.equal(clampSlide(Number.NaN, 5), 0)
  assert.equal(clampSlide(3, 0), 0)
})
