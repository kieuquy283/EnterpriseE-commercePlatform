# Bằng chứng thực thi tuần 4

Run: auto-20261105-suite-01. HTTP và snapshots là dữ liệu thực thi mới ngày05/11/2026 UTC+07.

W4-02/W4-03 đạt. W4-04 thực tế chặn cart B và rollback đúng; validator ban đầu chưa nhận diện thông báo native Not enough stock nên dừng9/10. Giữ nguyên failure.json, validation.json và source của lần đầu.

Kết luận cuối, đối chiếu lại cùng dữ liệu và retry A: [verification](../verification-20261105/README.md). Không chạy lại hoặc reset fixture để sửa kết quả.

Xem notes.txt từng ca, api-trace.json, inventory-timeline.csv và source/.
