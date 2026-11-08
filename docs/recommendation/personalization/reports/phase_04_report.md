# Phase 04 — Behavioral ranker

**2026-11-07 · PARTIAL.** Added bounded `rankForYou`: combine metadata V1 item neighbors from the existing versioned candidate store with a small popularity prior; exclude source products, deduplicate and sort deterministically. The weights 0.85/0.15 and event weights 1/2/5 are pilot hypotheses, **not measured optimums**. No V2 image embeddings, H&M customer identities or online ML service are used.

Unit tests show distinct shirt/dress histories lead to distinct first recommendations and canceled order signals do not contribute. The HTTP integration test with two authenticated synthetic customers and fixture Medusa products passed; both received different top results. The same test activated a fixture V2 hybrid candidate run and confirmed `/for-you` returned generic (`personalized:false`), then restored the V1 run. Returned products pass the existing Medusa Store product resolver and saleability projection. Backend unit suite 43/43, typecheck, lint and build passed.

**Unmet:** quality evaluation against a temporal popularity baseline, rank-weight calibration, per-category harms, production load/capacity and testing with a real 500-product active V1 run. The audited `commerce` DB has no candidate run; the fixture test does not establish real-catalog accuracy.

Rollback: disable personalized serving; Home continues with the existing generic recommendation section.
