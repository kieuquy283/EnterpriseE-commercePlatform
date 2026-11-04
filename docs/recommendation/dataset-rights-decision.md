# Dataset rights decision

Ngày: 2026-11-04, Asia/Saigon. Phạm vi được người dùng ủy quyền trong master prompt: xử lý local/private, không public deployment.

Nguồn được khai báo: H&M Personalized Fashion Recommendations trên Kaggle; ba CSV đã được người dùng tải thủ công vào `data/hm/`. Chưa có bằng chứng trong repository xác nhận người tải đã chấp nhận điều khoản nào hoặc quyền phân phối lại dữ liệu/ảnh. Không suy quyền thương mại từ việc dữ liệu có thể tải xuống.

**Quyết định vận hành:** tiếp tục kiểm tra kỹ thuật offline/private theo ủy quyền; đây không phải xác nhận pháp lý về license. Public release **NO-GO**. Không tải thêm ảnh, không đưa raw CSV, customer identifiers, customer hashes hoặc artifacts vào Git. Hai chiến lược aggregate/content không cần đọc `customers.csv` hoặc lưu customer identity. Việc đánh giá theo customer chỉ thực hiện sau khi xác định phạm vi xử lý phù hợp.

Để mở public gate: lưu nguồn điều khoản Kaggle/competition áp dụng, ngày chấp nhận và người phụ trách, quyết định rõ về metadata/ảnh/derived artifacts và hình thức demo. Chưa có các bằng chứng đó trong phiên này.
