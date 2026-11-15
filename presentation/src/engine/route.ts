export interface DeckIndex {
  ids: readonly string[]
  defaultReportId: string
  slideCount: (reportId: string) => number
}

export type RouteStatus = "ok" | "empty" | "unknown-report" | "unknown-slide"

export interface DeckRoute {
  reportId: string
  slideIndex: number
  status: RouteStatus
  requestedReportId?: string
}

export function clampSlide(index: number, count: number): number {
  if (!Number.isFinite(index)) return 0
  const last = Math.max(0, count - 1)
  return Math.min(Math.max(0, Math.trunc(index)), last)
}

export function formatHash(reportId: string, slideIndex: number): string {
  return `#/${encodeURIComponent(reportId)}/${Math.trunc(slideIndex) + 1}`
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * Parses `#/<report>/<slide>` (1-based slide). A bare `#/<slide>` targets the
 * default report. Unknown reports fall back to the default report, unknown or
 * out-of-range slides are clamped, and both cases are reported through status.
 */
export function parseHash(hash: string, index: DeckIndex): DeckRoute {
  const raw = hash
    .replace(/^#/, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .split("?")[0]
    ?.trim()

  if (!raw) {
    return { reportId: index.defaultReportId, slideIndex: 0, status: "empty" }
  }

  const segments = raw.split("/")
  const first = segments[0] ?? ""
  const second = segments[1]

  const firstIsSlideNumber = /^-?\d+$/.test(first)
  const requestedReportId = firstIsSlideNumber
    ? index.defaultReportId
    : safeDecode(first)
  const slidePart = firstIsSlideNumber ? first : second

  const reportExists = index.ids.includes(requestedReportId)
  const reportId = reportExists ? requestedReportId : index.defaultReportId
  const count = index.slideCount(reportId)

  if (!reportExists) {
    return {
      reportId,
      slideIndex: 0,
      status: "unknown-report",
      requestedReportId,
    }
  }

  if (slidePart === undefined || slidePart === "") {
    return { reportId, slideIndex: 0, status: "ok" }
  }

  const parsed = Number.parseInt(slidePart, 10)
  if (!Number.isFinite(parsed)) {
    return { reportId, slideIndex: 0, status: "unknown-slide" }
  }

  const slideIndex = clampSlide(parsed - 1, count)
  return {
    reportId,
    slideIndex,
    status: parsed - 1 === slideIndex ? "ok" : "unknown-slide",
  }
}
