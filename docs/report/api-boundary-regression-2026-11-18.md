# BE-01 — Regression ranh giới Auth/API

**Ngày kiểm chứng:** 2026-11-18  
**Kết luận:** PASS cho các regression HTTP có mục tiêu và kiểm tra tương thích checkout được ghi trong evidence bundle. Đây không phải nghiệm thu toàn bộ BE-01, phát hành hay production.

## Evidence bundle

- [Các assertion API boundary và kết quả](evidence/api-boundary-regression-2026-11-18/api-boundary-regression.json)
- [Lệnh, kết quả kiểm chứng, runtime và giới hạn](evidence/api-boundary-regression-2026-11-18/verification-results.json)

Guest cart là hành vi có chủ đích: theo policy đã ghi, cart ID vẫn là capability của Store API. Regression cross-cart chứng minh tính nhất quán giữa item và cart; không khẳng định cart guest chỉ được chủ tài khoản đã đăng nhập truy cập. Xem [ghi chú ranh giới cart/auth](../spec/07-delivery.md).

## Giới hạn

Chưa chạy toàn bộ HTTP suite, browser/Playwright, kiểm thử đầy đủ ma trận Staff/Admin hoặc kiểm chứng triển khai AWS/production. Kết quả chỉ áp dụng cho worktree và các lệnh được ghi trong evidence bundle; không chứng minh hành vi của bản deploy.

## Tham chiếu triển khai

Assertion regression nằm trong [auth-catalog-search.spec.ts](../../apps/backend/integration-tests/http/auth-catalog-search.spec.ts) và [checkout-order.spec.ts](../../apps/backend/integration-tests/http/checkout-order.spec.ts). Mã liên quan: [middleware cart/auth](../../apps/backend/src/api/middlewares.ts), [route catalog legacy](../../apps/backend/src/api/store/catalog/route.ts) và [route cart legacy](../../apps/backend/src/api/store/cart/route.ts).
