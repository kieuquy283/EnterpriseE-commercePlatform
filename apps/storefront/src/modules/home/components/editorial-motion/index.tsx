"use client"

import { useAnimate, useInView, useReducedMotion, stagger } from "motion/react"
import { useEffect, type ReactNode } from "react"

/** Home copy settles horizontally; server output and controls stay visible. */
export function ApproachMotion({ children }: { children: ReactNode }) {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const visible = useInView(scope, { once: true, amount: 0.35 })
  const reduced = useReducedMotion()
  useEffect(() => {
    if (!visible || reduced) return
    const title = animate(
      "[data-approach-title]",
      { x: [-18, 0] },
      { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
    )
    const copy = animate(
      "[data-approach-copy]",
      { x: [12, 0] },
      { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    )
    return () => {
      title.stop()
      copy.stop()
    }
  }, [visible, reduced, animate])
  return <div ref={scope}>{children}</div>
}

/** Collection photographs settle within their frames, once, without moving links. */
export function CollectionMotion({ children }: { children: ReactNode }) {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const visible = useInView(scope, { once: true, amount: 0.15 })
  const reduced = useReducedMotion()
  useEffect(() => {
    if (!visible || reduced) return
    const images = animate(
      "[data-collection-image] img",
      { scale: [1.045, 1] },
      { duration: 1.1, delay: stagger(0.09), ease: [0.22, 1, 0.36, 1] },
    )
    return () => images.stop()
  }, [visible, reduced, animate])
  return <div ref={scope}>{children}</div>
}
