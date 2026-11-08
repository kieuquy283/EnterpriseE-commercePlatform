# Hybrid v2 — private implementation runbook

**Chưa có Hybrid run được publish.** Chỉ dùng test DB `recommendation_test` hoặc `hm_hybrid_test`; không chạy script publish vào `commerce`/production. H&M CSV/JPEG, vectors, candidates, license record và review forms ở `data/hm/` (ignored). Không copy artifacts vào Git.

## Các gate trước khi chạy inference

1. Xác minh DB đích bằng `apps/backend/src/scripts/check-hm-mapping.ts` trên môi trường test; readback phải khớp 1.874 SKU/Variant/Product hiện hành. Docker daemon cần chạy. Không dùng số đếm lịch sử thay cho readback.
2. Kiểm quyền H&M/private image/derived embeddings. Quyền public vẫn NO-GO theo [rights decision](../dataset-rights-decision.md).
3. Chọn model `ViT-B-32` checkpoint **local** đã được review; lập JSON private có `model_id`, `license_source`, `approved_private: true`. Script không tải weights. [OpenCLIP upstream](https://github.com/mlfoundations/open_clip) là thư viện khả dụng; [một model card LAION ViT-B/32](https://huggingface.co/laion/CLIP-ViT-B-32-laion2B-s34B-b79K) gắn MIT nhưng nói deployed use cần đánh giá riêng. Đây là ví dụ để kiểm license, **không phải model đã được chọn/duyệt**. Pin và cài PyTorch/OpenCLIP trong ML environment riêng sau khi chốt model; hiện repo chưa thêm dependency đó.

## Offline commands sau gate

```powershell
python scripts/hm/build-visual-embeddings.py --weights data/hm/private-model/model.bin --model-license-record data/hm/private-model/license.json --output data/hm/processed/hybrid/embeddings-v1 --batch-size 8
python scripts/hm/build-hybrid-candidates.py --embeddings data/hm/processed/hybrid/embeddings-v1/article-embeddings.jsonl --output data/hm/processed/hybrid/weighted-v1 --version hybrid_private_v1 --method weighted
python scripts/hm/build-hybrid-candidates.py --embeddings data/hm/processed/hybrid/embeddings-v1/article-embeddings.jsonl --output data/hm/processed/hybrid/rrf-v1 --version hybrid_private_rrf_v1 --method rrf
python scripts/hm/evaluate-hybrid.py --candidates data/hm/processed/candidates-product-detail.jsonl --output data/hm/processed/hybrid/baseline.json
python scripts/hm/evaluate-hybrid.py --candidates data/hm/processed/hybrid/weighted-v1/candidates-product-detail.jsonl --output data/hm/processed/hybrid/weighted-evaluation.json
```

`--output` phải mới; rerun cùng version embedding tiếp tục từ `partial.jsonl` nếu source/model/config giống; candidate output bất biến, dùng thư mục/version mới để so thuật toán. Đánh giá bằng người thật và rubric Phase 01/04 trước khi chọn winner. Coverage/diversity không chứng minh visual relevance; H&M purchases không cho CTR.

## Publication gate

`apps/backend/src/scripts/publish-hm-recommendations.ts` hỗ trợ `HM_HYBRID_ARTIFACT_DIR` nhưng từ chối nếu `NODE_ENV` khác `test`, DB name không phải test, `HM_HYBRID_PUBLISH_APPROVED` khác `1`, hoặc manifest chưa ghi `human_review=APPROVED`, `private_rights=APPROVED`. Đây là cờ vận hành **sau** khi có review records, không phải cách tự tạo bằng chứng. File candidates phải khớp SHA-256 trong manifest. Publisher cũ cho metadata/Home giữ nguyên. Bật frontend/backend flags sau khi API/rollback/commerce tests pass; tắt frontend flag cần rebuild Next.js.

## Test và rollback

`python -m unittest discover -s scripts/hm/tests -v`; `npm run test:unit --workspace=@dtc/backend`; `npm run test:integration:http --workspace=@dtc/backend` trên disposable runner DB; `npm run typecheck --workspace=@dtc/storefront`; Playwright/k6 theo [Phase 07](phase_07_system_testing_release.md). Nếu publish fail, old active pointer còn nguyên. Nếu v2 gây lỗi, activate lại metadata ready run bằng script hiện có hoặc tắt `ENABLE_RECOMMENDATIONS`/`NEXT_PUBLIC_ENABLE_RECOMMENDATIONS`; không xóa Product/Order/volume. Public flag tiếp tục OFF cho đến quyền và NFR gate.
