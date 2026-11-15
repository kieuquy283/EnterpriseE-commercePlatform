import assert from "node:assert/strict"
import test from "node:test"
import { createRegistry } from "./registry.ts"

function report(id, slideIds) {
  return {
    id,
    title: id,
    date: "2026-11-14",
    theme: "daymark",
    brand: { name: "DAYMARK" },
    slides: slideIds.map((slideId) => ({
      id: slideId,
      kicker: "Section",
      title: slideId,
      blocks: [],
    })),
  }
}

test("registry exposes ids, default report and slide counts", () => {
  const registry = createRegistry([
    report("alpha", ["one", "two"]),
    report("beta", ["three"]),
  ])
  assert.equal(registry.defaultReportId, "alpha")
  assert.equal(registry.defaultReport.title, "alpha")
  assert.deepEqual(registry.ids, ["alpha", "beta"])
  assert.equal(registry.slideCount("alpha"), 2)
  assert.equal(registry.slideCount("beta"), 1)
  assert.equal(registry.slideCount("missing"), 0)
  assert.equal(registry.titleOf("missing"), "missing")
  assert.equal(registry.get("beta")?.title, "beta")
})

test("registry rejects empty, duplicate and unusable reports", () => {
  assert.throws(() => createRegistry([]), /at least one report/)
  assert.throws(
    () => createRegistry([report("alpha", ["one"]), report("alpha", ["two"])]),
    /Duplicate report id/,
  )
  assert.throws(() => createRegistry([report("alpha", [])]), /has no slides/)
  assert.throws(
    () => createRegistry([report("alpha", ["one", "one"])]),
    /Duplicate slide id/,
  )
  assert.throws(
    () =>
      createRegistry([
        {
          ...report("alpha", ["one"]),
          slides: [{ id: " ", kicker: "x", title: "x", blocks: [] }],
        },
      ]),
    /slide without an id/,
  )
})
