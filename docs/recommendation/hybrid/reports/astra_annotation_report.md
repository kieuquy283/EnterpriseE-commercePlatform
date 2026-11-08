# Astra PDP annotation — private AI proxy

**Ngày:** 07/11/2026 Asia/Saigon. **Branch/SHA nền:** `recommendation-pdp` / `cf16e0ba2e2af3519f79f5d1b516708d64a28605` + uncommitted work. **Phạm vi:** v1 Similar Products packet đã khóa, chưa có candidates v2. **Verdict:** AI annotation COMPLETE; HUMAN GROUND TRUTH NOT_RUN; v1–v2 accuracy comparison NOT_RUN.

## Thực hiện

Astra trong phiên Codex đã đọc `blind-pairs.jsonl` mà không đọc rank/score/version, mở bằng `view_image` cả 115/115 ảnh khác nhau từ `data/hm/`, rồi gán nhãn cho 145/145 cặp. Ảnh lặp được đối chiếu từ lượt xem trước. Rubric: 0 không tương tự/không thể thay thế; 1 giống một phần/có thể cân nhắc; 2 rất giống/có thể thay thế. Mỗi record có reviewer ID `astra-codex-20261107`, lý do, confidence và `inspected_images=true`. Một số ảnh bao bì/cận chất liệu cần description hỗ trợ, được chấm confidence `medium`. Không có ảnh lỗi hay cặp unresolved.

Artifact private: `data/hm/processed/evaluation/v1-frozen-balanced-20261107/astra-labels.jsonl`; file này bị Git ignore và không được commit. Packet SHA-256 `9f0ac722b329abd183c00753b2376f752c9561bf0cc2ffb792353bad3ef6eb0f`; labels SHA-256 `607237d3aa54165c8ebb869ed4ee447a369567620d6319c25169d8762d83eb11`. Đây là checksum của artifact tại thời điểm báo cáo; nếu đổi file phải chạy lại validation.

## Kiểm chứng

| Check | Kết quả |
|---|---|
| `python scripts/hm/validate-astra-labels.py --packet data/hm/processed/evaluation/v1-frozen-balanced-20261107/blind-pairs.jsonl --labels data/hm/processed/evaluation/v1-frozen-balanced-20261107/astra-labels.jsonl` | exit 0; `COMPLETE`, 145 expected/labeled, 0 unlabeled |
| ID trùng, nhãn rỗng, lý do rỗng | 145 cặp unique; 0 thiếu/trùng; 0 lý do rỗng |
| Grade | 0: 12; 1: 86; 2: 47 |
| Confidence | high: 112; medium: 33; low: 0 |
| `git check-ignore` trên labels file | exit 0; file bị ignore |
| `python -m unittest discover -s scripts/hm/tests -q` | exit 0; 32/32 PASS |
| `git diff --check` | exit 0; cảnh báo chuyển LF→CRLF của Git, không có whitespace error |

## Cách dùng và giới hạn

Nhãn này là **AI-judged proxy**, không phải hai reviewer độc lập, human ground truth hoặc human approval. Không điền `human_review=APPROVED` vào manifest Hybrid từ kết quả này. Vì packet chỉ chứa top6 v1, không tính nDCG v1 như một phép so công bằng với v2 trên cùng pooled judgment set. Khi có v2 artifact thật, dùng cùng sample manifest để thêm các v2-only targets vào packet mù; giữ nhãn cặp cũ sau khi kiểm checksum và chấm thêm cặp mới. Sau đó cần người thật audit một mẫu, ưu tiên 33 cặp confidence medium và các cặp v1/v2 bất đồng trước khi đưa ra kết luận chất lượng. Không suy CTR/conversion từ nhãn này.

Không có DB write, model training, candidate publish, commit, push hay public upload trong lượt gán nhãn. [Kế hoạch và rubric](../astra-annotation-plan.md) lưu riêng trong docs.
