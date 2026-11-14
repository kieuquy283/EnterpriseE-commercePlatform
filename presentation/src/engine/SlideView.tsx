import { motion, useReducedMotion } from "motion/react"
import { SlideMotionContext, useSlideMotion } from "./choreography.tsx"
import { BlockView } from "./BlockView.tsx"
import { Wordmark } from "./Wordmark.tsx"
import type { DeckReport, DeckSlide } from "./types.ts"

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

function AnimatedSlide({
  report,
  slide,
  index,
  count,
  chrome = true,
}: {
  report: DeckReport
  slide: DeckSlide
  index: number
  count: number
  chrome?: boolean
}) {
  const titleMotion = useSlideMotion("title")
  const ledeMotion = useSlideMotion("lede")
  const isCover = slide.layout === "cover"
  const isSection = slide.layout === "section"
  const layoutClass = isCover
    ? "slide--cover"
    : isSection
      ? "slide--section"
      : "slide--default"

  return (
    <article
      className={`slide ${layoutClass}${chrome ? "" : " slide--preview"}${
        slide.title.length > 68 ? " slide--long-title" : ""
      }`}
      data-slide-id={slide.id}
      data-theme={report.theme}
      data-tone={slide.tone ?? "light"}
      aria-label={`Slide ${index + 1} of ${count}: ${slide.title}`}
    >
      <div className="slide-inner">
      {chrome ? (
        <header className="slide-head">
          <span className="slide-brand"><Wordmark brand={report.brand} /></span>
          <span className="slide-section">{slide.kicker}</span>
          <span className="slide-edition">{report.edition ?? report.date}</span>
        </header>
      ) : null}

      {isCover ? (
        <div className="cover-body">
          <motion.h1 className="cover-title" {...titleMotion}>{slide.title}</motion.h1>
          {slide.lede ? <motion.p className="cover-lede" {...ledeMotion}>{slide.lede}</motion.p> : null}
          <div className="slide-body">
            {slide.blocks.map((block, blockIndex) => (
              <BlockView key={blockIndex} block={block} />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="slide-titleblock">
            <motion.h1 className="slide-title" {...titleMotion}>{slide.title}</motion.h1>
            {slide.lede ? <motion.p className="slide-lede" {...ledeMotion}>{slide.lede}</motion.p> : null}
          </div>
          <div className="slide-body">
            {slide.blocks.map((block, blockIndex) => (
              <BlockView key={blockIndex} block={block} />
            ))}
          </div>
        </>
      )}

      {chrome ? (
        <footer className="slide-foot">
          <span>{report.brand.tagline ?? report.brand.name}</span>
          <span>
            Trang {pad(index + 1)}
          </span>
        </footer>
      ) : null}
      </div>
    </article>
  )
}

export function SlideView(props: { report: DeckReport; slide: DeckSlide; index: number; count: number; chrome?: boolean }) {
  const reduced = useReducedMotion()
  return (
    <SlideMotionContext.Provider value={{ enabled: props.chrome !== false && !reduced, preset: props.slide.choreography ?? "rise" }}>
      <AnimatedSlide {...props} />
    </SlideMotionContext.Provider>
  )
}
