---
document_id: REPORT-BE-05-EVIDENCE-01
title: BE-05 evidence record and audit trail
version: 1.0.0
status: Partial — backend runtime verified, end-to-end walkthrough blocked
owner: Backend
last_updated: 2026-11-22
related_documents:
  - be-05-staff-walkthrough.md
  - ../technical/be-05-status-contract.md
  - ../technical/staff-admin-permission-matrix.md
---

# BE-05 — Evidence record và audit trail

## Trạng thái

**PARTIAL; WALKTHROUGH CHƯA HOÀN TẤT.** Backend/seed/order đã có bằng chứng runtime trong DB disposable; không có dữ liệu giả cho fulfillment, tracking hoặc COD. Không điền mã carrier, trạng thái vận chuyển hoặc chứng cứ COD không có nguồn thực.

Chỉ ghi dữ liệu tổng hợp/tối thiểu. Không lưu email, địa chỉ, số điện thoại, mật khẩu, token mời, cookie hoặc chứng từ chứa PII.

## 1. Môi trường và revision

| Trường | Giá trị bắt buộc |
|---|---|
| Evidence date | 2026-11-22 |
| Commit SHA | `b9660ea` là revision ghi nhận; run hiện lấy source workspace tại thời điểm thực hiện |
| Medusa version | 2.21.2 |
| Node/npm versions | Node 24.22.1, npm 11.12.1 theo manifest; Docker build dùng node 24.22.1 |
| Host OS và command host | Windows, Docker Desktop; Docker Compose v5.6.1 |
| Docker/Compose project name | `be05-20261122` |
| Database scope | Disposable PostgreSQL/Redis riêng; volumes `be05-20261122_postgres-data` và `be05-20261122_redis-data` |

## 2. Actors

| Actor fixture | Loại actor | Internal actor ID đã giả danh | Kết quả thực |
|---|---|---|---|
| Admin | Medusa Admin | Invite fixture đã tạo; login chưa hoàn tất | NOT ACCEPTED |
| Staff được phép | Medusa Staff | | |
| Staff trái quyền | Medusa Staff | | |
| Customer | Customer Store API fixture | | NOT ACCEPTED |

Không ghi email, password, invite token hoặc cookie.

## 3. Sản phẩm, tồn và đơn

| Bằng chứng | Giá trị |
|---|---|
| Product ID / variant ID | `prod_01M81N482MT9KFRYP8QTKF0MYH` / `variant_01M81N486SAKZDPZ3K5SPMRCAB` |
| Stock location ID / SKU fixture | `sloc_01M81N47TK9SXVRSK5Q39K9ZXF` / `TEE-ESSENTIAL-BLK` |
| Tồn và reservation trước | Stocked 25, reserved 0, available 25 |
| Tồn và reservation sau cart completion | Stocked 25, reserved 2, available 23 |
| Publish channel và published_at | Published, Online Store sales channel |
| COD order ID / display ID | `order_01M81NJ89K1CYCJ9QD0N1NW5T5` / chưa có display ID thực |
| Order created_at | 2026-11-22T13:01:43.211Z |
| Payment provider / payment status trước/sau | `pp_system_default`; payment status chưa được xác nhận COD hoặc captured |
| Order status trước/sau | pending / pending |

## 4. Fulfillment, tracking và COD

| Trường | Giá trị hoặc `not provided` |
|---|---|
| Fulfillment ID | |
| Item/quantity đã lấy hàng | |
| Fulfillment status trước/sau | |
| Actor thực hiện và timestamp | |
| Tracking carrier và reference thật | Chỉ ghi khi carrier thực cung cấp; không tạo mã/URL |
| Shipped evidence reference đã che | |
| Delivered evidence reference đã che | |
| COD amount reconciled | |
| COD collector/counterparty reference đã che | |
| COD verifier actor và timestamp | |
| Payment status trước/sau | |

## 5. Audit trail tối thiểu

| Event/history ID | Timestamp | Actor ID/role | Hành động | State trước | State sau | Evidence reference |
|---|---|---|---|---|---|---|
| manifest.completed | 2026-11-22T13:01:43.713Z | Store fixture/medusa exec | Cart completion | cart pending/completed | order pending, reservation +2 | [manifest](evidence/inventory-order-ts-be05-20261122-c/manifest.json) |

Audit phải ghi đủ order ID, fulfillment ID khi có, actor, timestamp, state transition và tham chiếu chứng cứ đã giảm dữ liệu cá nhân.

## 6. Customer view và role-negative

| Kịch bản | Kết quả bắt buộc |
|---|---|
| Customer thấy fulfillment status | Không ghi PII; ghi label/status quan sát được |
| Customer thấy payment status | Ghi `COD not paid` hoặc trạng thái Medusa thực |
| Tracking hiển thị | Chỉ ghi khi fulfillment có reference thật; otherwise `not provided` |
| Customer truy cập đơn khách khác | DENY; ghi HTTP/UI outcome và không lộ sự tồn tại tài nguyên |
| Staff trái quyền gọi Admin API | DENY; ghi HTTP 401/403 và state trước/sau không đổi |
| Staff/menu chỉ ẩn nhưng API vẫn cho phép | Không kết luận PASS; chuyển P0 BLOCKED/BE-08 |

## 7. Tiêu chí PASS

Chỉ đánh dấu PASS khi evidence runtime hoàn chỉnh:

- Có ID đơn, actors, fulfillment/payment/tracking states và audit trail thực.
- Có ít nhất một customer COD, một Admin/Staff được phép và một Staff trái quyền.
- Server-side allow/deny đã được kiểm tra; việc login hoặc ẩn menu không thay thế authorization.
- Customer chỉ thấy trạng thái đúng và không truy cập được đơn của customer khác.
- Tracking chỉ dựa trên carrier reference thật; COD chỉ ghi thu khi có chứng cứ đối soát.
- Không có dữ liệu vận chuyển/COD được bịa hoặc trạng thái không có bằng chứng nguồn.

Chạy lại trình tự tại [Staff walkthrough](be-05-staff-walkthrough.md). Chấp nhận PASS/FAIL tại trường review, không suy ra PASS từ source code hoặc ảnh UI.

| Review | Giá trị |
|---|---|
| Reviewer | |
| Reviewed at | |
| Result | `PASS` / `FAIL` / `BLOCKED` |
| Follow-up issue/TODO | |
