import type { DeckReport } from "./types.ts"
import type { DeckIndex } from "./route.ts"

export interface DeckRegistry extends DeckIndex {
  reports: readonly DeckReport[]
  defaultReport: DeckReport
  get: (reportId: string) => DeckReport | undefined
  titleOf: (reportId: string) => string
}

export function createRegistry(reports: readonly DeckReport[]): DeckRegistry {
  if (reports.length === 0) {
    throw new Error("A deck registry needs at least one report.")
  }

  const byId = new Map<string, DeckReport>()
  for (const report of reports) {
    if (!report.id.trim()) {
      throw new Error("Report ids cannot be empty.")
    }
    if (byId.has(report.id)) {
      throw new Error(`Duplicate report id: ${report.id}`)
    }
    if (report.slides.length === 0) {
      throw new Error(`Report ${report.id} has no slides.`)
    }
    const slideIds = new Set<string>()
    for (const slide of report.slides) {
      if (!slide.id.trim()) {
        throw new Error(`Report ${report.id} has a slide without an id.`)
      }
      if (slideIds.has(slide.id)) {
        throw new Error(`Duplicate slide id in ${report.id}: ${slide.id}`)
      }
      slideIds.add(slide.id)
    }
    byId.set(report.id, report)
  }

  const defaultReport = reports[0]
  if (!defaultReport) {
    throw new Error("A deck registry needs a default report.")
  }

  return {
    reports,
    ids: reports.map((report) => report.id),
    defaultReportId: defaultReport.id,
    defaultReport,
    slideCount: (reportId) => byId.get(reportId)?.slides.length ?? 0,
    get: (reportId) => byId.get(reportId),
    titleOf: (reportId) => byId.get(reportId)?.title ?? reportId,
  }
}
