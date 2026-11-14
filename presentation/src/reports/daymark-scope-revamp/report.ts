import type { DeckReport } from "../../engine/types.ts"
import { slides } from "./content.tsx"
import "./theme.css"

export const daymarkScopeRevamp: DeckReport = {
  id: "daymark-scope-revamp",
  title: "DAYMARK — Scope Revamp",
  subtitle:
    "A production-oriented MVP for one clothing brand, one warehouse and one carrier.",
  date: "14 Nov 2026",
  edition: "Course review · MVP v1",
  status: "Scope review · targets and open gaps",
  theme: "daymark",
  brand: {
    name: "DAYMARK",
    tagline: "Made for the everyday.",
    logoSrc: `${import.meta.env.BASE_URL}brand/daymark-swallow.svg`,
    logoAlt: "DAYMARK swallow mark",
  },
  slides,
}
