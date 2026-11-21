---
document_id: EVIDENCE-STAFF-AUTH-20261119
title: Bằng chứng ranh giới Staff/Admin ngày 19-11-2026
status: Local isolated verification
last_updated: 2026-11-19
---

# Bằng chứng ranh giới Staff/Admin — 19-11-2026

## Phiên bản và môi trường

Nền Git `13a9d25`, nhánh `feat/daymark-preview-operations`, cùng thay đổi authorization chưa commit. Source copy cô lập không sao chép `.env*`, cấu hình riêng, uploads hoặc output sinh trước đó. Node `24.22.1`, npm `11.12.1` tải riêng vào `/tmp` vì npm mặc định của shell là `11.19.1`; không sửa package/lockfile. PostgreSQL/Redis disposable trên loopback, project Compose riêng `daymark-test-m31fgpnisa`, dùng `compose.test.yaml`. Test runner Medusa tạo DB tích hợp riêng; không dùng DB chia sẻ hoặc AWS. Sau test, harness đã dừng/xóa chỉ dịch vụ của project này, exit 0.

Harness tạm dựa trên `scripts/test-environment-run.sh http`, giữ nguyên cô lập môi trường/source và cleanup; thay bước HTTP bằng các lệnh sau trong bản sao backend:

```sh
npm run lint
npm run typecheck
npm run build
npm run test:integration:http -- --runTestsByPath integration-tests/http/staff-authorization.spec.ts integration-tests/http/bootstrap-preview-admin.spec.ts integration-tests/http/auth-catalog-search.spec.ts
```

## Kết quả thực chạy

| Kiểm tra | Kết quả |
| --- | --- |
| Backend lint | PASS, 0 lỗi, 2 warning tại source observability và subscriber đang được cộng tác viên sửa; không disable rule |
| Backend typecheck | PASS |
| Backend build, gồm bundle Admin | PASS |
| HTTP | 3 suite PASS, 27 test PASS, Jest báo 34,81 giây |
| `npm run docs:check` tại workspace | PASS; kiểm tra liên kết/định dạng tài liệu, không render diagram |
| `git diff --check` | PASS |

Các lần trước đã thất bại: typecheck thiếu annotation request của middleware; assertion Jest `toThrow` không khớp rejection dạng object của workflow; policy dùng `NOT_ALLOWED` nên Medusa trả 400 thay vì 403. Đã sửa và chạy lại lint/typecheck/build/HTTP. Không coi các lần thất bại là PASS.

## Hành vi được kiểm chứng

- Actor Admin thực được liên kết identity qua bước Medusa chuẩn, đăng nhập và đọc trực tiếp profile/products/orders/inventory/users/API keys với HTTP 200. Đây không phải kiểm thử đầy đủ mutation của Admin.
- Workflow Staff từ chối identity đã liên kết Admin; Admin đó vẫn đọc được profile. Test bootstrap riêng xác nhận tạo Admin, đăng nhập/profile và từ chối rerun đặt lại credentials.
- Staff thực được tạo bằng `createBlockedStaffWorkflow`, có marker lưu ở User module, đăng nhập thành công nhưng trực tiếp đọc profile/products/orders/customers/inventory/users/API keys đều 403 với lý do Staff bị chặn.
- Staff POST tạo product/invite/API key, sửa metadata chính mình, hủy order và ghi inventory đều 403. Hai request order/inventory dùng ID không tồn tại: bằng chứng chặn ở boundary trước thao tác, không phải nghiệm thu nghiệp vụ hủy đơn/điều chỉnh tồn.
- Header giả `x-role: admin`/`x-user-id` không vượt guard. JWT bị sửa payload nhưng giữ chữ ký cũ và user registration chưa liên kết đều 401.
- JWT Admin đã phát hành trước khi fixture đổi marker thành Staff bị từ chối ngay ở request sau; quyết định không lấy role snapshot trong JWT.
- Customer thực đăng ký/tạo tài khoản/đăng nhập, đọc profile Store với 200, gọi Admin với 401 dù gửi `app_metadata` giả khi đăng ký.
- Suite auth/catalog hiện hữu vẫn PASS, gồm invite Admin thông thường và guest cart. Không đổi guest commerce.

## Giới hạn và quyết định còn lại

Không xác minh entitlement Enterprise RBAC; không bật module. Không thay đổi tài khoản đang triển khai hoặc AWS. Đã kiểm cookie session trong lượt bổ sung dưới; chưa kiểm trình duyệt `/app`, secret API key/revocation hoặc lỗi User service. Guard áp dụng chung mọi method `/admin*`, nhưng các request liệt kê trên là tập mẫu đã chạy, không phải quét toàn bộ route Medusa.

BE-08 còn cần lifecycle Staff, kiểm kê user/key trước chuyển vai trò, surface giới hạn theo assignment và policy cho các thao tác vận hành. Admin không marker giữ quyền chuẩn, kể cả sửa metadata user; chưa enforce toàn bộ ma trận H/D cho Admin. Xem [chính sách và giới hạn triển khai](../technical/staff-admin-rbac-license-feasibility.md#6-ranh-giới-không-dùng-license). Không suy kết quả này thành nghiệm thu OPS-02/05/06/07 hoặc hoàn tất PR18.

## Kiểm bổ sung cookie session

Parent bổ sung assertions tạo session qua `/auth/session` bằng JWT Admin/Staff, chỉ truyền session cookie trong request kế tiếp. Admin session đọc profile 200, Staff session gọi Admin orders 403; session Admin đã phát hành cũng bị từ chối sau khi marker persisted đổi sang Staff. Không ghi cookie/token vào báo cáo.

Harness disposable chạy lại với Node 24.22.1/npm 11.12.1: **7 suites, 32 tests PASS; 1 suite/2 tests SKIP** do fixture workload chuyên biệt chưa bật trong lượt này. Runtime 82,377 giây, project `daymark-test-ctnccdw3fa`, cleanup exit 0. Suite workload được kiểm độc lập trong [báo cáo observability](ops-observability-2026-11-19.md). Không coi skip là pass và không lấy kết quả này làm nghiệm thu browser Staff.
