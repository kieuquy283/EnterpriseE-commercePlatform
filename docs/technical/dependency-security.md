# Kiểm soát rủi ro dependency

Tài liệu thực hiện OPS-05 trong [kế hoạch checkpoint](../DAYMARK_Ke_Hoach_Tuan_1_Checkpoints_18_20_22_11_2026_v1.3_PhanBoCheckpoint.md), phục vụ bảo mật [vận hành](../spec/06-operations.md). Chính sách dưới đây là **đề xuất chờ Quý và người phụ trách CI duyệt**, chưa thay workflow hay cấp ngoại lệ phát hành. Hoàng review Medusa; Quý review storefront; Thắng quản lý triage; Quân cung cấp regression cô lập.

## Quy trình duy trì

Chạy tại root với Node/npm được ghim, lưu JSON và exit code riêng; không dùng `audit fix --force`. Phân biệt advisory gốc (`via` object) với gói chịu ảnh hưởng (`via` string). Dùng lockfile và `npm explain <package> --omit=dev` để xác nhận từng đường, phiên bản lồng nhau và workspace. Số package bị đánh dấu không là số lỗ hổng độc lập hay bằng chứng khai thác được.

Rà call site, nguồn đầu vào không tin cậy, tiền điều kiện advisory, quyền endpoint, giới hạn body/rate và artifact thực tế. Không tìm thấy import trong mã tùy chỉnh không chứng minh framework không gọi. Chỉ đánh dấu không tới được khi có đường gọi/cấu hình/artifact và kiểm thử chứng minh; còn thiếu bằng chứng dùng `UNKNOWN`.

Hai [Dockerfile backend](../../apps/backend/Dockerfile) và [storefront](../../apps/storefront/Dockerfile) chạy `npm ci` toàn workspace, giữ dev dependencies và build tools trong image. Vì vậy audit `--omit=dev` là mức tối thiểu, không phải kiểm kê toàn bộ runtime image; cần audit đầy đủ/SBOM và scan image theo digest trước release. Không coi mọi gói tooling là không được ship.

## Cổng CI và phát hành đề xuất

[CI tại baseline `1b6a668`](../../.github/workflows/ci.yml) chạy `npm audit --omit=dev --audit-level=high` với `continue-on-error: true`; job xanh không có nghĩa đạt security gate. Trong checkout dùng chung, cộng tác viên đang thay bước này bằng `scripts/ci-run.mjs audit` và upload artifact, không còn `continue-on-error` tại lúc rà cuối; chưa chạy/duyệt thay đổi đó trong phạm vi OPS-05 này. Gate risk-based bên dưới vẫn cần owner CI tích hợp và kiểm thử.

1. Bước thu thập luôn lưu audit JSON, stderr đã làm sạch, exit code, SHA, lock SHA-256, Node/npm và UTC. Exit khác 0 do findings phải được phân biệt với lỗi mạng/JSON/schema; lỗi thu thập chặn cổng vì kết quả `UNKNOWN`.
2. Bước policy bắt buộc, không `continue-on-error`: chặn mọi critical; mọi high mới/chưa triage; high runtime có thể tới hoặc `UNKNOWN`; ngoại lệ hết hạn hoặc không khớp package/version/path/GHSA. Với baseline hiện tại, release **BLOCKED**, không dùng số lượng cũ làm allowlist.
3. High chỉ thuộc build hoặc advisory withdrawn có thể không chặn khi có bằng chứng phạm vi, đánh giá tác động tới build secrets/artifact và ngoại lệ được duyệt. Ngoại lệ phải có GHSA, package/path/version, SHA/digest áp dụng, owner, người duyệt, lý do, kiểm soát bù, issue sửa, hạn tối đa 7 ngày; rà lại mỗi release và mỗi lock diff. Chưa có ngoại lệ nào được duyệt ở tài liệu này.
4. Moderate có owner/issue và hạn rà 14 ngày; nâng thành blocker nếu dẫn tới lộ bí mật, bypass quyền hoặc rủi ro giao dịch đã xác nhận. Không bỏ qua moderate bằng nhãn severity đơn thuần.
5. PR có thể tiếp tục các job không phát hành để thu evidence; merge gate do nhóm phê duyệt, release gate bắt buộc đạt policy và regression. Lưu artifact cả khi fail; branch protection và nối gate vào image publish cần người sở hữu CI triển khai riêng.

TODO(security): Tích hợp bước policy và artifact bắt buộc — baseline workflow chỉ cảnh báo; thay đổi CI đồng thời cần được kiểm chứng; OPS-05, Thắng/owner CI, cần Quý duyệt.

## Ma trận nguyên nhân và hướng xử lý

Các đường sau đọc từ dependency declarations trong lockfile; mũi tên thể hiện phụ thuộc, không khẳng định luồng thực thi. Tình trạng mặc định là chưa chấp nhận rủi ro.

| Nhóm | Chuỗi và điều kiện tới được | Disposition / owner / xác minh trước đóng |
| --- | --- | --- |
| Zod | backend → `@medusajs/deps` → `zod`; backend khai báo trực tiếp 4.2.0; validators auth/cart import `@medusajs/framework/zod`. Bộ sưu tập lớn có thể gây tăng bộ nhớ; giới hạn ingress và toàn bộ schema framework chưa kiểm chứng | **BLOCK runtime UNKNOWN**, Hoàng; review bản đồng bộ Medusa/Zod, thử payload quá cỡ trong process cô lập có giới hạn RAM, kiểm 4xx và không crash |
| Multer | `@medusajs/medusa` → `multer` 2.4.0; upload multipart là bề mặt cần rà. Advisory đòi asynchronous fileFilter còn pending lúc request teardown; call path/cấu hình thực chưa xác nhận | **BLOCK runtime UNKNOWN**, Hoàng; xem upload middleware thực, auth/limit/timeout; review >=2.5.0 tương thích rồi regression upload và abort cô lập |
| GraphQL utilities | backend → `@medusajs/utils` → codegen → `@graphql-tools/utils` 10.11.0 và lodash lồng 4.17.23. Prototype pollution cần dữ liệu merge/path không tin cậy; template injection cần điều khiển imports key | **HOLD UNKNOWN**, Hoàng; chứng minh chỉ dùng schema nội bộ/build hoặc sửa đồng bộ; thử dữ liệu độc hại trong harness, không chạy trên dịch vụ chung |
| Glob/tooling | `@medusajs/deps` → awilix → fast-glob → micromatch → picomatch; MikroORM core → globby → fast-glob; migrations → umzug → fast-glob; admin bundler/Vite và Tailwind cũng có đường tới picomatch | **REVIEW withdrawn**, Thắng + Hoàng/Quý; không downgrade Vite tự động. Kiểm advisory thay thế, đầu vào glob và tooling được ship; cần ngoại lệ có hạn nếu registry còn trả finding |
| Next/PostCSS | storefront → Next 15.5.29 → PostCSS 8.4.31 lồng; CSS/sourceMappingURL không tin cậy là điều kiện quan trọng. Chưa thấy bằng chứng cho phép khách nạp CSS tùy ý, nhưng chưa chứng minh không tới runtime/build | **HOLD UNKNOWN**, Quý; review bản Next hỗ trợ và regression build/render/assets, kiểm source map và artifact; không đổi major chỉ theo `fixAvailable` |

Nguồn advisory: [Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), [Multer](https://github.com/advisories/GHSA-q7qp-rjg7-q26m), [GraphQL mergeDeep](https://github.com/advisories/GHSA-7mx3-vvmw-hjmv), [GraphQL incremental](https://github.com/advisories/GHSA-c4qx-w738-7hr3), [lodash template](https://github.com/advisories/GHSA-r5fr-rjxr-66jc), [picomatch](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), [PostCSS source map](https://github.com/advisories/GHSA-6g55-p6wh-862q), [PostCSS path traversal](https://github.com/advisories/GHSA-r28c-9q8g-f849). Các bản vá nêu trên là ứng viên rà, không là phiên bản đã thử.

TODO(security): Hoàng/Quý xác nhận call path và thử bản sửa trong nhánh riêng — runtime high chưa được miễn trừ; OPS-05.

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
