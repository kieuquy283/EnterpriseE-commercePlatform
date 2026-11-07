# Phase 02 — Implementation & Verification Report

- Date/time + timezone: 2026-11-04, Asia/Saigon
- Branch / commit SHA / working tree: recommendation / de9b437f613d9cff300428f5e6e6161ed441ad62 + local implementation, not committed.
- Environment: Windows; Python 3.10.11; private local H&M CSV.
- Phase verdict: PASS
- Scope & inputs: verified Phase 01 mapping; product-level aggregate popularity only.

## Implemented changes

| File | Change | Reason |
| --- | --- | --- |
| scripts/hm/build-mvp-candidates.py | Stream counts, temporal evaluation, variant aggregation, versioned serving artifacts and provenance manifest | Avoid leakage and keep shared catalog |
| scripts/hm/tests/test_mvp_candidates.py | Future-only product test, multi-variant aggregation, deterministic repeat, ranking cap | Test actual failure risks |
| evidence/offline-verification.json | Full-data repeat hashes and structural checks | Reproducibility evidence without raw records |

## Acceptance criteria & evidence

| Criterion | Expected | Actual | Status | Evidence path |
| --- | --- | --- | --- | --- |
| Mapping | All targets in verified universe | All 100 Home and 5794 independently prepared Similar rows verified | PASS | ../evidence/offline-verification.json |
| Leakage | Train-only evaluation | Train <=2020-09-08; validation 09-09..15; test 09-16..22; fixture proves future-only product excluded from train ranking | PASS | test_train_only_and_reproducible_artifacts |
| Aggregation | Variants grouped to product | Fixture asserts two article variants contribute score=2 to one product | PASS | same test |
| Determinism | Same rank/hash | Two full-data runs have identical Home/Similar SHA256 | PASS | ../evidence/offline-verification.json |
| Metrics | Declared unit and baseline | Purchase-event micro recall@12 at product level; figures below | PASS | local popularity-evaluation.json |
| Pool | <=100 Home | 100 ranked products; no duplicates; continuous ranks | PASS | structural verification |
| Privacy | No customer identifiers retained | Reader uses only article/date for aggregation; outputs no customer IDs | PASS | code review |

Validation: 4736 held-out purchase events; popularity recall@12 0.4434121622 versus catalog order 0.0430743243. Test: 4112 purchase events; popularity 0.4294747082 versus catalog order 0.0325875486. This is **not customer MAP@12**, article-level Kaggle MAP, CTR or conversion. Evaluation is conditional on selected pilot catalog; no claim about full H&M assortment or new shoppers.

## Commands actually executed

| Command | Exit code | Result summary | Evidence |
| --- | --- | --- | --- |
| python scripts/hm/build-mvp-candidates.py (two runs) | 0, 0 | Same candidates and metrics | Local artifacts + verification JSON |
| python -m unittest discover -s scripts/hm/tests -v | 0 | 6 tests pass, 0 fail, 0 skipped | Tool output |
| python -m compileall -q scripts/hm | 0 | Compilation succeeds | Tool output |
| Read-only Python artifact validation | 0 | Rank/score/cap/unique/self/mapping/hash checks pass | ../evidence/offline-verification.json |

## Tests & review

Serving counts use all allowed historical records; held-out metrics use train ranking exclusively. A source-hashed manifest records input hashes, generator commit and generator source hash (uncommitted generator is explicitly distinguished from baseline commit). No customer-level metrics computed. Exact split and pilot selection are documented in spec execution clarifications. Manifest uses deterministic content rather than adding wall-clock timestamps to candidate files.

## Risks, deviations & blockers

One shared MVP generator replaces the two planned new scripts; legacy scripts unchanged. Pilot is lexicographic, not representative. No region/channel/current-stock filtering offline: that remains a mandatory online Medusa responsibility. No runtime fallback implemented yet; Phase 05 remains pending. No performance claims.

## Rollback / handoff

Artifacts are gitignored and not published. Phase 04 still requires Phase 03 human relevance validation; this report alone does not authorize activation. Re-run: `python scripts/hm/build-mvp-candidates.py --version rec-private-pilot-v1`.
