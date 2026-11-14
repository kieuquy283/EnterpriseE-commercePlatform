import type { DeckReport } from "../../engine/types.ts"
import { slides } from "./content.tsx"

export const weekSixDeck: DeckReport = {
  id: "daymark-week-6",
  title: "DAYMARK — Tuần 6/10",
  subtitle: "Phạm vi MVP cho thương hiệu quần áo bán trực tuyến.",
  date: "14/11/2026",
  edition: "TUẦN 6/10",
  status: "Phạm vi và kiến trúc · Tuần 6/10",
  sources: [
    "docs/spec/01-business.md",
    "docs/spec/02-flows.md",
    "docs/spec/03-architecture.md",
    "docs/spec/05-testing.md",
    "docs/spec/06-operations.md",
    "docs/spec/07-delivery.md",
  ],
  theme: "daymark",
  brand: {
    name: "DAYMARK",
    tagline: "Made for the everyday.",
    logoSrc: `${import.meta.env.BASE_URL}brand/daymark-swallow.svg`,
    logoAlt: "Biểu tượng chim én DAYMARK",
  },
  slides,
}
