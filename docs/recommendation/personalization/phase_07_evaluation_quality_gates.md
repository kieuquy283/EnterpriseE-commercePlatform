# Phase 07 — Offline/Online evaluation & promotion gates

**Mô tả đơn giản:** Chứng minh tính năng đúng và hữu ích trên dữ liệu phù hợp trước khi nói “cá nhân hóa tốt hơn”, tránh nhầm kết quả H&M hay Astra với khách thật.

## Dependencies

MVP ranker/API QA, [evaluation protocol](evaluation_protocol.md); optional H&M CF artifacts, new data-subject/privacy approvals.

## Tasks

1. Snapshot immutable baselines/versions/candidate hashes, consent config, experiment definitions; freeze train/val/test before tuning.
2. Offline comparison on H&M train/eval *only for H&M users*: Popularity, content rules, ItemKNN/ALS, same universe. Report sparse users/coverage/temporal leakage; no Medusa conversion claim.
3. Structured synthetic user test for Medusa: A/B preferences, cold start, opt-out, deletion, cancellation, account swap, clicked/not clicked, product invalidation. Label PASS as functional correctness only.
4. If actual live consented traffic and legal gate: instrument impressions/clicks with rank/model and assignment; predefine A/B experiment, guardrails, power calculation, attribution window. If insufficient traffic mark ONLINE UPLIFT `NOT_DEMONSTRATED`.
5. Monitor fairness/diversity/category coverage, score popularity bias, repeated items, long tail; anonymous generic baseline never counted as personalized cohort.
6. Report paired bootstrap uncertainty where meaningful; in model comparison sample unit is user, not each interaction treated independent.

## Exit criteria

- [ ] Measurements separated by H&M research / synthetic Medusa QA / actual online experiment.
- [ ] No future leakage, shared evaluation universe and audit-provenance.
- [ ] Release recommendation states verified vs unverified, no ungrounded uplift claim.
- [ ] No permission to publicly expose H&M or customer-level evidence implied by offline tests.

**Report:** `reports/phase_07_report.md` and an ablation table with actual command/evidence paths.
