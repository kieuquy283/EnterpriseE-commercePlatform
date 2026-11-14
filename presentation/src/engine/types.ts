import type { Choreography } from "./choreography.tsx"
import type { ReactNode } from "react"

export type SlideTone = "light" | "dark" | "accent"

export type SlideLayout = "default" | "cover" | "section"

export type BadgeTone = "verified" | "target" | "proposed" | "gap" | "info"

export interface Badge {
  label: string
  tone?: BadgeTone
}

export interface CardItem {
  eyebrow?: string
  title: string
  body?: string
  meta?: string
  badge?: Badge
}

export interface PointItem {
  term?: string
  text: string
}

export interface TableCell {
  text: string
  badge?: Badge
}

export type TableRow = Array<string | TableCell>

export interface FlowStep {
  label: string
  title: string
  detail?: string
}

export interface StatItem {
  value: string
  unit?: string
  label: string
  note?: string
}

export interface RoadmapPhase {
  phase: string
  title: string
  body: string
  exit: string
  status?: Badge
}

export type SlideBlock =
  | { type: "diagram"; definition: string; label: string }
  | { type: "text"; paragraphs: string[]; caption?: string }
  | { type: "points"; items: PointItem[]; numbered?: boolean; caption?: string }
  | {
      type: "cards"
      items: CardItem[]
      columns?: 2 | 3 | 4
      dense?: boolean
      caption?: string
    }
  | {
      type: "split"
      left: SlideBlock[]
      right: SlideBlock[]
      ratio?: "1:1" | "2:1" | "1:2"
      caption?: string
    }
  | {
      type: "grid"
      blocks: SlideBlock[]
      columns?: 2 | 3
      caption?: string
    }
  | {
      type: "table"
      head: string[]
      rows: TableRow[]
      compact?: boolean
      caption?: string
    }
  | {
      type: "flow"
      steps: FlowStep[]
      dense?: boolean
      caption?: string
    }
  | { type: "figure"; render: () => ReactNode; caption?: string }
  | { type: "code"; title?: string; lines: string[]; caption?: string }
  | { type: "stats"; items: StatItem[]; caption?: string }
  | {
      type: "note"
      title?: string
      text: string
      tone?: "info" | "warn" | "fact"
      caption?: string
    }
  | { type: "roadmap"; phases: RoadmapPhase[]; caption?: string }

export interface SlideNotes {
  say?: string[]
  prove?: string[]
  watch?: string[]
}

export interface DeckSlide {
  choreography?: Choreography
  id: string
  kicker: string
  title: string
  lede?: string
  tone?: SlideTone
  layout?: SlideLayout
  blocks: SlideBlock[]
  notes?: SlideNotes
  sources?: string[]
}

export interface DeckBrand {
  name: string
  split?: [string, string]
  tagline?: string
  logoSrc?: string
  logoAlt?: string
}

export interface DeckReport {
  id: string
  title: string
  subtitle?: string
  date: string
  edition?: string
  status?: string
  sources?: string[]
  theme: string
  brand: DeckBrand
  slides: DeckSlide[]
}
