# V1 Similar Products — Astra baseline diagnostic

**Ngày:** 07/11/2026 Asia/Saigon. **Nguồn:** 40 PDP contexts đã khóa trong `data/hm/processed/evaluation/v1-frozen-balanced-20261107/sample-manifest.json`; candidate v1 SHA-256 `6ac4503b1098fbcbc00b30abccfa0ffa251840a9dcbc70071831eec7e0343353` khớp manifest. Astra labels SHA-256 `607237d3aa54165c8ebb869ed4ee447a369567620d6319c25169d8762d83eb11`. Nhãn là AI proxy, không phải human ground truth.

| Chỉ số trên mẫu v1 | Kết quả | Cách tính |
|---|---:|---|
| Contexts | 40 | 20 đủ 6 gợi ý; 10 có 1–5; 10 không có |
| Cặp được chấm | 145/145 | 0: 12, 1: 86, 2: 47 |
| Tỷ lệ gợi ý có mức ≥1 | 133/145 = **91,72%** | Chỉ xét 145 thẻ v1 thực sự hiển thị |
| Tỷ lệ gợi ý mức 2 | 47/145 = **32,41%** | Chỉ xét thẻ hiển thị |
| Điểm nhãn trung bình | **1,241/2** | Tổng grade / 145 |
| Phần slot Top 6 có gợi ý mức ≥1 | 133/(40×6) = **55,42%** | Tính cả slot trống ở 10 context không có gợi ý |
| Phần slot Top 6 có gợi ý mức 2 | 47/(40×6) = **19,58%** | Cùng mẫu số 240 slot |

Đây là **diagnostic v1 trên mẫu đã chọn**, không phải accuracy của toàn bộ 500 Products. 91,72% phụ thuộc vào việc chỉ chấm các thẻ v1 đã đề xuất; nó không đo các sản phẩm phù hợp bị bỏ sót. Mẫu có chủ đích gồm nhiều context zero/short nên 55,42% cũng không đại diện cho traffic thực tế. Chưa tính nDCG@6 để so v1–v2: pooled relevance chỉ có top6 v1, làm thứ tự lý tưởng thiếu các target riêng của v2. Khi v2 thật có candidates, thêm các target đó vào phiếu mù, chấm cùng rubric và tính lại hai điểm nDCG trên **cùng pool**. Không dùng điểm Astra để đánh dấu human review approved.

**Kiểm chứng:** `validate-astra-labels.py` trả `COMPLETE`, 145/145, không nhãn thiếu/trùng; SHA candidate khớp frozen sample; phép tính đọc candidate rank v1 và nhãn theo cặp Product IDs, không dùng thông tin customer. Không thay đổi DB, candidate artifact hay manifest. Xem [annotation report](astra_annotation_report.md) và [evaluation protocol](../pdp-evaluation.md).
