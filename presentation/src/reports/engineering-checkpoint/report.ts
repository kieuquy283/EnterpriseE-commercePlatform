import type { DeckReport } from "../../engine/types.ts"
import { slides } from "./content.tsx"

export const engineeringCheckpoint: DeckReport = {
  id: "engineering-checkpoint",
  title: "Engineering checkpoint",
  subtitle: "A dated deployment snapshot and the work it does not certify.",
  date: "9 Nov 2026",
  edition: "Historical evidence · AWS release",
  status: "Historical checkpoint · 9 Nov 2026",
  theme: "daymark",
  brand: {
    name: "DAYMARK",
    tagline: "Made for the everyday.",
    logoSrc: `${import.meta.env.BASE_URL}brand/daymark-swallow.svg`,
    logoAlt: "DAYMARK swallow mark",
  },
  slides,
}
