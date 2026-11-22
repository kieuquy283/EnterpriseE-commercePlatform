# BE-05 — Staff walkthrough và bằng chứng nghiệm thu

## Trạng thái

**BLOCKED — chưa chạy walkthrough end-to-end; không có order ID hoặc audit trail thực để báo cáo.** Không dùng dữ liệu production/demo dùng chung và không tạo trạng thái vận chuyển/COD giả.

## Nền và môi trường

- Ngày kiểm tra: 2026-11-22
- Revision trước khi ghi tài liệu: `b9660ea`
- Medusa theo manifest: `2.21.2`
- Runtime yêu cầu: Ubuntu WSL; Docker CLI/WSL integration hiện không khả dụng.
- Kiểm tra môi trường: `wsl.exe -d Ubuntu -- bash -lc 'docker --version; docker info --format "Server={{.ServerVersion}} OperatingSystem={{.OperatingSystem}}"'`
- Kết quả: Docker Desktop báo `docker` không khả dụng trong distro và yêu cầu bật WSL integration.
- Node trong Ubuntu WSL: chưa cài (`node: command not found`); npm thấy trong distro là `11.19.1`, khác phiên bản npm 11.12.1 được repository yêu cầu.
- Database/Admin/storefront: chưa khởi động; không tạo staff, customer, order hoặc thay đổi tồn.

Không chuyển sang Docker engine phía Windows vì yêu cầu chạy Docker từ Ubuntu WSL. Cần bật Docker Desktop > Settings > Resources > WSL Integration cho distro Ubuntu, sau đó xác nhận `docker info` thành công. Cần Node `24.22.1` và npm `11.12.1` trong WSL nếu chạy test từ host. Mọi DB phục vụ walkthrough phải là môi trường disposable cô lập, không dùng volume hoặc dữ liệu chia sẻ.

## Kết quả theo điều kiện Done

| Hạng mục | Kết quả | Căn cứ |
|---|---|---|
| Invite/login actor vận hành | NOT RUN | Chưa có DB/Admin runtime. Không tạo hoặc ghi token lời mời. |
| Nhập tồn → publish sản phẩm | NOT RUN | Chưa có fixture và snapshot tồn trước/sau. |
| Customer đặt COD | NOT RUN | Chưa có customer, order ID hoặc trạng thái payment thực. |
| Fulfillment và tracking thủ công | NOT RUN | Chưa có fulfillment ID, tracking carrier hoặc bằng chứng bàn giao. |
| Customer nhìn thấy trạng thái đúng | NOT RUN trên browser | Source storefront đọc riêng `fulfillment_status`/`payment_status`; E2E order history có sẵn nhưng chưa chạy cho revision này. |
| Staff trái quyền bị từ chối | BLOCKED bởi BE-08 | Ma trận quyền hiện là Proposed; chưa có role policy được duyệt hoặc kiểm thử server-side allow/deny. |
| Audit trail end-to-end | NOT RUN | Không có actor/order/fulfillment IDs, timestamp hoặc state transition thực để đối chiếu. |

### Đã kiểm tra source (không phải walkthrough)

- Medusa Admin mặc định có thao tác fulfillment shipped/delivered và trường tracking; cập nhật là thao tác Admin, không phải xác nhận từ tích hợp hãng vận chuyển.
- Storefront hiển thị fulfillment và payment status riêng ở order card/details.
- Storefront order history có E2E đăng ký customer, đặt COD và kiểm tra đơn; chưa kiểm tra thủ công/automated các chuyển trạng thái Admin, tracking link hoặc COD reconciliation.
- [Permission Matrix Staff/Admin](../technical/staff-admin-permission-matrix.md) là tài liệu BE-08 trạng thái Proposed, không chứng minh Staff đã bị giới hạn.

## Dữ liệu bắt buộc khi chạy lại

Chỉ ghi dữ liệu tổng hợp/tối thiểu; không lưu email, địa chỉ, số điện thoại, mật khẩu, token mời hoặc cookie.

| Bằng chứng | Giá trị cần ghi |
|---|---|
| Revision và runtime | Commit SHA, Medusa/Node/npm versions, Ubuntu distro, project Compose name |
| Actor | ID nội bộ đã giả danh, loại actor, thao tác; không ghi credential |
| Sản phẩm/tồn | Product/variant/location IDs, SKU fixture, số lượng trước/sau và reservation |
| Đơn | Medusa order ID và display ID, timestamp tạo, COD provider/payment status |
| Fulfillment | Fulfillment ID, items/quantities, status trước/sau, actor ID, timestamp |
| Tracking | Chỉ carrier reference thật nếu được phép lưu; nếu không có thì ghi `not provided` |
| COD | Số tiền đối soát, tham chiếu chứng cứ đã che, actor xác minh, trạng thái payment trước/sau |
| Customer view | Customer actor giả danh, fulfillment/payment labels thấy trên browser, kết quả truy cập đơn khách khác |
| Role-negative | Staff actor/permission policy được duyệt, request bị từ chối, HTTP status và xác nhận state không đổi |
| Audit | Event/history IDs, actor, timestamp, state transition; redacted screenshot/log nếu cần |

## Trình tự nghiệm thu tiếp theo

1. Bật Docker Desktop WSL integration cho Ubuntu và xác nhận Docker engine truy cập được từ chính distro.
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
