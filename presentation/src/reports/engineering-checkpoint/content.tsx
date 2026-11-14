import type { DeckSlide } from "../../engine/types.ts"

const release = "docs/report/aws-redeployment-main389e855-2026-11-09.md"

export const slides: DeckSlide[] = [
  {
    id: "checkpoint-cover",
    kicker: "Engineering checkpoint · 9 Nov 2026",
    title: "A release was verified. The service was not certified.",
    lede:
      "This short report records one historical AWS deployment check. It does not describe current runtime state.",
    tone: "dark",
    layout: "cover",
    blocks: [
      {
        type: "stats",
        items: [
          { value: "18 / 18", label: "Public checks passed", note: "Point-in-time verification" },
          { value: "3", label: "Services steady", note: "API, storefront, worker" },
          { value: "4", label: "Migrations applied", note: "Recommendation / personalization" },
        ],
      },
    ],
    notes: {
      say: ["Read this as dated evidence for one release, not as a live status page."],
      watch: ["The demo lease and current public availability are not established here."],
    },
    sources: [release],
  },
  {
    id: "what-checked",
    kicker: "01 · Evidence",
    title: "The checks covered access and release integrity.",
    lede:
      "The recorded checks exercised public endpoints and confirmed the expected service images reached steady state.",
    blocks: [
      {
        type: "points",
        items: [
          { term: "Public paths", text: "HTTPS, catalog/product rendering, Admin, authentication and redirects." },
          { term: "Media boundary", text: "Image byte integrity and blocked private paths." },
          { term: "Feature state", text: "Recommendations remained disabled in the cloud." },
          { term: "Release", text: "API, storefront and worker reached steady state on expected release image digests." },
        ],
      },
      {
        type: "note",
        tone: "fact",
        title: "Data preservation",
        text: "A pre-release database snapshot was available; existing commerce data was not reseeded. No restore drill was claimed.",
      },
    ],
    notes: {
      prove: ["The release report links the sanitized public check, runtime and migration evidence."],
      watch: ["Migration success does not prove browser checkout, staff fulfillment or data recovery."],
    },
    sources: [release, "docs/report/evidence/fargate-main389e855-2026-11-09/public-verification.json"],
  },
  {
    id: "what-remains",
    kicker: "02 · Limits and next gate",
    title: "Capacity, recovery and the full business journey remain open.",
    blocks: [
      {
        type: "cards",
        columns: 2,
        items: [
          { eyebrow: "Not measured", title: "Campaign load", body: "No fresh baseline, 5× peak, or saturation result." },
          { eyebrow: "Not rehearsed", title: "Recovery", body: "No application rollback or database restore drill." },
          { eyebrow: "Not walked", title: "Staff operation", body: "No acceptance evidence for fulfillment and manual COD reconciliation." },
          { eyebrow: "Not current", title: "Availability and cost", body: "No 24×7 claim and no validated monthly bill." },
        ],
      },
      {
        type: "roadmap",
        phases: [
          { phase: "Next", title: "Complete the order journey", body: "Stock receipt through delivery and COD reconciliation.", exit: "Customer and staff walkthrough with retry evidence." },
          { phase: "Then", title: "Measure and rehearse", body: "Run isolated load, rollback and restore exercises.", exit: "Publish results with limits and cost." },
        ],
      },
    ],
    notes: {
      say: ["The next evidence gate turns a successful release into a defensible operational demo."],
      watch: ["Do not promote design targets to achieved results."],
    },
    sources: [release, "docs/spec/05-testing.md", "docs/spec/07-delivery.md"],
  },
]
