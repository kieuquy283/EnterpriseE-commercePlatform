import assert from "node:assert/strict"
import test from "node:test"
import { nextPlaybackIndex, PLAYBACK_INTERVAL_MS } from "./playback.ts"

test("playback advances every 30 seconds and stops at the end", () => {
  assert.equal(PLAYBACK_INTERVAL_MS, 30_000)
  assert.equal(nextPlaybackIndex(0, 3), 1)
  assert.equal(nextPlaybackIndex(1, 3), 2)
  assert.equal(nextPlaybackIndex(2, 3), null)
})

test("playback handles empty and negative positions safely", () => {
  assert.equal(nextPlaybackIndex(0, 0), null)
  assert.equal(nextPlaybackIndex(-4, 3), 1)
})
