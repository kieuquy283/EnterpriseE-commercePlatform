# Documentation consolidation — 14 November 2026

The DAYMARK reset replaces starter/generic SRS, old week plans and superseded flow narratives with one [canonical specification](../README.md). This stage replaces documentation and adds presentation/governance tooling. The later approved swallow branding is applied to existing storefront brand surfaces; commerce logic, migrations, operational settings, schema fixtures, research rights decisions and dated test/deployment reports are preserved. Removed text remains recoverable in Git history before this change.

## Removed competing plans and replacement destinations

| Removed path | Current destination |
| --- | --- |
| `PLAN.md` | `docs/spec/07-delivery.md` |
| `docs/01_Project_Definition.md` | `docs/spec/01-business.md` |
| `docs/02_Project_Scope_and_Assumptions.md` | `docs/spec/01-business.md` |
| `docs/03_Software_Requirements_Specification.md` | `docs/spec/05-testing.md` |
| `docs/Enterprise_Ecommerce_Revised_Plan_Week_04-13.md` | `docs/spec/07-delivery.md` |
| `docs/architecture/checkout-order-sequence.md` | `docs/spec/02-flows.md` |
| `docs/architecture/cloud-system-architecture.md` | `docs/spec/03-architecture.md` |
| `docs/architecture/payment-simulator-flow.md` | `docs/spec/02-flows.md` |
| `docs/architecture/storefront-backend-boundary.md` | `docs/spec/03-architecture.md` |
| `docs/recommendation/hybrid/astra-annotation-plan.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/hybrid/phase_00_repository_baseline.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/hybrid/phase_01_simple_baseline_evaluation.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/hybrid/phase_02_image_data_readiness.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/hybrid/phase_03_visual_embeddings.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/hybrid/phase_04_hybrid_ranking_evaluation.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/hybrid/phase_05_medusa_publishing_api.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/hybrid/phase_06_pdp_integration.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/hybrid/phase_07_system_testing_release.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/hybrid/phase_08_session_tracking_optional.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/hybrid/v2_1_quality_recovery_plan.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/personalization/phase_00_baseline_feasibility.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/personalization/phase_01_identity_consent_privacy.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/personalization/phase_02_interaction_events.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/personalization/phase_03_customer_session_profiles.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/personalization/phase_04_behavioral_mvp_ranker.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/personalization/phase_05_collaborative_filtering_research.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/personalization/phase_06_serving_api_storefront.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/personalization/phase_07_evaluation_quality_gates.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/personalization/phase_08_reliability_release.md` | `docs/spec/07-delivery.md` |
| `docs/recommendation/personalization/plan.md` | `docs/spec/07-delivery.md` |
| `docs/repository-structure.md` | `README.md` |

## Retained on purpose

Dated deployment/inventory reports, raw sanitized evidence, ERD/schema exports and specialist recommendation specs/runbooks stay at their existing paths because they preserve provenance and some are referenced by executable tooling. They are indexed as references, not active product specifications. Generic source-directory README scaffolds are replaced by scoped agent rules and the task-specific AWS skill where needed, without deleting application code.

The presentation is a new npm workspace with a shared engine and report registry; the hackathon example is read-only reference and remains untouched. No live resources are changed. PR #13 was merged first at `c146068f425291e90ceb2f7fb3f5fd5ed7abb59e`.

## Validation at handover

- Documentation checker: 137 Markdown files, 472 local links and all nine requirement/flow identifiers. Ten canonical heading links were separately checked. This does not certify every historical anchor or Mermaid render.
- Presentation: TypeScript/Vite production build and 10 engine tests passed. Shared-browser review verified library-first entry, direct slide links, keyboard/control navigation, playback toggle and fullscreen. An earlier styling revision of all eight Vietnamese pages was checked at 1280×800 for content crossing the canvas/footer. Later Motion, SVG, Mermaid and typography changes passed the production build; the final styling has not had a complete eight-page browser recheck.
- Storefront branding: type check and production build passed; lint had zero errors and 18 existing warnings. This is not a new browser checkout or staff acceptance result.
- Workspace dependency install succeeded in the Docker build context, including the presentation workspace and shared npm lockfile. Approved SVG logo copies have matching checksums.
- No backend business logic, migrations, cloud resources or deployed runtime changed. Source branding is not a live release. The reference hackathon project's source was not modified.

Final presentation scope follows team feedback: one registered Vietnamese deck (eight pages), direct business/architecture content, no retrospective/redo narrative or speaker-note/help/overview features. Previous English report sources are unregistered references. Local preview: `npm run presentation:dev`, default localhost:5173. Changes remain on `docs/daymark-specification` for review; this stage did not create/push a new PR.
