import { createContext, useContext } from "react"
import type { Variants } from "motion/react"

export type Choreography = "cover" | "rise" | "steps" | "journey" | "diagram" | "compare" | "metrics" | "closing"
export const SlideMotionContext = createContext<{ enabled: boolean; preset: Choreography }>({ enabled: false, preset: "rise" })
const ease: [number, number, number, number] = [.22, 1, .36, 1]

const titleStart = {
  cover: { opacity: 0, y: 30, filter: "blur(5px)" },
  rise: { opacity: 0, y: 32 },
  steps: { opacity: 1, y: 14, clipPath: "inset(0 0 100% 0)" },
  journey: { opacity: 0, x: -36 },
  diagram: { opacity: 0, y: -16 },
  compare: { opacity: 0, x: -28 },
  metrics: { opacity: 0, scale: .97, filter: "blur(3px)" },
  closing: { opacity: 0, y: 16, filter: "blur(7px)" },
}

export function useSlideMotion(role: "title" | "lede" | "item" = "item", index = 0) {
  const { enabled, preset } = useContext(SlideMotionContext)
  const start = role === "title" ? titleStart[preset]
    : role === "lede" ? { opacity: 0, y: 14 }
    : preset === "compare" ? { opacity: 0, x: index % 2 ? 28 : -28 }
    : preset === "journey" ? { opacity: 0, x: 24, y: 12 }
    : preset === "metrics" ? { opacity: 0, scale: .94, y: 12 }
    : preset === "diagram" ? { opacity: 0, y: 10 }
    : { opacity: 0, y: 28 }
  const variants: Variants = {
    hidden: start,
    visible: {
      opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)", clipPath: "inset(-5% -2%)",
      transition: { duration: role === "title" ? .8 : .65, ease,
        delay: role === "title" ? .1 : role === "lede" ? .24 : .32 + index * (preset === "journey" ? .09 : .15) },
    },
  }
  return { initial: enabled ? "hidden" as const : false as const, animate: "visible", variants: enabled ? variants : undefined }
}

export function frameVariants(preset: Choreography, reduced: boolean): Variants {
  if (reduced) return { enter: { opacity: 1 }, center: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0 } } }
  return {
    enter: (direction: "forward" | "backward") => {
      const sign = direction === "forward" ? 1 : -1
      if (preset === "diagram") return { opacity: 0, scale: .97 }
      if (preset === "closing") return { opacity: 0, y: 16, filter: "blur(8px)" }
      if (preset === "cover") return { opacity: 0, y: 20 }
      if (preset === "steps") return { opacity: 0, y: `${sign * 35}%` }
      if (preset === "metrics") return { opacity: 0, y: `${sign * 12}%` }
      return { x: `${sign * (preset === "compare" ? 65 : 100)}%`, opacity: preset === "compare" ? 0 : 1 }
    },
    center: { x: 0, y: 0, scale: 1, opacity: 1, filter: "blur(0px)", transition: { duration: .65, ease } },
    exit: (direction: "forward" | "backward") => ({
      x: `${direction === "forward" ? -100 : 100}%`, opacity: .15,
      transition: { duration: .65, ease },
    }),
  }
}
