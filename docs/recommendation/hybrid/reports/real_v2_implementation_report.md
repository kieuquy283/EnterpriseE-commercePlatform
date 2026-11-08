# Real Hybrid v2 — private implementation and Astra evaluation

**Ngày:** 07/11/2026 Asia/Saigon. **Branch:** `recommendation-pdp`, local uncommitted changes. **Verdict:** real offline v2 artifact created and evaluated as AI proxy; quality improvement NOT_DEMONSTRATED; Hybrid publication NO-GO.

An isolated Python 3.10 venv lives below Git-ignored `data/hm/private-ml/`. CPU packages: `torch 2.14.1+cpu`, `open_clip_torch 4.2.1`. The [official LAION OpenCLIP ViT-B/32 checkpoint](https://huggingface.co/laion/CLIP-ViT-B-32-laion2B-s34B-b79K) `open_clip_model.safetensors` was downloaded privately (605,143,316 bytes; SHA-256 `ac4f8c4b88af6d963118cbf40ad93176d092abbedfcb752601ae1866352656e6`). Its card lists MIT. The local model-use record is ignored; public H&M image rights remain unverified.

`build-visual-embeddings.py` verified image SHA against `image-validation.jsonl` and encoded all **496 valid images** to 512-dimensional vectors on CPU. Article vectors mapped to **496/500 Medusa Products**; representative-article Product aggregation was used. The ignored manifest records model, preprocessing, image and embedding checksums. `build-hybrid-candidates.py` produced two private immutable runs: weighted metadata/image/popularity (`0.40/0.45/0.15`) and RRF. Each has **3,198 PDP candidate rows**, 167/500 contexts with at least six and 77 zero. Existing Home rows were retained. Weighted v2 changed top-six order for 261 of 423 nonempty contexts and the set for 130. Its structural top-six catalog coverage was 0.800 versus v1's 0.836.

The same frozen **40 PDP contexts** were used for AI evaluation. Weighted v2 added 26 source–target pairs beyond the 145 v1 labels. Astra viewed the 27 distinct JPEGs for these pairs and graded all 26 (0: 3, 1: 20, 2: 3). `validate-astra-labels.py` returned `COMPLETE`; the pooled set has 171/171 labels. `score-pdp-ai-proxy.py` verified candidate SHA against the frozen manifest and calculated paired macro nDCG@6:

| Metric | V1 metadata | V2 weighted OpenCLIP |
|---|---:|---:|
| Judgeable contexts | 29/40 | 29/40 |
| Mean nDCG@6 | **0.9152** | **0.8974** |
| Paired delta v2 − v1 | — | **−0.0178** |
| Paired bootstrap 95% interval | — | **[−0.0911, 0.0382]** |
| Contexts with six candidates | 20/40 | 20/40 |

Eleven contexts had no positive judged target in the pooled top six and were reported as **unjudgeable**, not assigned an invented score. The interval crosses zero. Labels are **Astra AI proxy**, not independent human ground truth. No CTR/conversion, full-catalog quality or improvement claim follows from this pilot. The RRF variant is generated but not yet compared with labeled relevance.

Private artifacts: `data/hm/processed/hybrid/embeddings-openclip-b32-v1/`, `weighted-openclip-b32-v1/`, `rrf-openclip-b32-v1/`, and `data/hm/processed/evaluation/weighted-openclip-b32-v1-blind/ai-proxy-report.json`. All are Git ignored. Commands run: venv/PyTorch/OpenCLIP install; Hugging Face checkpoint download; local model load; embeddings, weighted/RRF candidates, structural evaluation, Astra label validation and AI proxy scoring (all final runs exit 0). Python tests 32/32 PASS. Initial PyTorch single-index install failed on transitive dependencies; using PyPI plus CPU index fixed it.

**Decision:** keep the v1 metadata run active. Before private publication, inspect weak contexts, test variants on a separate validation set, obtain human review and confirm rights for image-derived artifacts. If these 40 contexts guide tuning, use a new untouched holdout before claiming improvement. No DB migration, Hybrid publish, frontend activation, commit or push occurred.
