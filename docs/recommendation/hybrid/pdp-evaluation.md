# Đánh giá Similar Products v1 và v2

## Quyết định đo chất lượng

**Baseline được khóa: v1 metadata Similar Products** tại `data/hm/processed/candidates-product-detail.jsonl`. v2 sẽ được so trên **cùng 40 PDP Product contexts**, cùng Medusa Product ID mapping, top 6 và cùng bộ nhãn. Chưa có v2 artifact thật, vì vậy chưa có số điểm v1/v2 hoặc kết luận v2 tốt hơn.

**Metric chính: paired macro nDCG@6** trên mức độ phù hợp do hai người thật đánh giá độc lập. Mỗi cặp source–candidate được chấm `0 = không phù hợp`, `1 = chấp nhận được`, `2 = rất giống/phù hợp để thay thế`, dựa trên ảnh và mô tả sản phẩm. Điểm vị trí `k` dùng gain `2^grade - 1`, giảm theo `log2(k+1)`, chia cho thứ tự lý tưởng từ pool đã chấm. Lấy trung bình đều theo PDP context rồi tính `v2 - v1` và khoảng tin cậy bootstrap ghép cặp 95%. nDCG phản ánh cả **mức độ liên quan và thứ tự 6 thẻ**, phù hợp hơn một tỷ lệ đúng/sai thô khi nhãn có nhiều mức và số candidate có thể <6.

Mẫu có 10 context v1 không có candidate, 10 context có 1–5 và 20 context có ≥6; script trải đều trong các nhóm `index_group` khi có thể. Context không có nhãn dương trong pooled v1/v2 top6 có nDCG **không xác định**, được đếm riêng, không biến thành điểm 0. Context v1 rỗng nhưng v2 có một target được chấm dương có điểm v1 = 0. Báo thêm coverage 6/40, số context có thể chấm, tỷ lệ thiếu ảnh, nhóm sản phẩm và các context v2 kém đi. Không coi catalog coverage hoặc diversity là accuracy.

**Giới hạn của ground truth:** bộ chấm chỉ chứa hợp của top6 v1/v2, nên không chứng minh đã tìm được mọi sản phẩm phù hợp trong catalog. Hai reviewer phải chấm mù về hệ thống và rank; nếu bất đồng, cần file adjudication, không lấy trung bình nhãn tùy tiện. Đường dẫn ảnh trong packet tương đối với `data/hm/`; ảnh thiếu phải ghi nhận khi review, không tự suy mức độ giống từ taxonomy. Bộ chấm, nhãn và ảnh giữ private, không commit. Chỉ dùng nhãn validation để cân chỉnh v2; nếu tối ưu weights trên 40 contexts này, phải tạo tập test mới độc lập trước khi tuyên bố hiệu quả.

## Vì sao không dùng MAP@12 của Kaggle làm điểm chính?

[H&M competition](https://www.kaggle.com/competitions/h-and-m-personalized-fashion-recommendations) dùng MAP@12 cho **dự đoán 12 article một khách sẽ mua trong 7 ngày tiếp theo**. PDP hiện nhận một Product và trả các Product tương tự, không nhận customer; H&M transactions không ghi impression, click, xem sản phẩm hay nhãn “hai món giống nhau”. Vì vậy cùng ngày mua hoặc mua tiếp không tự động là ground truth của *similarity*. Hơn nữa catalog Medusa đang là pilot 500 Products/1.874 articles, nhỏ hơn tập H&M đầy đủ; phép đo mua hàng sẽ bị giới hạn bởi chọn mẫu catalog. `popularity-evaluation.json` hiện đo held-out purchase-event recall@12 cho **Home Popularity**, không áp cho PDP v1/v2. Nếu sau này dùng transaction proxy để chẩn đoán thêm, phải split theo thời gian và báo rõ đó là *behavioral proxy*, không phải similarity accuracy, CTR hay conversion.

## Artifact và cách chạy

Script: `scripts/hm/evaluate-pdp-relevance.py`; unit tests: `scripts/hm/tests/test_pdp_relevance.py`. Bản sample v1 đã tạo local, bị Git ignore: `data/hm/processed/evaluation/v1-frozen-balanced-20261107/`. Nó có `sample-manifest.json` khóa SHA catalog/mapping/v1 và 40 context IDs; `blind-pairs.jsonl` chứa 145 cặp (chưa có v2); `labels-template.jsonl` có `grade: null`; `report.json` ghi `AWAITING_HUMAN_LABELS`. Đây là **packet chuẩn bị chấm**, chưa phải ground truth đã được gán nhãn. Không sửa sample để chọn lại context theo kết quả v2.

**AI annotation update:** Astra đã gán 145/145 nhãn private trong `astra-labels.jsonl`; xem [báo cáo](reports/astra_annotation_report.md). File này **không thay** hai bộ human labels cần cho metric chính hoặc release gate. Có thể dùng để phát hiện cặp khó và chuẩn bị human audit, không coi là ground truth độc lập.

Khi v2 candidate artifact thật đã sẵn sàng, tạo pooled packet mới từ sample đã khóa:

```powershell
python scripts/hm/evaluate-pdp-relevance.py `
  --sample-manifest data/hm/processed/evaluation/v1-frozen-balanced-20261107/sample-manifest.json `
  --v2 data/hm/processed/hybrid/<version>/candidates-product-detail.jsonl `
  --output data/hm/processed/evaluation/<version>-blind
```

Giao `blind-pairs.jsonl` cho hai reviewer; mỗi người điền `reviewer_id` riêng và `grade` 0/1/2 cho **mọi cặp** trong file riêng. Giữ thứ tự cặp đã xáo và không cho reviewer xem v1/v2 rank. Sau khi giải quyết bất đồng bằng file adjudication nếu có, chạy lại evaluator vào **output directory mới** với `--reviewer-a`, `--reviewer-b` và tùy trường hợp `--adjudicated`. Script từ chối nhãn thiếu, trùng, chưa chấm, cùng reviewer hoặc bất đồng chưa xử lý. `report.json` lúc đó mới chứa nDCG@6, paired delta và CI. Nếu không có người chấm, trạng thái tiếp tục `AWAITING_HUMAN_LABELS`.

## Release gate

Chỉ xem xét v2 tốt hơn khi: sample và artifact hashes cố định; hai reviewer/adjudication hoàn tất; paired nDCG@6 không kém v1 trên tập test độc lập; không có sụt giảm nghiêm trọng ở nhóm ít ảnh hoặc ít candidate; coverage, saleability và latency đáp ứng các gate riêng. Không suy ra CTR, conversion hoặc chất lượng toàn catalog từ 40 context này.
