<a id="evidence-and-specialist-references"></a>
# Bằng chứng và tham chiếu chuyên sâu

Các tài liệu này hỗ trợ [đặc tả hiện hành](../README.md), không phải lộ trình sản phẩm song song. Ngày tháng, môi trường và quyền nghiên cứu của chúng vẫn có hiệu lực. Không tài liệu nào ở đây chứng minh thời gian hoạt động AWS hiện tại.

<a id="historical-engineering-evidence"></a>
## Bằng chứng kỹ thuật lịch sử

- [Regression API boundary auth/cart ngày 18 tháng 11](../report/api-boundary-regression-2026-11-18.md): HTTP negative cases, checkout compatibility và giới hạn kiểm chứng; không phải nghiệm thu production.
- [Phát hành AWS từ main ngày 9 tháng 11](../report/aws-redeployment-main389e855-2026-11-09.md): migration, digest ảnh và 18 kiểm tra công khai; không khẳng định đã nghiệm thu chiến dịch tải, khôi phục hay nhân viên vận hành.
- [Triển khai Fargate ban đầu](../report/aws-fargate-deployment-2026-11-08.md) và [diễn tập EC2](../report/aws-ec2-deployment-2026-11-06.md): giữ giới hạn theo ngày, bao gồm phân biệt checkout qua API với nghiệm thu trình duyệt.
- [Thư mục bằng chứng](../report/evidence/): đầu ra đã làm sạch, bất biến của các lần chạy, gồm ảnh chụp tồn kho.
- [Quyết định AWS](../architecture/adr/0001-aws-cloud-stack.md): nền tảng đầy đủ là chính, EC2 dự phòng; mẫu và quyết định hiện hành ở tài liệu kiến trúc kỹ thuật.

<a id="product-suggestion-research"></a>
## Nghiên cứu gợi ý sản phẩm

- [Quyết định quyền sử dụng dữ liệu](../recommendation/dataset-rights-decision.md): giữ ranh giới sử dụng riêng tư/công khai.
- [Tham chiếu gợi ý](../recommendation/spec.md), [cá nhân hóa](../recommendation/personalization/spec.md), [hybrid](../recommendation/hybrid/spec.md) và [ảnh](../recommendation/images/spec.md): hành vi tính năng, lịch sử nghiên cứu/đánh giá và quy trình chuyên sâu.
- Báo cáo/bằng chứng nghiên cứu lưu nguồn gốc và kết quả. Công việc tương lai chỉ thuộc phạm vi thực hiện khi được đưa rõ ràng vào danh sách công việc chính thức.
- Tệp ngoại tuyến trong `data/hm/` bị ignore là dữ liệu nghiên cứu cục bộ; không phải đơn hàng seed hoặc nguồn ảnh/danh mục DAYMARK công khai mặc định.

<a id="reference-policy"></a>
## Quy tắc sử dụng tham chiếu

Không viết lại một PASS lịch sử thành nghiệm thu phiên bản mới; thêm lần chạy mới có ngày tháng. Không xóa dữ liệu mẫu/bằng chứng được script sử dụng chỉ để đơn giản hóa điều hướng. Rà lại quyền dữ liệu, sở hữu trí tuệ và riêng tư trước khi công bố artifact hoặc ảnh chụp trình bày.
