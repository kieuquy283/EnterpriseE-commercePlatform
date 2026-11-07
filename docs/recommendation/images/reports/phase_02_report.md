# Phase 02 report — Kaggle download

> **Update, 2026-11-06:** The user refreshed CLI credentials. Selective per-image download now works. 496 mapped Product images were acquired (493 representatives plus three same-Product variants); four Products remain without an available mapped image. See [actual commands and coverage](real_hm_images_2026-11-06.md). The BLOCKED verdict below is historical.

Time: 2026-11-06 Asia/Saigon. Branch `recommendation-pdp`; baseline SHA `452799380adb9745c1c3f480c484df20761f0970`. Environment: Windows, Python 3.10, Kaggle API 1.7.4.5; test DB not used.

Objective/input: bounded authenticated acquisition from Kaggle. Files: `scripts/hm/download-images.py`, its unit tests, [instructions](../phase_02_kaggle_download.md). Commands: `kaggle competitions download --help` (0; `-f` supported), `kaggle competitions files -c h-and-m-personalized-fashion-recommendations` (401 Unauthorized), `python scripts/hm/download-images.py --limit 1` (1; requested 1, downloaded 0, failed 1, bytes 0), `python -m unittest discover -s scripts/hm/tests -v` (0; resume, simulated failure and ZIP extraction cases PASS).

Expected: 10–20 real sample images with IDs verified. Actual: 0 downloaded, 0 bytes, Kaggle pilot NOT_RUN; selective behavior for this competition unverified. Retry/resume fixture tests PASS. Security: credential contents never printed; full archive not requested. Self-review: CLI support in general is not evidence this competition grants per-image download. Recovery: fix Kaggle authorization and accept rules through normal account process, then run `python scripts/hm/download-images.py --limit 20`, validate before larger bounded run. Rollback: no acquired files. **Verdict: BLOCKED.**
