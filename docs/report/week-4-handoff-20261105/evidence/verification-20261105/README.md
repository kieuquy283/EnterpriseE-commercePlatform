# Inventory Test Evidence — kết quả cuối tuần 4

**4/4 ca chính Pass; retry bổ sung Pass.**

- W4-01: 10/10 đối chiếu lịch sử ngày01/11; link/config được đọc bổ sung ngày05/11.
- W4-02: 12/12; provider rejection, rollback đúng baseline.
- W4-03: 11/11; thiếu shipping, inventory/reservations không đổi.
- W4-04: 10/10; B thiếu hàng sau A, baseline sau A được bảo toàn.
- W4-05: 7/7; retry trả cùng Order, không giữ thêm hàng.

[Raw suite](../run-20261105/README.md) chứa HTTP và snapshots W4-02–04. Các validation trong thư mục hiện tại đánh giá lại đúng dữ liệu đó; reviewed-source.json chứa hash nguồn. W4-05 được thực thi tại run này.

Lần đầu W4-04 bị validator báo Fail vì regex thiếu câu Not enough stock; nguyên bản vẫn giữ ở raw suite. Chỉ sửa bộ nhận diện và thêm unit test, không sửa response/snapshot hoặc reset tồn.

[Historical W4-01](../historical-w4-01/notes.txt). Mọi timestamp kết quả là sự kiện/đọc đúng scope được ghi trong từng JSON; UTC có hậu tốZ, trình bày giờ địa phương UTC+07.

Tồn cuối4/3/1, giữ2 đơn vị cho Order W4-01 đã captured và1 cho Order A mới authorized. Chưa fulfillment/cleanup. Không chứng minh xử lý tiền ngân hàng hoặc concurrency.
