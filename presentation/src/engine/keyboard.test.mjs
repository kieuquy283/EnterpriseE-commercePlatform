import assert from "node:assert/strict"
import test from "node:test"
import { resolveKeyAction } from "./keyboard.ts"

const context = { editable: false, buttonFocused: false }

test("reference presentation keys advance, reverse, jump and play", () => {
  assert.equal(resolveKeyAction({ key: "ArrowRight" }, context), "next")
  assert.equal(resolveKeyAction({ key: "Enter" }, context), "next")
  assert.equal(resolveKeyAction({ key: "ArrowLeft" }, context), "prev")
  assert.equal(resolveKeyAction({ key: "Home" }, context), "first")
  assert.equal(resolveKeyAction({ key: "End" }, context), "last")
  assert.equal(resolveKeyAction({ key: " " }, context), "play")
})

test("native controls, editable fields and modified shortcuts keep browser behavior", () => {
  assert.equal(resolveKeyAction({ key: "Enter" }, { ...context, buttonFocused: true }), null)
  assert.equal(resolveKeyAction({ key: " " }, { ...context, buttonFocused: true }), null)
  assert.equal(resolveKeyAction({ key: "ArrowLeft" }, { ...context, editable: true }), null)
  assert.equal(resolveKeyAction({ key: "ArrowLeft", metaKey: true }, context), null)
  assert.equal(resolveKeyAction({ key: "f" }, context), null)
})
