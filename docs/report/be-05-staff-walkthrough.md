---
document_id: REPORT-BE-05-WALKTHROUGH-01
title: BE-05 Staff walkthrough
version: 1.0.0
status: BLOCKED
owner: Backend
last_updated: 2026-11-22
related_documents:
  - be-05-evidence-record.md
  - ../technical/be-05-status-contract.md
  - ../technical/staff-admin-permission-matrix.md
---

# BE-05 — Staff walkthrough

## Trạng thái

**PARTIAL — backend có order ID và audit trail thực trong DB disposable; walkthrough end-to-end, fulfillment/tracking/COD và role-negative vẫn chưa hoàn tất.** Không dùng dữ liệu production/demo dùng chung và không tạo trạng thái vận chuyển/COD giả.

## Nền và môi trường

- Ngày kiểm tra: 2026-11-22
- Revision trước khi ghi tài liệu: `b9660ea`
- Medusa theo manifest: `2.21.2`
- Chỉ yêu cầu Docker Engine và Docker Compose v2 để chạy walkthrough. Không yêu cầu môi trường hoặc distro phụ.
- Kiểm tra môi trường: `docker --version`; `docker compose version`; `docker info`
- Docker runtime đã khởi thành công project riêng `be05-20261122`, gồm PostgreSQL, Redis, migrate, backend, worker và storefront. Backend `/health` trả `200`.
- Commerce seed đã chạy trong DB disposable; store regions trả `200`, 3 sản phẩm published được đọc qua Store API.
- Đã tạo lời mời staff fixture trong DB disposable; không ghi email, password, invite token hoặc cookie vào tài liệu.
- Đã chạy backend cart-to-order fixture; reservation tăng từ 0 lên 2 và 24/24 kiểm tra nhất quán PASS.
- Order thực trong run disposable: `order_01M81NJ89K1CYCJ9QD0N1NW5T5`, trạng thái ban đầu `pending`; cart `cart_01M81NJ4KK188GN31T74ZKABT8`.
- Chưa chạy fulfillment, cập nhật trạng thái shipped/delivered, tracking carrier thật, reconciliation COD, customer browser hoặc role-negative.

Mọi DB phục vụ walkthrough phải là môi trường disposable cô lập, không dùng volume hoặc dữ liệu chia sẻ.

## Kết quả theo điều kiện Done

| Hạng mục | Kết quả | Căn cứ |
|---|---|---|
| Invite/login actor vận hành | PARTIAL | Đã tạo lời mời fixture trong DB disposable; chưa hoàn tất accept/login và actor không được xác nhận role. |
| Nhập tồn → publish sản phẩm | PARTIAL | Seed tạo 3 sản phẩm published và warehouse; preflight/full audit xác nhận SKU inventory. Chưa thay đổi tồn thủ công qua walkthrough Admin. |
| Customer đặt COD | PARTIAL | Đã tạo order Store API qua payment default, không xác nhận COD thực hoặc trạng thái COD đã thu. |
| Fulfillment và tracking thủ công | NOT RUN | Chưa có fulfillment ID, tracking carrier hoặc bằng chứng bàn giao. |
| Customer nhìn thấy trạng thái đúng | NOT RUN trên browser | Backend store order readback PASS; storefront browser E2E chưa hoàn tất. |
| Staff trái quyền bị từ chối | BLOCKED bởi BE-08 | Ma trận quyền hiện là Proposed; chưa có role policy được duyệt hoặc kiểm thử server-side allow/deny. |
| Audit trail end-to-end | PARTIAL | Có order/cart/fixture/snapshot/24 checks; thiếu actor/user và fulfillment/COD transitions. |

### Đã kiểm tra source (không phải walkthrough)

- Medusa Admin mặc định có thao tác fulfillment shipped/delivered và trường tracking; cập nhật là thao tác Admin, không phải xác nhận từ tích hợp hãng vận chuyển.
- Storefront hiển thị fulfillment và payment status riêng ở order card/details.
- Storefront order history có E2E đăng ký customer, đặt COD và kiểm tra đơn; chưa kiểm tra thủ công/automated các chuyển trạng thái Admin, tracking link hoặc COD reconciliation.
- [Permission Matrix Staff/Admin](../technical/staff-admin-permission-matrix.md) là tài liệu BE-08 trạng thái Proposed, không chứng minh Staff đã bị giới hạn.

## Bằng chứng khi chạy lại

Các trường bắt buộc, định dạng đã che định danh và mẫu audit trail nằm trong [BE-05 evidence record](be-05-evidence-record.md). Không lưu email, địa chỉ, số điện thoại, mật khẩu, token mời hoặc cookie trong walkthrough hoặc báo cáo.

Bằng chứng runtime backend hiện có tại [inventory-order-ts-be05-20261122-c](evidence/inventory-order-ts-be05-20261122-c/manifest.json), gồm manifest, readback, 24 validation checks, snapshot T0/T1/T2 và CSV timeline.

## Trình tự nghiệm thu tiếp theo

1. Khởi động Docker Engine và xác nhận `docker info` cùng `docker compose version` thành công.
2. Chuẩn bị PostgreSQL/Redis disposable bằng Compose project/volume riêng; xác nhận không trỏ tới DB dùng chung. Chỉ seed fixture được phép.
3. Tạo tài khoản Admin qua quy trình invite an toàn trong [hướng dẫn setup](../setup.md); không đưa token vào log hoặc báo cáo.
4. Thực hiện nhập tồn và publish SKU fixture; lưu snapshot tồn/giữ chỗ trước và sau.
5. Đặt một COD order từ customer fixture; ghi order ID, provider và payment status chưa thu.
6. Từ Medusa Admin tạo fulfillment, thêm tracking chỉ khi carrier đã cung cấp dữ liệu, rồi cập nhật shipped/delivered khi có bằng chứng tương ứng.
7. Xác minh customer chỉ thấy fulfillment/payment status đúng, tracking chỉ hiện nếu có dữ liệu hỗ trợ; thử truy cập order của customer khác.
8. Đối soát COD bằng chứng thực; nếu Admin/provider không hỗ trợ cập nhật payment được chứng minh thì để trạng thái chưa thu và ghi BLOCKED.
9. Chạy kiểm thử Staff trái quyền chỉ sau khi policy/ma trận BE-08 được duyệt; xác nhận deny không làm thay đổi state.
10. Cập nhật báo cáo này bằng kết quả thực tế, lệnh chính xác, IDs đã giảm định danh và audit trail. Chỉ kết luận PASS khi toàn bộ điều kiện bắt buộc đã được kiểm chứng.

## Liên kết bàn giao

- [BE-05 status contract](../technical/be-05-status-contract.md) — Proposed; trạng thái/tracking/COD tách biệt.
- [Staff/Admin permission matrix](../technical/staff-admin-permission-matrix.md) — BE-08, Proposed; chưa được duyệt hoặc enforce.
