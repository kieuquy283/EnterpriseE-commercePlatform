import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { DeckRegistry } from "./registry.ts"
import { clampSlide, formatHash, parseHash, type DeckRoute } from "./route.ts"
import { nextPlaybackIndex, PLAYBACK_INTERVAL_MS } from "./playback.ts"
import { resolveKeyAction } from "./keyboard.ts"

export type DeckView = "library" | "deck"

function keyTarget(event: KeyboardEvent) {
  const target = event.target
  if (!(target instanceof Element)) return { editable: false, buttonFocused: false }
  return {
    editable: Boolean(target.closest("input,textarea,select,[contenteditable='true']")),
    buttonFocused: Boolean(target.closest("button,a[href],[role='button']")),
  }
}

function initialRoute(registry: DeckRegistry): DeckRoute {
  return parseHash(window.location.hash, registry)
}

function initialView(registry: DeckRegistry): DeckView {
  return parseHash(window.location.hash, registry).status === "empty"
    ? "library"
    : "deck"
}

export function useDeck(registry: DeckRegistry) {
  const [route, setRoute] = useState<DeckRoute>(() => initialRoute(registry))
  const [view, setView] = useState<DeckView>(() => initialView(registry))
  const [direction, setDirection] = useState<"forward" | "backward">("forward")
  const [playing, setPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const shellRef = useRef<HTMLDivElement>(null)

  const report = registry.get(route.reportId) ?? registry.defaultReport
  const count = report.slides.length
  const slideIndex = clampSlide(route.slideIndex, count)
  const slide = report.slides[slideIndex] ?? report.slides[0]!

  const navigate = useCallback(
    (reportId: string, index: number, push = false) => {
      const targetReport = registry.get(reportId) ?? registry.defaultReport
      const targetIndex = clampSlide(index, targetReport.slides.length)
      const hash = formatHash(targetReport.id, targetIndex)
      setDirection(
        targetReport.id !== route.reportId || targetIndex >= route.slideIndex
          ? "forward"
          : "backward",
      )
      if (window.location.hash !== hash) {
        if (push) window.history.pushState(null, "", hash)
        else window.history.replaceState(null, "", hash)
      }
      setRoute({ reportId: targetReport.id, slideIndex: targetIndex, status: "ok" })
      setView("deck")
    },
    [registry, route.reportId, route.slideIndex],
  )

  const goToReport = useCallback(
    (reportId: string) => navigate(reportId, 0, true),
    [navigate],
  )

  const goToLibrary = useCallback(() => {
    if (window.location.hash !== "#/") window.history.pushState(null, "", "#/")
    setView("library")
    setPlaying(false)
  }, [])

  const goToSlide = useCallback(
    (index: number) => navigate(report.id, index),
    [navigate, report.id],
  )
  const next = useCallback(() => goToSlide(slideIndex + 1), [goToSlide, slideIndex])
  const prev = useCallback(() => goToSlide(slideIndex - 1), [goToSlide, slideIndex])

  const togglePlayback = useCallback(() => {
    setPlaying((active) =>
      active ? false : nextPlaybackIndex(slideIndex, count) !== null,
    )
  }, [slideIndex, count])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined)
      return
    }
    void (shellRef.current ?? document.documentElement)
      .requestFullscreen()
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange)
  }, [])

  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, "", "#/")
  }, [])

  useEffect(() => {
    const sync = () => {
      const parsed = parseHash(window.location.hash, registry)
      setDirection(parsed.slideIndex < route.slideIndex ? "backward" : "forward")
      setRoute(parsed)
      setView(parsed.status === "empty" ? "library" : "deck")
      setPlaying(false)
    }
    window.addEventListener("hashchange", sync)
    window.addEventListener("popstate", sync)
    return () => {
      window.removeEventListener("hashchange", sync)
      window.removeEventListener("popstate", sync)
    }
  }, [registry, route.slideIndex])

  useEffect(() => {
    document.title = view === "library"
      ? `Thư viện trình bày · ${registry.defaultReport.brand.name}`
      : `${slide.title.replace("\n", " ")} · ${report.title}`
  }, [view, slide.title, report.title, registry])

  useEffect(() => {
    if (!playing || view !== "deck") return
    const target = nextPlaybackIndex(slideIndex, count)
    if (target === null) {
      setPlaying(false)
      return
    }
    const timer = window.setTimeout(() => navigate(report.id, target), PLAYBACK_INTERVAL_MS)
    return () => window.clearTimeout(timer)
  }, [playing, view, slideIndex, count, navigate, report.id])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (view !== "deck") return
      const action = resolveKeyAction(
        {
          key: event.key,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          altKey: event.altKey,
        },
        keyTarget(event),
      )
      if (!action) return
      event.preventDefault()
      if (action === "next") next()
      else if (action === "prev") prev()
      else if (action === "first") goToSlide(0)
      else if (action === "last") goToSlide(count - 1)
      else togglePlayback()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [view, next, prev, goToSlide, count, togglePlayback])

  const progress = useMemo(() => (slideIndex + 1) / count, [slideIndex, count])

  return {
    route,
    view,
    direction,
    report,
    slide,
    slideIndex,
    count,
    progress,
    shellRef,
    playing,
    isFullscreen,
    togglePlayback,
    toggleFullscreen,
    goToReport,
    goToLibrary,
    goToSlide,
    next,
    prev,
  }
}
