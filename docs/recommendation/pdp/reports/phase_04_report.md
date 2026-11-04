# Phase 04 — Product Detail UI

Chốt lúc 04/11/2026 13:22 Asia/Saigon. Execution baseline `recommendation / 6f3c8d9` + diff; bàn giao trên `recommendation-pdp`. Môi trường Windows/Node24.15.0/Python3.10.11/Medusa2.21.2/PostgreSQL16.15, DB `recommendation_test`. Working tree có bộ tài liệu PDP/zip của người dùng và thay đổi task; không sửa/xóa zip.

## Implementation

- `related-products/index.tsx`: dedupe/self exclusion và cap6 cho cả API rail lẫn legacy fallback; fallback lỗi thì ẩn optional rail. Giữ ProductPreview/giá Medusa. Legacy rail có semantic h2, section/aria-labelledby.
- `next.config.js`: `NEXT_BUILD_DIR` cho output build test riêng; `.gitignore` bỏ `.next-pdp-*/`. Không thay default `.next`. Không đè dev preview đang chạy.
- `pdp-test-proxy.mjs`: harness chỉ bind127.0.0.1:9006, đọc mode trong gitignored data; proxy commerce thật, chỉ inject Recommendation response. Không đăng ký API app hoặc deploy harness.
- `pdp-similar-products.spec.ts`: real full/sparse/zero H&M và non-H&M; 503/404/empty/timeout/duplicates; missing-image placeholder, VND, keyboard focus,360px. Test contract failure injection không được mô tả là Medusa outage thật.
- `e2e/checkout-flow.ts`: không chờ stream optional sections kết thúc; vẫn đợi response.ok và cart state hiển thị tăng. Không bỏ commerce assertion hoặc sửa payment code.

## Commands thực chạy

| Lệnh/context | Exit | Actual |
| --- | --- | --- |
| `npm run typecheck`; `npm run lint` tại storefront |0|Types PASS;0 lint errors,18 existing warnings |
| `NEXT_BUILD_DIR=.next-pdp-on`, flags true, SDK debug false, backend9006; `npm run build` |0|Production build ON |
| Cùng build, output `.next-pdp-off`, flag false |0|Production build OFF |
| `npm exec -- next start -p 8003` / `-p 8004` với đúng build env |running|Production ON/OFF servers riêng |
| `PLAYWRIGHT_BASE_URL=http://127.0.0.1:8003 PDP_FAULT_TESTS=true RECOMMENDATIONS_EXPECT_ENABLED=true npm exec -- playwright test --reporter=list` |0|**18/18 PASS,1.2m**, gồm toàn bộ commerce và7 PDP cases |
| `PLAYWRIGHT_BASE_URL=http://127.0.0.1:8004 PDP_EXPECT_FRONTEND_OFF=true PDP_FAULT_TESTS=false npm exec -- playwright test e2e/pdp-similar-products.spec.ts --reporter=list` |0|**1/1 PASS**, production OFF |

PowerShell đặt env theo runbook; key đọc từ file context ngoài Git, không ghi giá trị. Logs `data/hm/processed/pdp-verification/{full-browser-final,frontend-off-browser,build-off}.log`. Build ON command/output được quan sát trực tiếp trong tool session; không giả tạo archived log.

## Failures/fixes/retests

Lần PDP-only đầu6/7: hidden React Suspense copy làm strict locator match2 elements; test chờ đúng1 rail **visible**, giữ uniqueness/cards assertions. Lần full đầu16/18: `response.finished()` chờ stream dù cart đã có hàng; sửa đồng bộ theo state, không tăng timeout. Lần full tiếp17/18: quantity tạm giữ1; isolated cart2/2 pass và final full18/18 pass sau đó, không sửa quantity assertion hay app mutation. Ghi nhận intermittent production streaming/timing risk; không nói chưa từng fail.

## Acceptance, review, rollback

0..6 unique/no self/VND/label/placeholder/keyboard/mobile/API error/build flags: PASS trên production browser. Loading reuse Suspense skeleton hiện có; empty/error fallback hoặc hide. Không cần ảnh H&M mới. Bổ sung xác minh backend-OFF thật bằng API tạm9007,flagfalse/WORKER_MODE=server,build rồi start cùng source:test probe404/113ms;Next production ON tạm8005 vẫn render PDP và legacy fallback qua Chromium. Tắt cả2 process tạm sau test;không thay API chính.

Post-commit suite trên `9dfd91e` đạt **19/19 ON (40.5s),1/1 OFF (1.3s)**,thêm H&M cart→checkout khi Rec503. Ca mới lúc đầu fail vì helper đếm options trước khi ProductActions stream tới;helper chờ add-button visible,chọn từng nhóm option vàassert selected class rồi mớiadd. Rerun ca riêngexit0 vàfull19exit0. Không sửa nghiệp vụ ProductActions hoặc bỏ enabled assertion. Raw logs `browser-on-final-sha.log`,`browser-off-final-sha.log` tại private evidence directory.

AGENT_REVIEW; human relevance NOT_RUN. Rollback OFF frontend + rebuild hoặc backend OFF; không sửa Product/Order. Phase **PASS PRIVATE UI correctness**, không chứng nhận performance/public rights.

Xác nhận runtime cuối: Medusa container Node22.22.0 (docker compose exec -T recommendation-api node --version, exit0); host Node24.15.0/Python3.10.11. Báo cáo cập nhật lúc 2026-11-04T13:28:58+07:00 (Asia/Saigon).
