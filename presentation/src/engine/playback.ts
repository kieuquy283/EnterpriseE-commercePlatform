export const PLAYBACK_INTERVAL_MS = 30_000

export function nextPlaybackIndex(index: number, count: number): number | null {
  if (count <= 0 || index >= count - 1) return null
  return Math.max(0, Math.trunc(index)) + 1
}
