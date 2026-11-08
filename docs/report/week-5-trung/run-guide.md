# Hướng dẫn chạy lại kiểm tra Tuần 5 của Trung

> Bộ Git chỉ gồm 19 file mã nguồn, tests và tài liệu. Evidence JSON/CSV/snapshots được giữ local để bàn giao riêng.

Các bước áp dụng trong worktree của nhánh hiện tại `week5-hm-concurrency`, với npm theo `packageManager`. Đọc [spec](spec.md), [phase](phase.md) và [báo cáo tuần 5](../week-5-report.md) trước khi chạy. Mỗi lần kiểm tra dùng ID/thư mục evidence mới để giữ nguyên lần PASS/FAIL trước.

Trạng thái bàn giao: backend development do task khởi chạy ở cổng 9000 đã được dừng sau kiểm thử; PostgreSQL/Redis vẫn chạy và giữ dữ liệu. Cần khởi động backend theo mục 1 trước khi chạy lại ca HTTP concurrency.

## 1. Điều kiện môi trường

- Node đáp ứng root package.json; lần kiểm tra hiện tại dùng Node 24.21.0, npm 11.12.x, Medusa 2.21.2.
- Dependencies đã cài đúng lockfile. Không tạo lockfile khác hoặc chạy cài lại chỉ vì lỗi sandbox/cache.
- Với phần live, PostgreSQL, Redis và backend phải cùng môi trường local/dev. Đặt cấu hình database/Redis từ nguồn riêng trong session hoặc file môi trường hợp lệ; không in URL có credentials, token hoặc nội dung `.env` vào log/evidence.
- Để kiểm H&M live, database và file mapping được chọn phải thuộc cùng lần import. Lần đầu `commerce` tại `localhost:15432` chỉ có 4 seed product/variant, không khớp mapping ZIP. Sau xác nhận nguồn chỉ gồm CSV/artifact, người dùng đã cho phép import mẫu giới hạn 500 product vào development và tạo mapping riêng; kiểm tra sau import phải dùng file mới đó.
- Không tự seed/import lại hoặc restore đè database hiện có. Việc dùng bản sao lưu phải giữ dữ liệu hiện tại và theo môi trường dev/test đã thống nhất.
- Concurrency cần backend HTTP local đang chạy, mặc định `http://127.0.0.1:9000`, cùng database/Redis với CLI. Các seed nền Vietnam region/VND, Online Store/publishable key, Vietnam Warehouse liên kết kênh, default shipping profile và shipping option, `pp_system_default` phải đã tồn tại.

Worktree không có `.env` riêng. Trên Windows, nạp cấu hình private trực tiếp cho tiến trình Node bằng **đường dẫn file**, không copy hoặc in nội dung. Mở PowerShell tại root worktree và đặt các biến đường dẫn này trong mỗi terminal dùng cho phần live:

```powershell
$week5EnvPath = "C:\demo1\EnterpriseE-commercePlatform\.env"
$week5NpmCli = Join-Path $env:ProgramFiles "nodejs/node_modules/npm/bin/npm-cli.js"
$env:NODE_ENV = "development"
```

Nếu cấu hình private đặt ở nơi khác, thay đường dẫn `$week5EnvPath` bằng file hợp lệ đã được chỉ định. `--env-file` chỉ nạp biến cho process; không tạo bản `.env` mới trong worktree. Database/Redis trong file phải đúng môi trường dev/test đang kiểm.

Nếu cần chạy backend, dùng terminal riêng từ root worktree:

```powershell
$env:ADMIN_DISABLED = "true"
node --env-file=$week5EnvPath $week5NpmCli run dev --workspace @dtc/backend
```

Terminal backend này dùng chế độ không build Admin UI cho phần kiểm backend của task. Nếu backend đúng môi trường đã chạy ở cổng 9000, dùng instance đó. Không mở thêm server hoặc đổi database của server trong khi test đang chạy. Các ví dụ `npm run` vẫn dùng được nếu session đã có cấu hình private; các lệnh có Node loader dưới đây chạy được khi worktree không có `.env`.

## 2. Audit nguồn/catalog/mapping offline

Giữ các input trong `data/hm/` gitignored:

```text
data/hm/articles.csv
data/hm/processed/catalog.jsonl
data/hm/processed/manifest.json
data/hm/processed/medusa-mapping.jsonl
```

Không cần đọc customer/transaction hoặc tạo interactions cho task này. Từ root:

```powershell
$week5AuditId = "week5-hm-" + (Get-Date -Format "yyyyMMdd-HHmmss")
$week5AuditEvidence = Join-Path (Get-Location) ("docs/report/evidence/" + $week5AuditId)
python scripts/hm/audit-catalog.py --output-dir $week5AuditEvidence
```

Nếu dữ liệu nằm ở vị trí riêng, dùng `--data-dir` trỏ tới thư mục chứa `articles.csv` và `processed/`. Không copy raw dataset vào thư mục report.

Tool ghi `offline-run.json`, `offline-audit.json`, `offline-findings.csv`; report/run metadata ghi command, source baseline/hash, input mapping/hash và ngày giờ. Exit 0 chỉ khi report `PASS`; lỗi parse/input hoặc findings trả exit khác 0. Đọc counts, hash, finding code và phạm vi; article nguồn ngoài mẫu không bắt buộc có mapping. Công cụ từ chối ghi đè evidence đã chạy hoặc còn dở; chọn output mới cho lần chạy lại.

## 3. Audit H&M trên Medusa live

Chỉ chạy khi CLI đã trỏ đúng môi trường cần kiểm. Audit là read-only; nó không tự nhập hoặc sửa dữ liệu. Có thể nối kết quả với audit offline cùng input/thời điểm bằng biến output:

```powershell
$env:NODE_ENV = "development"
$env:HM_AUDIT_OUTPUT_DIR = $week5AuditEvidence
node --env-file=$week5EnvPath $week5NpmCli run backend:check:hm-data-quality
```

Nếu dùng input ở nơi khác, đặt `HM_AUDIT_DATA_DIR` thành đường dẫn thư mục H&M tương ứng; giữ nguyên source và mapping đã kiểm offline. Biến này chứa đường dẫn dữ liệu, không phải secret.

Output gồm `live-run.json`, `live-audit.json`, `live-mapping.csv`, `live-inventory.json`; khi không hoàn thành vì runtime/schema/connectivity, có thể có `live-audit-incomplete.json`. Run metadata ghi target host/port/database đã lược credentials, selected mapping, command và source hashes. Tool fail khi có finding; không đánh dấu live PASS từ việc CLI đã khởi chạy hoặc đã tạo file. Offline/live có thể chia sẻ thư mục cho cùng lần đối chiếu; chạy lại cùng mode phải dùng thư mục mới để không ghi đè.

Khi toàn bộ mapping ID không có trong database đang kết nối, giữ report FAIL và kiểm lại lựa chọn database. Không chạy importer hoặc remap để làm mất dấu mismatch. Lần kiểm tra sau import đã được cho phép phải ghi vào thư mục mới với mapping mới được chọn rõ ràng; không ghi đè evidence đầu `week5-hm-20261108-001` hoặc mapping ZIP gốc.

Các lần đọc qua module/query có pagination là tuần tự, không phải snapshot nguyên tử xuyên module. Không chủ động import/sửa H&M đồng thời với audit. Giá được kiểm là persisted base VND; đây chưa phải phép kiểm calculated price Store API cho mọi context.

### 3.1 Import mẫu giới hạn và chọn mapping mới

Bước này có ghi dữ liệu development và chỉ phục vụ mẫu 500 product đã được người dùng cho phép. Sau khi đã có dữ liệu/mapping đúng, chạy audit trực tiếp; không import lại để thay cho một lần kiểm tra.

Giữ nguyên `data/hm/processed/medusa-mapping.jsonl` của ZIP. Chọn file output **chưa tồn tại** và trỏ importer tới catalog đã kiểm offline. Từ root worktree, với session database/Redis đã cấu hình đúng:

```powershell
$week5ImportId = Get-Date -Format "yyyyMMdd-HHmmss"
$env:HM_IMPORT_CATALOG_PATH = Join-Path (Get-Location) "data/hm/processed/catalog.jsonl"
$env:HM_IMPORT_MAPPING_PATH = Join-Path (Get-Location) ("data/hm/processed/medusa-mapping-week5-" + $week5ImportId + ".jsonl")
Push-Location apps/backend
node --env-file=$week5EnvPath $week5NpmCli exec -- medusa exec ./src/scripts/import-hm-catalog.ts
Pop-Location
```

Explicit mapping output từ chối ghi đè file đã có. Importer dùng Medusa workflows và metadata synthetic, không đổi các ID trong mapping ZIP. Kiểm log số created/existing/mapped và chỉ tiếp tục khi import thực sự hoàn tất; file mapping một phần không đủ để kết luận đạt.

Audit cả nguồn và live với **đúng file mapping mới** vào thư mục evidence mới:

```powershell
$week5AuditId = "week5-hm-" + (Get-Date -Format "yyyyMMdd-HHmmss")
$week5AuditEvidence = Join-Path (Get-Location) ("docs/report/evidence/" + $week5AuditId)
python scripts/hm/audit-catalog.py --mapping-file $env:HM_IMPORT_MAPPING_PATH --output-dir $week5AuditEvidence
$env:HM_AUDIT_MAPPING_PATH = $env:HM_IMPORT_MAPPING_PATH
$env:HM_AUDIT_OUTPUT_DIR = $week5AuditEvidence
node --env-file=$week5EnvPath $week5NpmCli run backend:check:hm-data-quality
```

Khi mở terminal mới, đặt lại đường dẫn selected mapping đã được ghi nhận cho đúng lần import; không để default trỏ về ZIP cũ rồi coi mismatch là lỗi dữ liệu mới. Báo cáo cuối ghi tên/hash của cả mapping gốc và mapping được chọn, cùng lý do đổi môi trường.

## 4. Hai khách checkout đồng thời

Đây là bài test có tạo dữ liệu dev: mỗi round tạo product/variant/inventory mới với một đơn vị hàng, hai customer, hai cart và một Order dự kiến thành công. Không sửa stock của H&M hoặc fixture tuần trước. Mỗi lần chạy dùng run ID chưa tồn tại:

```powershell
$env:NODE_ENV = "development"
$week5ConcurrencyId = "run-" + (Get-Date -Format "yyyyMMdd-HHmmss")
node --env-file=$week5EnvPath $week5NpmCli run backend:check:inventory-concurrency -- $week5ConcurrencyId 3
```

Đối số thứ hai là số round từ 1 đến 5, mặc định 3. Run ID chỉ dùng chữ, số, `_`, `-`, dài tối đa 90 ký tự. Có thể đặt `WEEK5_BASE_URL` cho cổng HTTP local phù hợp; runner từ chối production hoặc DB/Redis/backend không local. Không đổi endpoint sang máy cloud để bỏ qua giới hạn.

Runner chuẩn bị hai cart quantity 1, đồng bộ thời điểm phát hai request complete, chờ cả hai kết thúc rồi đọc snapshot. Evidence nằm tại `docs/report/evidence/week5-inventory-concurrency-<run-id>/`.

Chỉ kết luận round đạt khi request intervals thật sự overlap, đúng một Order có thể đọc lại, bên thua bị thiếu hàng, cả Cart–Order/reservations và tồn còn bán khớp. HTTP 200 riêng lẻ hoặc hai request chạy lần lượt không đủ. Nếu run dừng, đọc `manifest.json`, `failure.json`, snapshot gần nhất và danh sách fixture trước; không reset stock hoặc gửi lại Complete theo phỏng đoán.

Mỗi lần chạy lại tạo fixture mới. Dữ liệu giữ lại để review; không tự hủy/fulfill, xóa reservation, xóa database hoặc `docker compose down -v`. Báo lại Order/reservation và cleanup state thực tế.

## 5. Kiểm tra mã

Từ root worktree:

```powershell
python scripts/hm/tests/test-audit-catalog.py -v
npm run typecheck --workspace @dtc/backend
npm run lint --workspace @dtc/backend
```

Bản build đã kiểm chứng biên dịch backend với Admin UI disabled, dùng cấu hình private đã nêu ở mục 1. Từ root:

```powershell
$week5PreviousAdminSetting = $env:ADMIN_DISABLED
try {
  $env:ADMIN_DISABLED = "true"
  node --env-file=$week5EnvPath $week5NpmCli run build --workspace @dtc/backend
} finally {
  $env:ADMIN_DISABLED = $week5PreviousAdminSetting
}
```

Backend build không bao gồm bundle Admin UI trong phạm vi kiểm backend này. Xem code-validation cuối (bằng chứng lưu riêng) cho các lệnh, phạm vi và kết quả sau khi sửa P2.

Các unit tests backend chạy từ `apps/backend`; npm script giữ `TEST_TYPE=unit`. Chỉ chọn source và đường dẫn `.ts` rõ ràng để lần chạy sau build không lấy thêm bản JavaScript trong `.medusa/server`:

```powershell
$week5UnitTests = @(
  "src/scripts/hm-data-quality/__tests__/validation.unit.spec.ts"
  "src/scripts/hm-data-quality/__tests__/provenance.unit.spec.ts"
  "src/scripts/hm-data-quality/__tests__/evidence.unit.spec.ts"
  "src/scripts/inventory-concurrency/__tests__/validation.unit.spec.ts"
)
npm run test:unit -- --roots src --runTestsByPath @week5UnitTests
```

Bộ source có bốn suites, 33 tests: H&M 22 và concurrency 11. Python audit có 8 tests. Các tests H&M bao gồm giá có điều kiện và lỗi ghi/publish evidence; report PASS chỉ được công bố sau khi artifact hỗ trợ hoàn tất. Lint cuối đạt 0 lỗi/0 cảnh báo, typecheck và backend build đạt. Run concurrency cuối `week5-20261108-002` đạt 15/15 checks; cùng ba vòng trước là 60/60. Unit/offline PASS không thay thế live audit hoặc HTTP concurrency.

Nếu Windows sandbox chặn native CLI/Jest vì SWC cần ghi cache ngoài workspace, chạy lại đúng lệnh theo cơ chế phê duyệt của môi trường. Đây là vấn đề quyền ghi cache, không phải bằng chứng thiếu dependency; không xóa cache, lockfile hoặc cài lại gói để che lỗi. Không tắt Medusa lint để build qua.

## 6. Đọc và bàn giao kết quả

Giữ riêng kết luận offline, H&M live và concurrency. Mỗi report cần command, run ID, source baseline, ngày giờ UTC/UTC+07, môi trường đã lược bí mật, counts, expected/actual, evidence links, giới hạn và bước còn thiếu. Rà artifact không có token/password/Authorization/Cookie/email đầy đủ hoặc raw H&M trước bàn giao.

Không ghi PASS theo hướng dẫn expected; lấy kết quả từ report/validation thực tế. Bộ Git giữ một báo cáo tuần, spec/phase, hướng dẫn chạy lại, mã/tests. Evidence được lưu riêng. Raw dataset, các báo cáo chi tiết trùng và source archives đầy đủ giữ local.
