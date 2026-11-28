# Kiểm soát rủi ro dependency

Tài liệu thực hiện OPS-05 trong [kế hoạch checkpoint](../DAYMARK_Ke_Hoach_Tuan_1_Checkpoints_18_20_22_11_2026_v1.3_PhanBoCheckpoint.md), phục vụ bảo mật [vận hành](../spec/06-operations.md). Script policy dưới đây thực thi mặc định chặn khi còn finding chưa được chấp nhận; workflow chạy kiểm thử policy, chủ repository cấu hình branch protection. Không cấp ngoại lệ phát hành. Hoàng review Medusa; Quý review storefront; Thắng quản lý triage; Quân cung cấp regression cô lập.

## Quy trình duy trì

Chạy tại root với Node/npm được ghim, lưu JSON và exit code riêng; không dùng `audit fix --force`. Phân biệt advisory gốc (`via` object) với gói chịu ảnh hưởng (`via` string). Dùng lockfile và `npm explain <package> --omit=dev` để xác nhận từng đường, phiên bản lồng nhau và workspace. Số package bị đánh dấu không là số lỗ hổng độc lập hay bằng chứng khai thác được.

Rà call site, nguồn đầu vào không tin cậy, tiền điều kiện advisory, quyền endpoint, giới hạn body/rate và artifact thực tế. Không tìm thấy import trong mã tùy chỉnh không chứng minh framework không gọi. Chỉ đánh dấu không tới được khi có đường gọi/cấu hình/artifact và kiểm thử chứng minh; còn thiếu bằng chứng dùng `UNKNOWN`.

Hai [Dockerfile backend](../../apps/backend/Dockerfile) và [storefront](../../apps/storefront/Dockerfile) chạy `npm ci` toàn workspace, giữ dev dependencies và build tools trong image. Vì vậy audit `--omit=dev` là mức tối thiểu, không phải kiểm kê toàn bộ runtime image; cần audit đầy đủ/SBOM và scan image theo digest trước release. Không coi mọi gói tooling là không được ship.

## Cổng kiểm tra dependency

Chạy `node --test scripts/ci-audit.test.mjs` trước `node scripts/ci-audit.mjs` với Node `24.22.1` và npm `11.12.1`. Script mặc định audit **toàn bộ cây dependency** vì các Dockerfile hiện giữ công cụ build/dev trong image. `--production-only` chỉ cung cấp bằng chứng bổ sung cho cây production; không thay kiểm kê artifact được ship.

[Script policy](../../scripts/ci-audit.mjs) phân biệt kết quả thu thập và kết luận trong phạm vi audit:

- `UNKNOWN` / exit 1: sai pin, lệnh lỗi/timeout, JSON/schema không hợp lệ, số đếm không khớp danh sách package, cạnh `via` không hợp lệ hoặc exit code mâu thuẫn. Lỗi thu thập luôn chặn, kể cả chế độ chỉ thu thập.
- `BLOCKED` / exit 1: còn finding bất kỳ mức độ nào và chưa có phê duyệt chấp nhận rủi ro. Không có allowlist, baseline exception, tự loại advisory withdrawn hoặc tự miễn trừ tooling. Policy bảo thủ này không suy ra mọi finding đều có thể khai thác.
- `AUDIT_CLEAR` / exit 0: registry không trả finding trong phạm vi đã chọn. Không đồng nghĩa release được duyệt, không thay regression, kiểm kê/scan image theo digest hay rà quyền và bí mật.

`--collect-only` cho phép lệnh thu thập hoàn chỉnh trả exit 0 khi còn finding, nhưng giữ nguyên verdict `BLOCKED` trong metadata. Chỉ dùng ở job bằng chứng không phát hành; không dùng làm security gate. Cờ `--enforce` tương thích với CI và luôn chặn finding, kể cả khi có thêm `--collect-only`. Owner CI cần gọi policy không có `--collect-only`, không `continue-on-error`, upload artifact cả khi fail và chạy bộ kiểm thử policy. Tệp workflow không thuộc thay đổi dependency này.

Artifact trong `ci-evidence/` gồm audit JSON và stderr đã làm sạch, exit code, commit SHA, trạng thái dirty, lock SHA-256, scope, Node/npm và UTC bắt đầu/kết thúc. Giữ bản thô của mỗi lần chạy trước khi chạy lại; số package lan truyền không phải số advisory độc lập. Metadata ghi `dirty` là bằng chứng trên working tree, không được gán thành kết quả của commit sạch.

Moderate/low vẫn cần xử lý hoặc quyết định rủi ro riêng; nhãn severity không là phê duyệt. Một cơ chế ngoại lệ tương lai cần task và đánh giá riêng, ràng buộc GHSA/package/version/path, SHA/digest, owner, người duyệt, lý do, kiểm soát bù, issue và hạn; tài liệu này không bật cơ chế đó.

CI chạy policy và bộ kiểm thử; workflow publish kiểm policy trước xác thực AWS. Chủ repository áp dụng branch protection theo [hợp đồng CI](ci-verification.md); cấu hình trong Git không chứng minh protection đã bật.

## Hướng sửa tương thích và giới hạn

Nhóm Medusa nâng đồng bộ lên `2.22.7`, kèm UI `4.2.14` theo peer dependency của draft-order. [Release chính thức](https://github.com/medusajs/medusa/releases/tag/v2.22.7) mô tả sửa Index Module và chuyển cross-module query sang join; cần regression catalog/query và migration trên DB dùng riêng trước tích hợp. Không chạy migration trên demo/shared DB từ việc đổi package. RBAC là dependency upstream đã có trong cây Medusa; thay đổi này không cài provider trả phí, không bật tính năng và không chứng minh quyền nhân viên.

Các đường sửa phải kiểm từ lockfile **và cây đã cài**, không chỉ khai báo manifest:

- Multer: [advisory upstream](https://github.com/expressjs/multer/security/advisories/GHSA-q7qp-rjg7-q26m) yêu cầu `>=2.5.0`; Medusa mới khai báo range tương ứng.
- Zod: [bản vá upstream 4.6.6](https://github.com/colinhacks/zod/releases/tag/v4.6.6) và [advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5); kiểm các bản lồng trong admin-sdk, draft-order và deps, không chỉ bản trực tiếp.
- GraphQL Tools: [bản vá 12.0.2](https://github.com/ardatan/graphql-tools/releases/tag/@graphql-tools/utils@12.0.2) cho incremental merge; nâng theo các dependency được Medusa hỗ trợ, không ép major của utility cũ bằng override toàn cục.
- Lodash: [advisory template](https://github.com/lodash/lodash/security/advisories/GHSA-r5fr-rjxr-66jc) sửa từ `4.18.0`; [array-path bypass](https://github.com/advisories/GHSA-f23m-r3pf-42rh) yêu cầu `4.18.1`.
- PostCSS: giữ Next `15.5.29`, pin patch `8.5.33` bằng npm override và dependency trực tiếp, thay vì đổi Next major theo gợi ý audit. [Bản vá source map 8.5.23](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) sửa phần còn thiếu của bản vá trước. Root giữ thêm dev dependency Next cùng phiên bản để neo override qua ranh giới workspace theo [lỗi npm đã ghi nhận](https://github.com/npm/cli/issues/9659); không đổi phiên bản runtime. Override cần được chứng minh đã áp dụng cho nhánh Next lồng và kiểm build/render/CSS; khai báo override tự nó không chứng minh đã vá.

[Picomatch GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) có trạng thái withdrawn trên nguồn GitHub. Giữ nguyên raw audit và ghi riêng sự khác biệt theo thời điểm registry; không sửa số raw và không suy diễn tất cả glob an toàn. Nếu registry vẫn trả finding, policy tiếp tục chặn.

## Cổng image và hệ điều hành

Npm audit không quét hệ điều hành. Image dùng Node 24 trên Alpine 3.24, áp dụng `apk upgrade --no-cache` trước khi cài dependency. Alpine dùng musl thay glibc nên phải kiểm native addon và runtime; không chỉ đổi tag để báo đã vá. [Alpine xác nhận zlib 1.3.2-r1 sửa CVE-2026-85091](https://security.alpinelinux.org/vuln/CVE-2026-85091); [Node có image Alpine chính thức](https://github.com/nodejs/docker-node#nodealpine).

CI `browser-container` quét OS và library trong cả hai image bằng Trivy, chặn HIGH/CRITICAL kể cả chưa có fix; không ignore hay allowlist. Report JSON nằm trong artifact CI. Job công bố AWS chờ ECR scan hoàn tất theo digest, từ chối scan lỗi/không hỗ trợ/thiếu số đếm hoặc HIGH/CRITICAL, rồi mới xuất release references. Quyền đọc scan chỉ thuộc hai ECR repository trong policy nguồn của publisher; thay đổi IaC không chứng minh role thực đã cập nhật.

Với phát hành thủ công, áp dụng cùng cổng ECR theo digest và lưu report trước khi đổi settings hoặc tăng task count. Medium/low vẫn được ghi và triage; không suy PASS của cổng này thành không có mọi loại rủi ro. Lệnh `manage.py start` kiểm scan của digest trong stack hiện hành trước khi đổi lease hoặc khởi động compute; chỉ chấp nhận repository của foundation, không tag mutable. Traffic tiếp tục tắt khi scan hoặc nghiệm thu runtime chưa đạt. Không tự gia hạn demo lease đã hết hạn chỉ để quét image.

## Override và kiểm chứng tương thích

Giữ BullMQ `5.13.0` theo Medusa, chỉ override UUID của BullMQ sang `11.1.1` có CommonJS. Các call site BullMQ dùng `v4()` không truyền buffer; bản vá [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) nằm ở UUID 11.1.1. Kiểm queue/worker, retry, dedupe và seed có Redis trước khi phát hành; không suy từ một API UUID sang toàn bộ module đã tương thích.

Rushstack vẫn ở `5.13.0`, override riêng AJV lên `8.20.0`; các consumer AJV 6 giữ nhánh `6.15.0`. Không ép chung hai major. Các dependency root của Rushstack, event-bus/workflow-engine và BullMQ là neo phân giải npm workspace để override có hiệu lực, không thêm service. Cùng lý do với Next ở trên: kiểm mọi bản lồng trong lock và dependency thực cài; xóa neo chỉ sau khi clean install chứng minh vẫn đúng.

Dashboard Medusa `2.22.7` khai báo `i18next@23.7.11`, nằm trong phạm vi [GHSA-6jcc-5g8w-32mx](https://github.com/advisories/GHSA-6jcc-5g8w-32mx). Root ghim `i18next@26.3.4` và override đúng phiên bản này; neo thêm `@medusajs/dashboard@2.22.7` ở root để npm áp dụng override xuyên backend workspace. Lockfile sau khi npm sinh lại chỉ có `node_modules/i18next@26.3.4`, không còn bản lồng `23.7.11`. Đây là thay đổi major của thư viện dịch: cần clean install, kiểm Admin build, chuyển ngôn ngữ và kiểm toàn bộ audit trên CI trước khi coi cổng bảo mật đã thông. Không nâng riêng Dashboard lên `2.23.0` vì phải đồng bộ Medusa và kiểm migration Admin/React. Regression build và đổi ngôn ngữ English/Français qua navigation/reload đã đạt trong container disposable ngày 28/11; CI thực thi helper trên bundle image, xem [bằng chứng và giới hạn](../report/release-ci-readiness-2026-11-28.md). Không suy kết quả này thành full Staff/Admin acceptance.

AJV/ajv-formats/ajv-keywords và SWC helpers ở root giữ các peer tương thích, cho phép consumer cũ có bản lồng đúng major. Audit không thay kiểm tra peer hoặc smoke artifact. Docker khai báo cả backend-local và root `NODE_PATH` cho lệnh CLI trực tiếp, không chỉ npm scripts.

Bằng chứng có ngày, giới hạn npm optional-package inventory và các lượt regression nằm ở [báo cáo tích hợp](../report/ops-dependency-integration-2026-11-20.md). Không dùng số audit cũ phía dưới làm kết luận của revision mới.

TODO(ops): Đối chiếu inventory optional Sharp/Emnapi trên clean image với npm ghim — npm ls toàn cây vẫn báo hai package extraneous dù không còn invalid peer; OPS-05.

## Ma trận nguyên nhân và hướng xử lý

Ma trận dưới đây giữ bối cảnh triage ban đầu, không phải kết quả audit sau nâng cấp. Các đường sau đọc từ dependency declarations trong lockfile baseline; mũi tên thể hiện phụ thuộc, không khẳng định luồng thực thi. Tình trạng mặc định là chưa chấp nhận rủi ro.

| Nhóm | Chuỗi và điều kiện tới được | Disposition / owner / xác minh trước đóng |
| --- | --- | --- |
| Zod | backend → `@medusajs/deps` → `zod`; backend khai báo trực tiếp 4.2.0; validators auth/cart import `@medusajs/framework/zod`. Bộ sưu tập lớn có thể gây tăng bộ nhớ; giới hạn ingress và toàn bộ schema framework chưa kiểm chứng | **BLOCK runtime UNKNOWN**, Hoàng; review bản đồng bộ Medusa/Zod, thử payload quá cỡ trong process cô lập có giới hạn RAM, kiểm 4xx và không crash |
| Multer | `@medusajs/medusa` → `multer` 2.4.0; upload multipart là bề mặt cần rà. Advisory đòi asynchronous fileFilter còn pending lúc request teardown; call path/cấu hình thực chưa xác nhận | **BLOCK runtime UNKNOWN**, Hoàng; xem upload middleware thực, auth/limit/timeout; review >=2.5.0 tương thích rồi regression upload và abort cô lập |
| GraphQL utilities | backend → `@medusajs/utils` → codegen → `@graphql-tools/utils` 10.11.0 và lodash lồng 4.17.23. Prototype pollution cần dữ liệu merge/path không tin cậy; template injection cần điều khiển imports key | **HOLD UNKNOWN**, Hoàng; chứng minh chỉ dùng schema nội bộ/build hoặc sửa đồng bộ; thử dữ liệu độc hại trong harness, không chạy trên dịch vụ chung |
| Glob/tooling | `@medusajs/deps` → awilix → fast-glob → micromatch → picomatch; MikroORM core → globby → fast-glob; migrations → umzug → fast-glob; admin bundler/Vite và Tailwind cũng có đường tới picomatch | **REVIEW withdrawn**, Thắng + Hoàng/Quý; không downgrade Vite tự động. Kiểm advisory thay thế, đầu vào glob và tooling được ship; cần ngoại lệ có hạn nếu registry còn trả finding |
| Next/PostCSS | storefront → Next 15.5.29 → PostCSS 8.4.31 lồng; CSS/sourceMappingURL không tin cậy là điều kiện quan trọng. Chưa thấy bằng chứng cho phép khách nạp CSS tùy ý, nhưng chưa chứng minh không tới runtime/build | **HOLD UNKNOWN**, Quý; review bản Next hỗ trợ và regression build/render/assets, kiểm source map và artifact; không đổi major chỉ theo `fixAvailable` |

Nguồn advisory: [Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), [Multer](https://github.com/advisories/GHSA-q7qp-rjg7-q26m), [GraphQL mergeDeep](https://github.com/advisories/GHSA-7mx3-vvmw-hjmv), [GraphQL incremental](https://github.com/advisories/GHSA-c4qx-w738-7hr3), [lodash template](https://github.com/advisories/GHSA-r5fr-rjxr-66jc), [picomatch](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), [PostCSS source map](https://github.com/advisories/GHSA-6g55-p6wh-862q), [PostCSS path traversal](https://github.com/advisories/GHSA-r28c-9q8g-f849). Các bản vá nêu trên là ứng viên rà, không là phiên bản đã thử.

Rà advisory mới và regression khi đổi lockfile; audit clear không thay nghiệm thu runtime hoặc scan image theo digest.

## Phụ lục bằng chứng có ngày: 18/11/2026

Snapshot riêng của lần rà OPS-05, không tự cập nhật thành trạng thái hiện tại. Baseline `1b6a668`; Node `24.22.1`, npm thực chạy `11.19.1` khác pin `11.12.1`; cần chạy lại bằng npm ghim trong CI trước nghiệm thu tái lập. Không cài dependency hay sửa lockfile.

- `npm audit --omit=dev --json`: exit audit 1, JSON hợp lệ, 109 findings theo package: 45 high, 64 moderate, 0 critical/low/info. Lệnh shell bao ngoài đọc JSON có thể exit 0; không dùng exit đó làm security pass.
- `npm explain multer zod awilix @graphql-tools/utils picomatch --omit=dev`: exit 0, đối chiếu được chuỗi cài đặt; không cài gói hoặc khởi động ứng dụng.
- Chạy đối chiếu với `--registry=https://registry.npmjs.org --fetch-retries=0 --fetch-timeout=20000` trả cùng tổng. Không gọi đây là snapshot 23-high cũ.
- Lock SHA-256: `e06987ac5de1a74d62b4cc55fa03302206c47e4e2d6976ebdeb1389df3181103`.
- JSON lần đầu SHA-256: `b7eeac8172d7d0a2af99ce00a126bca17b7a87c2ae1efd19da54f731765d4b6d`; bản thô tạm `/tmp/daymark-ops-audit.json`, không là artifact CI bền. Lần rà nguồn/advisory kết thúc khoảng `2026-11-18T15:47Z`; cần CI lưu start/end UTC chính xác cho lần tiếp theo.
- GitHub đánh dấu GHSA picomatch ở trên **withdrawn ngày 18/11/2026**, trong khi registry vẫn trả high. Giữ nguyên số raw, ghi discrepancy; không suy diễn withdrawn nghĩa mọi đường glob an toàn.
- npm gợi ý Medusa `2.22.7`, Next `16.4.6`, Vite `6.2.7` cho các chuỗi khác nhau. Đây chưa phải kế hoạch upgrade tương thích; Vite gợi ý downgrade major cần bác bỏ việc áp dụng mù. Hoàng review toàn bộ nhóm Medusa cùng phiên bản; Quý review Next và UI preset. Mọi package/lock change cần task riêng.

### Tất cả package high của snapshot

Bảng sau liệt kê đủ high, kể cả mức kế thừa; `via` là cạnh audit trực tiếp để lần ngược về ma trận nguyên nhân. Không có critical trong lần chạy này.

| Package | Via | Owner | Disposition |
| --- | --- | --- | --- |
| `@graphql-codegen/core` | @graphql-codegen/plugin-helpers, @graphql-tools/utils | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@graphql-codegen/plugin-helpers` | @graphql-tools/utils, lodash | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@graphql-codegen/schema-ast` | @graphql-codegen/plugin-helpers, @graphql-tools/utils | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@graphql-codegen/typescript` | @graphql-codegen/plugin-helpers, @graphql-codegen/schema-ast, @graphql-codegen/visitor-plugin-common | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@graphql-codegen/visitor-plugin-common` | @graphql-codegen/plugin-helpers, @graphql-tools/utils | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@graphql-tools/utils` | GHSA-7mx3-vvmw-hjmv, GHSA-c4qx-w738-7hr3 | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@medusajs/admin-bundler` | @medusajs/admin-vite-plugin, @medusajs/dashboard, glob, tailwindcss, vite | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@medusajs/admin-sdk` | zod | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@medusajs/admin-vite-plugin` | fdir | Hoàng | REVIEW withdrawn / chưa miễn trừ |
| `@medusajs/caching` | @medusajs/framework, awilix | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@medusajs/cli` | @medusajs/deps, @medusajs/utils, glob | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@medusajs/dashboard` | zod | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@medusajs/deps` | @mikro-orm/cli, @mikro-orm/core, @mikro-orm/knex, @mikro-orm/migrations, @mikro-orm/postgresql, @opentelemetry/instrumentation-pg, awilix, zod | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@medusajs/draft-order` | @medusajs/admin-sdk, @medusajs/cli, @medusajs/dashboard, @medusajs/framework, @medusajs/test-utils, zod | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@medusajs/framework` | @medusajs/cli, @medusajs/deps, @medusajs/modules-sdk, @medusajs/orchestration, @medusajs/utils, @medusajs/workflows-sdk, glob | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@medusajs/medusa` | @medusajs/admin-bundler, @medusajs/analytics, @medusajs/analytics-local, @medusajs/analytics-posthog, @medusajs/api-key, @medusajs/auth, @medusajs/auth-emailpass, @medusajs/auth-github, @medusajs/auth-google, @medusajs/auth-oidc, @medusajs/cache-inmemory, @medusajs/cache-redis, @medusajs/caching, @medusajs/caching-redis, @medusajs/cart, @medusajs/core-flows, @medusajs/currency, @medusajs/customer, @medusajs/draft-order, @medusajs/event-bus-local, @medusajs/event-bus-redis, @medusajs/file, @medusajs/file-local, @medusajs/file-s3, @medusajs/framework, @medusajs/fulfillment, @medusajs/fulfillment-manual, @medusajs/index, @medusajs/inventory, @medusajs/link-modules, @medusajs/locking, @medusajs/locking-postgres, @medusajs/locking-redis, @medusajs/notification, @medusajs/notification-local, @medusajs/notification-sendgrid, @medusajs/order, @medusajs/payment, @medusajs/payment-stripe, @medusajs/pricing, @medusajs/product, @medusajs/promotion, @medusajs/rbac, @medusajs/region, @medusajs/sales-channel, @medusajs/search, @medusajs/search-postgres, @medusajs/settings, @medusajs/stock-location, @medusajs/store, @medusajs/tax, @medusajs/translation, @medusajs/user, @medusajs/workflow-engine-inmemory, @medusajs/workflow-engine-redis | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@medusajs/modules-sdk` | @medusajs/deps, @medusajs/query, @medusajs/utils | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@medusajs/orchestration` | @medusajs/deps, @medusajs/utils | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@medusajs/query` | @medusajs/deps, @medusajs/utils | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@medusajs/ui-preset` | tailwindcss | Quý | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@medusajs/utils` | @graphql-codegen/core, @graphql-codegen/typescript, @medusajs/deps | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@medusajs/workflows-sdk` | @medusajs/deps, @medusajs/modules-sdk, @medusajs/orchestration, @medusajs/utils | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `@mikro-orm/cli` | @mikro-orm/core, @mikro-orm/knex | Hoàng | REVIEW withdrawn / chưa miễn trừ |
| `@mikro-orm/core` | globby | Hoàng | REVIEW withdrawn / chưa miễn trừ |
| `@mikro-orm/knex` | @mikro-orm/core | Hoàng | REVIEW withdrawn / chưa miễn trừ |
| `@mikro-orm/migrations` | @mikro-orm/core, @mikro-orm/knex, umzug | Hoàng | REVIEW withdrawn / chưa miễn trừ |
| `@mikro-orm/postgresql` | @mikro-orm/core, @mikro-orm/knex | Hoàng | REVIEW withdrawn / chưa miễn trừ |
| `anymatch` | picomatch | Hoàng | REVIEW withdrawn / chưa miễn trừ |
| `awilix` | fast-glob | Hoàng | REVIEW withdrawn / chưa miễn trừ |
| `chokidar` | anymatch, readdirp | Hoàng | REVIEW withdrawn / chưa miễn trừ |
| `fast-glob` | micromatch | Hoàng | REVIEW withdrawn / chưa miễn trừ |
| `fdir` | picomatch | Hoàng | REVIEW withdrawn / chưa miễn trừ |
| `globby` | fast-glob | Hoàng | REVIEW withdrawn / chưa miễn trừ |
| `lodash` | GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `micromatch` | picomatch | Hoàng | REVIEW withdrawn / chưa miễn trừ |
| `multer` | GHSA-q7qp-rjg7-q26m | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `picomatch` | GHSA-fc5q-39xc-vjpf | Hoàng | REVIEW withdrawn / chưa miễn trừ |
| `postcss` | GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849 | Quý | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |
| `readdirp` | picomatch | Hoàng | REVIEW withdrawn / chưa miễn trừ |
| `sucrase` | tinyglobby | Hoàng | REVIEW withdrawn / chưa miễn trừ |
| `tailwindcss` | chokidar, fast-glob, micromatch | Quý | REVIEW withdrawn / chưa miễn trừ |
| `tinyglobby` | fdir, picomatch | Hoàng | REVIEW withdrawn / chưa miễn trừ |
| `umzug` | fast-glob | Hoàng | REVIEW withdrawn / chưa miễn trừ |
| `vite` | fdir, picomatch, tinyglobby | Quý | REVIEW withdrawn / chưa miễn trừ |
| `zod` | GHSA-mrhx-c7xc-m3w5 | Hoàng | HOLD UNKNOWN; rà/sửa theo nhóm nguyên nhân |

Moderate cần theo dõi: Next kế thừa PostCSS; qs (đầu vào stringify comma), uuid qua BullMQ (buffer tùy chọn), instrumentation-pg (thuộc tính username trong span), ajv ($data), glob/minimatch (tài nguyên), selector-parser (CPU). Thắng phân issue; Hoàng nhận backend, Quý nhận frontend; chưa xác nhận khai thác hay vá. Không triển khai PoC/load, build image hoặc kiểm runtime trong lượt source-only này.
