# Kiểm chứng trình duyệt preview — 18/11/2026

**Kết quả cuối trên Next production cục bộ:** 3/3 ca hồi quy PASS; suite đầy đủ 18 PASS, 6 SKIP do thiếu fixture H&M, 0 FAIL. Các lỗi ban đầu và phạm vi chưa kiểm được ghi bên dưới; đây không là kết quả triển khai AWS.

## Phạm vi và môi trường

Yêu cầu: kiểm thử trước bản preview AWS; FR-01..07, luồng mua hàng và fallback gợi ý. Baseline Git `1b6a668` cộng thay đổi chưa commit trong checkout chung. Mỗi lượt sao chép mã app sang thư mục riêng, bỏ `.env*`, output build, uploads và cấu hình máy; không thay hoặc dùng DB AWS/chung. Bản sao dùng root dependency đã cài và phiên bản app tại thời điểm sao chép, nên không chứng minh các thay đổi backend được thêm sau đó.

Node 24.22.1, npm 11.12.1, PostgreSQL/Redis disposable của `compose.test.yaml`. Harness tạm dựa trên `scripts/test-environment-run.sh`, cổng loopback động. Playwright dùng executable Helium 0.20.3.1 / Chromium 156.0.8078.79 cài trên máy; binary Chromium bundled không chạy trực tiếp do thiếu shared libraries. Không dùng profile đăng nhập cá nhân; Playwright tạo browser context thử riêng.

Các thao tác ghi chỉ vào DB mới: migration, commerce bootstrap, 30 sản phẩm DAYMARK và ảnh demo, giảm một mức tồn thử đi một rồi import lại để kiểm bảo toàn, tạo pending Admin invite giả và các customer/cart/order tổng hợp do E2E. Tổng Store API 33 sản phẩm gồm ba bootstrap. Mỗi lượt dừng process và xóa đúng Compose project của mình; container cũ giữ dừng. Không chạy AWS hoặc tạo Admin cloud.

## Lượt development ban đầu

Project `daymark-test-bphgx7yqcg`, artifact private `/tmp/daymark-test-bPHGX7YQcg/`. Next chạy `dev`; frontend không lấy `.env` người phát triển. Build backend/Admin, migrate, seed, catalog dry-run/apply/rerun, CLI invite, snapshot tồn, API/Admin JS/worker, region VND, media và storefront HTTP đều PASS.

`npm run test:e2e -- --reporter=list,html,junit`: **16 PASS, 6 SKIP, 2 FAIL**, 24 test được phát hiện, khoảng 2,9 phút. Hai thất bại:

- Geometry: timeout khi chờ sign-in button; snapshot trình duyệt là Next development overlay `PageNotFoundError`, không tìm thấy module route account parallel `@login/page`. Các test login/register/member order trước đó đã PASS; chưa kết luận production gặp cùng lỗi.
- Recommendation OFF: test cũ đòi section `popular-products` biến mất; implementation được chấp thuận vẫn hiển thị sản phẩm danh mục với tiêu đề “Mới trong mùa này”. Đã sửa riêng nhánh OFF của test để kiểm fallback visible, 1–4 card có giá/liên kết duy nhất, không tiêu đề cá nhân hóa, không rail recommendation trên PDP; không đổi nhánh ON hay mã ứng dụng.

Screenshot/video/error-context cho hai lỗi nằm trong `work/apps/storefront/test-results/` của artifact private trên; HTML report trong `work/apps/storefront/playwright-report/`. Không có trace ở lượt đầu vì cấu hình chỉ ghi trace khi retry, lượt local không bật retry. Không coi hai lỗi là PASS hoặc sáu SKIP là nghiệm thu.

## Fixture bị bỏ qua

Sáu test SKIP có điều kiện trong `hm-image-fallback.spec.ts` (hai viewport) và `hm-image-serving.spec.ts` (bốn case), vì không cung cấp `HM_IMAGE_TEST_HANDLE`, `HM_IMAGE_CONTEXT_HANDLE`, `HM_IMAGE_TARGET_HANDLE`. Đây là fixture H&M nghiên cứu riêng, không nhập vào dataset DAYMARK/cloud để làm test xanh. Các case fault/H&M trong `pdp-similar-products.spec.ts` không được đăng ký khi thiếu flags harness chuyên biệt; không thuộc 24 test lần này.

## Lượt production Next build/start

Project `daymark-test-fqikt5ykdu`, artifact private `/tmp/daymark-test-fqIKT5YKDu/`. Môi trường/fixture mới, `next build` và `next start`, frontend recommendation flag OFF rõ ràng; test fallback đã sửa. Build và toàn bộ bước dựng/đọc lại đều PASS. Bộ 24 test: **15 PASS, 6 SKIP, 3 FAIL**, khoảng 1,6 phút.

Geometry PASS trên production; lỗi thiếu module account chỉ tái hiện ở development lần đầu. Fallback OFF đã sửa PASS. Ba lỗi production nằm ở cart add/update/remove, guest COD và mobile journey: Server Action trả thành công nhưng nav cart vẫn báo 0, test dừng trước bước tiếp theo. Member registration → COD → history/detail PASS. Đây là blocker chưa được giải thích/khắc phục tại thời điểm chạy, không được gọi toàn bộ customer journey production PASS.

Probe browser độc lập với cùng Chromium đã xác nhận Secure + HttpOnly + SameSite=Lax cookie được lưu và gửi trên cả `http://localhost` và `http://127.0.0.1`; chỉ ghi tên/cờ cookie và boolean nhận lại. Vì vậy không thể tự quy ba lỗi cho Secure cookie trên HTTP. Không hạ thuộc tính cookie ứng dụng để làm test xanh. Kiểm chứng HTTPS AWS và phân tích cookie/cache thực của Server Action còn cần thực hiện.

## Chẩn đoán và hồi quy phần giỏ hàng

Hai lượt production focused sau thay đổi `retrieveCart` sang `no-store`, rồi thêm `router.refresh()` sau add thành công, mỗi lượt vẫn cho **2 PASS / 1 FAIL** ở ba ca cart/guest COD/mobile. Không coi hai thay đổi đó đơn lẻ là bằng chứng đã sửa xong. Artifact private: `/tmp/daymark-test-fTLdctRqYG/` và `/tmp/daymark-test-LSko7kriaV/`.

Probe trực tiếp trên fixture `/tmp/daymark-test-QJr9ov8sPD/` xác nhận một guest context có Server Action 200, thông báo thêm thành công, cookie cart Secure/HttpOnly đã lưu và Store API có một item, nhưng header sau 2,5 giây vẫn hiển thị giỏ 0. Không in token/cookie value/cart ID. Do đó mutation thành công nhưng phần header dựng từ server chưa đồng bộ; không có bằng chứng thất bại ghi giỏ ở ca được probe. `response.finished()` cũng có thể chờ stream quá lâu nên không dùng việc response đóng làm tiêu chí mua hàng.

Đã bổ sung `revalidatePath` cho layout quốc gia sau mutation thành công để làm mới header dùng chung; giữ private cart reads `no-store` và refresh phía client sau add thành công. Không đổi lỗi mutation thành success, không tăng thời gian chờ hay bỏ assertion giỏ của test. Việc invalidation này áp dụng layout quốc gia nên cần đo lại tác động cache/throughput ở bài tải riêng; không là chứng minh NFR hiệu năng.

Lượt `daymark-test-ymyyxwl23g` với layout invalidation cho ba ca focused PASS, nhưng bộ đầy đủ sau đó vẫn **15 PASS / 6 SKIP / 3 FAIL**. Vì vậy không coi invalidation hoặc refresh đơn lẻ đã giải quyết ổn định. Probe riêng `daymark-test-lkivsrsp7r` (6 ca chẩn đoán, không phải acceptance) ghi các server cart read và Store API với đúng bộ trường đều có một item, không có lỗi đọc; một guest vẫn hiển thị header 0, chuyển sang trang cart cho một row/header 1. Cookie có cờ an toàn đúng. Bằng chứng loại trừ lỗi ghi giỏ trong ca probe và cho thấy sự lệch của header dựng riêng.

Layout đã có snapshot cart trước khi render, nhưng Nav lại dùng CartButton đọc lại trong một Suspense riêng. Đã chuyển Nav nhận đúng snapshot từ layout và render CartDropdown trực tiếp, bỏ component đọc trùng/fallback giỏ 0. Đây là một lần đọc có thẩm quyền cho layout và header; không thêm cart store hay giá/tồn phía client.

## Kết quả phiên bản cuối

Project `daymark-test-awdikylntb`, artifact private `/tmp/daymark-test-AWdiKYLNTB/`, source clone mới không có log chẩn đoán trong app, Node/npm đúng pin. `next build` và `next start` production, recommendation OFF. Mọi bước build/migrate/bootstrap/catalog/media/Admin assets/worker health và bảo toàn stock khi import lại đều PASS.

- Ba ca hồi quy gốc cart add/update/remove, guest COD complete và mobile PDP/cart/checkout: **3 PASS**, 18,2 giây, không đổi assertion hoặc tăng timeout.
- Ngay sau đó chạy đầy đủ suite hiện hữu: **18 PASS, 6 SKIP, 0 FAIL**, 24 test. Các ca đã qua gồm member registration/COD/history/detail, guest COD, cart mutations, required fields và server-action error, catalog/variants, responsive/design/reduced motion/no-JS và recommendation OFF fallback. Sáu SKIP vẫn là fixture H&M riêng đã nêu.
- Storefront lint/typecheck, Oxfmt cho tệp thay đổi, docs checker và diff whitespace PASS. Backend Admin bundle build và storefront production build PASS trong harness. Không coi số này là chạy container workflow CI hay nghiệm thu cloud.
- Cleanup PASS exit 0: process của lượt đã dừng; Compose project riêng không còn container. Tài nguyên/process cũ không bị bật hoặc xóa.

Phiên bản được kiểm gồm private cart `no-store`, refresh sau add thành công, invalidation layout quốc gia và một snapshot cart từ PageLayout truyền cho Nav/CartDropdown, không đọc giỏ lần hai trong Suspense header. Chưa tối ưu bỏ các bước invalidation sau lần xanh; muốn thu hẹp phải chạy lại hồi quy. Cache/throughput multi-replica, cloud HTTPS, Admin browser/RBAC, notification delivery, payment concurrency và load/recovery vẫn chưa được nghiệm thu bởi báo cáo này. Không commit/push/deploy AWS trong nhiệm vụ kiểm thử.
