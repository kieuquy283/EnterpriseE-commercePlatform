# PDP checkpoint — bàn giao các gate còn mở

Verified code commit: `9dfd91e6658e12dc8246321f7d603460594ed7f6`,branch recommendation-pdp. Phase00–04 technical gates verified;Phase05 PARTIAL vì PDP30RPS chưa đạt;Phase06 reporting hoàn tất. Final docs/evidence cập nhật sau code commit không thay implementation đã test. [Draft PR9](https://github.com/kieuquy283/EnterpriseE-commercePlatform/pull/9),không merge.

## Đã chạy

Python9,unit32,HTTP4,production browserON19/OFF1 exit0;backend-OFF actualAPI404 vàChromium frontendON fallbackPASS. Logs vàsource hashes trong evidence/system report. PDP30RPS1API48.83% errors/0dropped,p95732.81ms;3API24% errors/5dropped,p951494.61ms,k6exit1. Redis/PGfault+recovery,ready-run rollback/restorev3 đã kiểm. Default public flags vẫnOFF.

## Việc tiếp theo

1. Backend/QA profile native Medusa price/inventory hydration và CPU/batch queries trên workload30 PDPcontexts;giữ cùng limit/threshold/SLO. Sửa bottleneck,rerun k6 cho tới khierror<1%,dropped0,p95<800ms hoặc có quyết định thay target được phê duyệt riêng. Không dùng completed stale price/stock snapshot đểpass.
2. Reviewer người thật chấm20 contexts/weighted+baseline theo protocol;agent chỉ ghiAGENT_REVIEW. Human gateNOT_RUN.
3. Chủ dataset xác minh quyềnmetadata/ảnh/derived assets từ điều khoản đã chấp nhận;PUBLICNO-GO cho tới khi có bằng chứng.
4. Theo dõi actualCI trên HEAD củaPR,review trước merge. API tests code9dfd91e success;fullCI cùngSHA đãsuccess. Chưa chạy lại trên main vì chưa merge.

## Commands tái chạy

Theo [PDP runbook](../runbook.md). Chạy backendbuild→restart trước benchmark,không restart giữaHTTPsuite. Tái tạo private browser/load context files từmapping/candidatecounts nếu máy mới;không đưa chúng vàoGit. Các command chưa chạy: benchmark100k/150–300RPS/endurance/cloudHA/fullWCAG,human review vàpublicrelease;không bắt buộc hoặc không thể tự xác nhận trong phạm vi phiên này.

## Môi trường còn hoạt động

TestAPI9002/proxy9004,PG5434/Redis,modelpdp-private-v3 active. Private productionON8003 qua faultproxy9006,OFF8004;devpreview8001 của phiên trước được giữ. API/Nextbackend-OFF tạm9007/8005 đã stop;scaleAPI2/3/proxy9005 đã stop. Không xóa database/volumes. Zipinput của người dùng còn untracked,không upload.
