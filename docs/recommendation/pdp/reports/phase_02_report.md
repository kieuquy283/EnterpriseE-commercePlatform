# Phase 02 — Similarity Candidates

Thời điểm: 04/11/2026 12:25 Asia/Saigon. Branch/SHA và môi trường: như [Phase01](phase_01_report.md), baseline `6f3c8d9` + uncommitted scorer/validator/tests. Không business DB writes.

## Changes và tests

Reuse weights và threshold0.70 của `build-mvp-candidates.py`. Sửa blocking để whitespace/case được chuẩn hóa và `Unknown` không được xem là taxonomy/index_group match. Không nới threshold để đủ6. Thêm regression test cho Unknown, normalized taxonomy và pool cap100. Validator PDP mới reuse scorer, không đọc purchases/customer; sinh artifacts riêng, không ghi đè ready run.

| Lệnh | Exit | Expected → Actual |
| --- | --- | --- |
| `python -m unittest discover -s scripts/hm/tests -v` | 0 | Scoring/missing/block/tie/cap/reproducibility/remap →8 PASS |
| `python scripts/hm/verify-pdp-candidates.py --output data/hm/processed/pdp-verification/run-a` | 0 | Valid inputs/top100/ranking →3198 rows |
| Cùng command với `run-b` | 0 | Repeat bytes →cùng SHA256 `8f6a7e84076e2bc5f1c7e8a7c0bf65fbf407e7d1a9da6b49130a55c39bf1d740` |

## Coverage thực đo

| Algorithm | ≥1 | ≥3 | ≥6 | Zero |
| --- | ---: | ---: | ---: | ---: |
| Weighted similarity ≥0.70 |423|269|167|77|
| Exact type trong index_group |457|355|238|43|

N=500 Products, không phải article variants. Coverage lớn hơn không chứng minh baseline chất lượng hơn; cũng không chứng minh weighted tốt hơn. Hai lần sinh đều dùng version mới `pdp-private-v3`; artifacts/run hashes ở `data/hm/processed/pdp-verification/run-{a,b}/verification.json` (ignored). Candidate top100 excludes self/duplicates, ranks theo score giảm/ID tie-break. Publisher cũ yêu cầu cả home/PDP nên khi publish phải bảo toàn Home artifacts, đổi version của snapshot theo immutable contract, không huấn luyện lại Home.

## Review, rollback, verdict

Self-review **AGENT_REVIEW** chỉ kiểm metadata/code và invariants. Human relevance20 contexts **NOT_RUN** vì chưa có reviewer người thật; không tự tạo nhãn. Public rights/quality gate **BLOCKED / PUBLIC NO-GO**. Technical deterministic gate **PASS PRIVATE**. Rollback: giữ ready version hiện tại, chỉ activate version mới sau kiểm backend; không thay ready artifacts trực tiếp. No human quality, CTR hoặc behavior quality claim.

Xác nhận runtime cuối: Medusa container Node22.22.0 (docker compose exec -T recommendation-api node --version, exit0); host Node24.15.0/Python3.10.11. Báo cáo cập nhật lúc 2026-11-04T13:28:58+07:00 (Asia/Saigon).
