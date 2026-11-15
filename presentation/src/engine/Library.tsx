import { SlideView } from "./SlideView.tsx"
import type { DeckRegistry } from "./registry.ts"
import type { DeckReport } from "./types.ts"

function ReportCard({
  report,
  onOpen,
}: {
  report: DeckReport
  onOpen: (reportId: string) => void
}) {
  const cover = report.slides[0]
  if (!cover) return null

  return (
    <article className="library-card">
      <div className="library-card__preview" aria-hidden="true">
        <SlideView
          report={report}
          slide={cover}
          index={0}
          count={report.slides.length}
          chrome={false}
        />
        <span className="library-card__preview-label">Xem trước</span>
      </div>
      <div className="library-card__body">
        <div className="library-card__meta">
          <span>{report.date}</span>
          <span>{String(report.slides.length).padStart(2, "0")} trang</span>
        </div>
        <h2>{report.title}</h2>
        {report.subtitle ? <p>{report.subtitle}</p> : null}
        <div className="library-card__bottom">
          <span className="library-card__status">{report.status ?? report.edition ?? "Presentation"}</span>
          <button type="button" onClick={() => onOpen(report.id)}>
            Mở trình bày <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </article>
  )
}

export function Library({
  registry,
  onOpen,
}: {
  registry: DeckRegistry
  onOpen: (reportId: string) => void
}) {
  return (
    <main className="presentation-library">
      <div className="library-wrap">
        <header className="library-header">
          <div className="library-brand">
            {registry.defaultReport.brand.logoSrc ? (
              <img
                src={registry.defaultReport.brand.logoSrc}
                alt={registry.defaultReport.brand.logoAlt ?? ""}
              />
            ) : null}
            <span>{registry.defaultReport.brand.name}</span>
          </div>
          <span className="library-header__label">Thư viện thuyết trình</span>
        </header>
        <section className="library-intro" aria-labelledby="library-title">
          <p className="library-eyebrow">{registry.defaultReport.brand.name}</p>
          <h1 id="library-title">Các bài trình bày.</h1>
          <p className="library-intro__text">
            Chọn bài để bắt đầu.
          </p>
        </section>
        <section className="library-list" aria-label="Các bài trình bày">
          {registry.reports.map((report) => (
            <ReportCard key={report.id} report={report} onOpen={onOpen} />
          ))}
        </section>
        <footer className="library-footer">
          <span>{registry.defaultReport.brand.name} · {registry.defaultReport.brand.tagline}</span>
          <span>{registry.reports.length} bản trình bày</span>
        </footer>
      </div>
    </main>
  )
}
