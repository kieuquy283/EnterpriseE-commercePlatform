# Hybrid Recommendation V2.1 — quality recovery

**Trạng thái:** Phase 00–01 đạt cho private audit, Phase 02 đã khóa holdout nhưng chưa có human labels, Phase 03 tạo ablations nhưng chưa đủ nhãn để tính điểm, Phase 04–06 chưa triển khai/publish. **Quyết định hiện tại:** giữ V1 active; xem [NO-GO report](reports/final_v2_1_decision.md).

Mục tiêu V2.1 là cải thiện Similar Products PDP trên cùng catalog Medusa và ứng viên có thể bán, không mở rộng sang personalization hay online inference. Baseline thực tế: V1 0.9152, weighted V2 0.8974 macro nDCG@6 trên 29 contexts có nhãn Astra proxy; delta −0.0178, 95% paired bootstrap [−0.0911, 0.0382]. Mẫu 40 contexts này là **development data**, không dùng làm final unseen test. Các con số không chứng minh nguyên nhân hay human relevance.

| Phase | Mục tiêu và artifact | Gate |
|---|---|---|
| 00 | Khóa Git SHA, candidate/model/image/label hashes và tái tạo điểm; [audit](reports/phase_00_baseline_audit.md) | SHA, score và candidate universe khớp |
| 01 | Phân tích từng cặp, score decomposition, swaps, win/loss/tie; [analysis](reports/phase_01_error_analysis.md) | Mỗi context giảm điểm có rank/membership evidence |
| 02 | Khóa 100 contexts không trùng dev, rubric blind 0–2, hai người chấm; [protocol](reports/phase_02_label_protocol.md) | Holdout sealed trước tuning; human labels chưa có thì BLOCKED |
| 03 | Metadata, image-only, 80/20, 60/40, V2 cũ, RRF trên cùng pool; [ablation](reports/phase_03_ablation.md) | Chỉ báo quality khi union top6 được chấm đủ |
| 04 | Chỉ sửa taxonomy/image fallback/variant representation/candidate pool nếu diagnosis chứng minh; [status](reports/phase_04_v2_1_candidates.md) | Artifact bất biến, không giảm coverage không giải thích |
| 05 | Human blind holdout, paired nDCG@6, CI theo Product context; [status](reports/phase_05_blind_evaluation.md) | GO khi delta >0 và lower 95% CI >0, không hại category/coverage |
| 06 | Medusa private canary, API/E2E/PDP k6, rollback; [status](reports/phase_06_system_verification.md) | Chỉ khi phase 05/human/rights gate cho phép |

**Critical path:** 00 → 01 → 02 holdout sealed → 03 dev ablation và nhãn bổ sung → tối đa một finalist 04 → 05 human holdout → 06 private integration. Dừng mở rộng scope nếu ablation không hơn V1 trên dev; một NO-GO có evidence là kết quả hợp lệ. Các H&M images, model, vectors, candidate/label rows và holdout IDs chỉ ở Git-ignored `data/hm/`; docs chỉ chứa aggregates. Không tự điền `human_review=APPROVED`, không thay active version trước gate.
