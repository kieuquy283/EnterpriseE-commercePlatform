# Phase 00 — Audit & Safety

Thời điểm: 04/11/2026 12:20 Asia/Saigon. Baseline: `recommendation`, `6f3c8d99cac44d94f296dbe912ed82d820ac6584`. Working tree ban đầu chỉ có bộ tài liệu `docs/recommendation/pdp/` và `docs/HM_Similar_Products_PDP_Plan_Docs.zip` chưa tracked; giữ nguyên chúng. Không reset hoặc chuyển baseline.

## Môi trường và lệnh đã chạy

| Lệnh | Exit | Kết quả |
| --- | --- | --- |
| `git status --short`, `git branch --show-current`, `git rev-parse HEAD`, `git log -5 --oneline` | 0 | Baseline/dirty tree như trên |
| `git fetch origin`; `git rev-list --left-right --count HEAD...origin/recommendation` | 0 | Đồng bộ 0/0 với remote recommendation |
| `node --version`; `python --version` | 0 | Windows PowerShell, Node 24.15.0, Python 3.10.11 |
| `docker compose -p recommendation-test -f deploy/docker-compose.recommendation-test.yml ps` | 0 sau quyền truy cập Docker | API9002, proxy9004, PostgreSQL và Redis test riêng đang chạy |
| `docker compose … exec -T recommendation-test-postgres psql -U recommendation_test -d recommendation_test -Atc "select current_database(),version();"` | 0 | DB `recommendation_test`, PostgreSQL16.15 |
| `docker compose … exec -T recommendation-api node /app/node_modules/@medusajs/cli/cli.js exec ./src/scripts/check-hm-mapping.ts` | 0 | 1874 mappings/500 Products readback đúng |

Docker mặc định bị sandbox từ chối pipe; chỉ thực hiện lại qua cơ chế cấp quyền của môi trường. Không né sandbox. Không in key hay đọc credentials từ env. npm11.12.1 theo root packageManager; Medusa2.21.2 và Next15.5.24 theo package.json.

## Inventory và thay đổi nhỏ dự kiến

Reuse generator, remapper, module, migrations, publisher, Store Product adapter, API, Next helper, ProductPreview, RelatedProducts và suites hiện có. Không tạo module thứ hai, không sửa Home UI/threshold để làm đầy rail. Gaps thấy qua code: UI chưa dedupe và legacy fallback chưa giới hạn6; benchmark chỉ Home; coverage PDP failure/flags chưa đầy đủ. Sẽ sửa những gap này và kiểm thử lại, không coi reports cũ là bằng chứng mới.

Đã đọc plan/spec PDP và7 phase; master recommendation plan/spec/runbook/rights; project definition/scope/SRS; implementation và tests liên quan. File `docs/recommendation/pdp/codex_master_prompt.md` chưa tồn tại trong bộ tài liệu local; dùng nguyên yêu cầu đầy đủ người dùng đã dán trong hội thoại, không tự chạy một nested Codex CLI. Quyền metadata/ảnh/derived artifacts chưa xác nhận: private technical work theo ủy quyền, **PUBLIC NO-GO**, human review **NOT_RUN**. Không đọc customers.csv để làm Similarity.

## Acceptance, review và rollback

| Gate | Expected | Actual |
| --- | --- | --- |
| Baseline/source | Xác định implementation để reuse | Đạt, source trên recommendation có sẵn |
| Isolation | Không ghi vào commerce DB | Stack test dùng DB riêng `recommendation_test`; migration-down chỉ runner-owned ephemeral DB có regex guard |
| Rights/flags | Private, default OFF public | Cấu hình triển khai chính OFF; test stack ON; public rights chưa có |
| Git integration | Bảo toàn local work | Giữ branch recommendation; chuẩn bị review/PR sau verification, không merge |

Không xóa volume, dữ liệu commerce, migration hoặc Git history. Stack test giữ dữ liệu demo nên không coi DB này là disposable để migration-down; các HTTP suites tự tạo DB disposable riêng. Audit chỉ đọc; rollback không cần thao tác dữ liệu. Verdict: **PASS PRIVATE audit / PUBLIC NO-GO**. Phase01 sẽ đối soát metadata/candidates đầy đủ trước publish.

Xác nhận runtime cuối: Medusa container Node22.22.0 (docker compose exec -T recommendation-api node --version, exit0); host Node24.15.0/Python3.10.11. Báo cáo cập nhật lúc 2026-11-04T13:28:58+07:00 (Asia/Saigon).
