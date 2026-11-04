# Bàn giao tuần 4

**Hoàn thành: 4/4 ca chính Pass và ca retry bổ sung Pass.**

1. Mở [Inventory Edge-case Report](inventory-edge-case-report.md).
2. Xem [kết luận cuối](evidence/verification-20261105/final-assessment.json), [validation/code checks](evidence/verification-20261105/code-validation.json) và [Inventory Before/After](inventory-before-after.csv).
3. Evidence chia theo nguồn: historical-w4-01 (ngày01/11), run-20261105 (thực thi W4-02/03/04), verification-20261105 (đối chiếu cuối và thực thi retry).
4. [Hướng dẫn tái hiện](run-guide.md) ghi điều kiện môi trường và tác động giữ hàng. Tồn cuối4/3/1; Order A mới giữ1 đơn vị, Order W4-01 giữ2 đơn vị. Chưa fulfillment hoặc cleanup.

Validator đầu dừng W4-04 vì chưa nhận diện câu native Not enough stock. Giữ nguyên failure/validation và source của lần đó. Validator đã được sửa, unit test bổ sung và cùng response/snapshot được đối chiếu lại10/10, rồi retry A thành công. Không sửa hoặc dựng lại raw JSON để thay kết quả.

Các JSON nguồn được sao chép nguyên byte; đường dẫn tuyệt đối trong JSON là provenance của repository gốc. Các link trong báo cáo/notes/README đã được đổi sang đường dẫn tương đối để đọc sau khi giải nén. SHA256SUMS.json ghi hash các file trong gói.

CSV để trống captured_at của bốn mốc W4-01 vì thời gian chụp lịch sử không có trong response body. Timestamps mới có hậu tốZ làUTC, báo cáo trình bàyUTC+07. Snapshot đọc tuần tự; chưa kiểm thử ngân hàng thật hoặc request đồng thời.
