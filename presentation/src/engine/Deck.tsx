import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { frameVariants } from "./choreography.tsx"
import { Icon, type IconName } from "./icons.tsx"
import { Library } from "./Library.tsx"
import { SlideView } from "./SlideView.tsx"
import type { DeckRegistry } from "./registry.ts"
import { useDeck } from "./useDeck.ts"

function Control({
  label,
  icon,
  onClick,
  disabled = false,
  pressed,
}: {
  label: string
  icon: IconName
  onClick: () => void
  disabled?: boolean
  pressed?: boolean
}) {
  return (
    <button
      type="button"
      className="presenter-control"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      disabled={disabled}
    >
      <Icon name={icon} size={18} />
    </button>
  )
}

export function Deck({ registry }: { registry: DeckRegistry }) {
  const deck = useDeck(registry)
  const isFirst = deck.slideIndex === 0
  const isLast = deck.slideIndex === deck.count - 1
  const reduced = useReducedMotion()

  if (deck.view === "library") {
    return (
      <div key="library" className="deck-shell deck-shell--library" ref={deck.shellRef}>
        <Library registry={registry} onOpen={deck.goToReport} />
      </div>
    )
  }

  return (
    <div key="presenter" className="deck-shell deck-shell--presenter" ref={deck.shellRef}>
      <main className="presenter-stage" id="presenter-stage">
        <AnimatePresence initial={false} custom={deck.direction}>
          <motion.div
            className="presenter-canvas"
            key={`${deck.report.id}:${deck.slide.id}`}
            custom={deck.direction}
            variants={frameVariants(deck.slide.choreography ?? "rise", Boolean(reduced))}
            initial="enter" animate="center" exit="exit"
          >
            <SlideView report={deck.report} slide={deck.slide} index={deck.slideIndex} count={deck.count} />
          </motion.div>
        </AnimatePresence>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          Trang {deck.slideIndex + 1} trên {deck.count}: {deck.slide.title.replace("\n", " ")}
        </p>
      </main>

      <div className="dock-zone" tabIndex={0} aria-label="Điều khiển ở cạnh dưới">
        <section className="presenter-dock" aria-label="Điều khiển trình bày">
          <nav className="slide-strip" aria-label="Các trang trình bày">
            {deck.report.slides.map((slide, index) => (
              <button
                type="button"
                key={slide.id}
                className="slide-thumb"
                aria-current={index === deck.slideIndex ? "step" : undefined}
                aria-label={`Trang ${index + 1}: ${slide.title.replace("\n", " ")}`}
                onClick={() => deck.goToSlide(index)}
              >
                <span className="slide-thumb__image" aria-hidden="true">
                  <SlideView
                    report={deck.report}
                    slide={slide}
                    index={index}
                    count={deck.count}
                    chrome={false}
                  />
                </span>
                <span className="slide-thumb__caption">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {slide.kicker}
                </span>
              </button>
            ))}
          </nav>
          <div className="presenter-toolbar">
            <button
              type="button"
              className="presenter-library"
              onClick={deck.goToLibrary}
              aria-label="Quay lại thư viện"
            >
              <Icon name="library" size={18} />
              <span>Thư viện</span>
            </button>
            <div className="presenter-toolbar__actions">
              <Control label="Trang trước" icon="prev" onClick={deck.prev} disabled={isFirst} />
              <span className="presenter-counter" aria-live="polite">
                {String(deck.slideIndex + 1).padStart(2, "0")} / {String(deck.count).padStart(2, "0")}
              </span>
              <Control label="Trang tiếp" icon="next" onClick={deck.next} disabled={isLast} />
              <Control
                label={deck.playing ? "Tạm dừng" : "Tự động chuyển mỗi 30 giây"}
                icon={deck.playing ? "pause" : "play"}
                onClick={deck.togglePlayback}
                pressed={deck.playing}
                disabled={isLast && !deck.playing}
              />
              <Control
                label={deck.isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                icon="expand"
                onClick={deck.toggleFullscreen}
                pressed={deck.isFullscreen}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
