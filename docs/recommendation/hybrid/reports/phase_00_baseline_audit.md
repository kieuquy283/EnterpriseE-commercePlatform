# V2.1 Phase 00 — baseline audit

**07/11/2026 Asia/Saigon; branch `recommendation-pdp`; HEAD `cf16e0ba2e2af3519f79f5d1b516708d64a28605`; dirty tree from prior Hybrid work preserved. Status: PASS for private reproducibility.**

Read candidate manifests, Astra pooled report, image validation and embedding manifest. `analyze-hybrid-v2.py` checked V1/V2 candidate SHA and embedding SHA against manifests, reproduced scored per-context nDCG and verified each weighted V2 score from metadata similarity, image cosine and bounded popularity. Direct SHA checks of 605 MB local checkpoint, 496-vector artifact and image validation JSONL all returned `True`. Model/preprocess: LAION OpenCLIP ViT-B/32, `open_clip:create_model_and_transforms:validation`; checkpoint SHA `ac4f8c4b88af6d963118cbf40ad93176d092abbedfcb752601ae1866352656e6`.

`score-pdp-ai-proxy.py` baseline report: 29 judgeable of 40, V1 0.9151968623, V2 0.8974173862, delta −0.0177794761, paired 95% bootstrap [−0.0911490437, 0.0382488894]. Candidate sets are **identical in all 500 contexts** (3,198 rows each); changed top-six order/membership is reranking, not candidate expansion. Manifest/score paths are private under `data/hm/processed/`. No DB write or activation.
