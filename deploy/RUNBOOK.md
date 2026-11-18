# AWS Fargate deployment and operations

The primary course deployment is **ALB/ACM → ECS Fargate storefront, Medusa API/admin and worker → private RDS PostgreSQL and Redis on EC2**, with private S3 product images streamed through the backend proxy. CloudFormation owns the infrastructure. All regional resources use `ap-southeast-2`; the local AWS profile is `aws-project`.

The full stack passed 18 public checks on November 9, 2026. That is dated verification evidence, not a promise that a timed demo is currently running. See the [architecture decision](../docs/architecture/adr/0001-aws-cloud-stack.md), [architecture](../docs/spec/03-architecture.md), and [deployment report](../docs/report/aws-redeployment-main389e855-2026-11-09.md).

## Before operating

Run commands from the repository root. Confirm the selected Region in AWS Settings > View all projects > Overview > Additional Info > Region, and check plan, credit and spend status in AWS Settings > Billing. Renew the operator login with `aws login --profile aws-project` if credentials have expired.

Keep deployment inputs in ignored `deploy/cloudformation/settings.json`, based on [settings.example.json](cloudformation/settings.example.json). It holds hostnames, image digests and the browser-visible publishable key, never passwords or AWS keys. Preserve the existing stack prefix, database, bucket and secrets. Do not copy example placeholders over existing settings.

```sh
python3 deploy/cloudformation/manage.py status
```

## Start or extend a demo

```sh
python3 deploy/cloudformation/manage.py start --hours 4
python3 deploy/cloudformation/manage.py status
python3 deploy/cloudformation/manage.py renew --hours 4
```

`start` renews the bounded lease, starts/checks RDS and Redis, drains application tasks, runs a migration task and then starts the enabled ECS services. It deliberately interrupts application traffic; it is not a zero-downtime release command. It refuses startup while a retained-database recovery guard exists. `renew` extends an existing session; it does not start stopped services. Supported session duration is greater than zero and at most twelve hours for startup.

Both watchdogs check the lease every five minutes and request compute shutdown after expiry. Verify the stopped states afterward. A lease is best-effort automation, not a hard spending cap. Confirm the SNS alert email subscription before relying on failure notifications.

## Publish and release

The [AWS image workflow](../.github/workflows/aws-images.yml) builds immutable ECR images using the scoped GitHub OIDC publishing role. It does not deploy infrastructure or read application secrets. This workflow is configured; the recorded deployment used local Docker builds and AWS CLI operations, so GitHub Actions publishing is not yet proven by the live report.

Update `BackendImage` / `StorefrontImage` in local settings with immutable digests. The storefront build must use the real publishable key and `https://api.135791112.xyz`. Review the changes before executing them:

```sh
python3 deploy/cloudformation/manage.py pause
python3 deploy/cloudformation/manage.py plan app
python3 deploy/cloudformation/manage.py apply '<reviewed-change-set-ARN>'
python3 deploy/cloudformation/manage.py start --hours 4
```

App plans stage services at zero; `start` performs migrations before traffic. Keep prior image digests for application rollback and use backward-compatible migrations. Do not automatically roll back database migrations, reseed an existing dataset, replace retained resources or delete volumes to resolve a deployment failure. The [detailed AWS guide](cloudformation/README.md) covers first-time foundation/data bootstrap, seeding a new database, image publishing, backup requirements and retained-resource recovery.

## Bootstrap dữ liệu DAYMARK và Admin đầu tiên

Đây là thao tác một lần có phê duyệt riêng sau khi rà release; **không thêm seed/import/user vào startup**. Xem [readiness và blocker](../docs/technical/operations-readiness.md), [dataset](../docs/catalog/DATASET.md). Các lệnh dưới được đối chiếu nguồn, không chứng minh đã chạy trên cloud.

1. **Xác định đích trước ghi.** Người vận hành ghi project, Region Sydney, stack data/app, database identifier và DB name (không connection string/password), backend digest, schema revision, dataset hash và chủ dữ liệu. Phân biệt RDS demo với DB local/EC2 cũ. Trung xác nhận backup/restore và snapshot số sản phẩm, SKU, inventory/reservation, đơn/khách qua Admin API hoặc Medusa query. Chỉ một người bootstrap; không chạy đồng thời checkout/import. Dừng nếu không xác định được DB hoặc trạng thái từng phần.
2. **Migration rồi baseline commerce.** Sau lease/data/task definition đã được duyệt, helper hiện hỗ trợ đúng ba tác vụ sau (mỗi tác vụ tạo ECS task/ghi DB hoặc log; không chạy chỉ để kiểm readiness):

   ```sh
   python3 deploy/cloudformation/manage.py task migrate
   # Only for an approved NEW database with no commerce bootstrap:
   python3 deploy/cloudformation/manage.py task seed
   python3 deploy/cloudformation/manage.py task publishable-key
   ```

   `seed` gọi `seed-commerce.js`: tạo Online Store/channel, khóa publishable Storefront và liên kết channel, store VND, Vietnam/vn/COD, warehouse/location, tax/shipping và ba sản phẩm cũ. Nếu Vietnam tồn tại, script chỉ đồng bộ payment providers rồi return; không sửa key/channel/location/shipping thiếu. Nếu lỗi trước khi tạo Vietnam, rerun có thể tạo thêm channel/key. Vì vậy không dùng như repair chung hoặc bằng chứng seed hoàn tất; Hoàng/Trung phải đối soát và dùng workflow sửa chọn lọc, không SQL/drop/reset. Production loại payment simulator. Script không tạo admin.

3. **Kiểm scaffold và public key.** Admin/Medusa query xác nhận default region Vietnam/vn/VND, default channel/location, channel↔location, publishable key↔channel, sản phẩm published cùng channel, shipping option dùng được và provider COD. `print-storefront-key` lấy khóa đầu tiên tên Storefront, không kiểm các liên kết hoặc tính duy nhất; nhiều khóa cùng tên phải đối soát, không chọn mù. Dùng đúng khóa public trong `PublishableKey` và build argument `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, backend HTTPS trong `NEXT_PUBLIC_MEDUSA_BACKEND_URL`; build/publish thành digest mới theo quy trình release. Không dùng admin/secret key cho storefront.
4. **Nhập DAYMARK sau scaffold.** Chế độ local bên dưới không dùng cho RDS. Chế độ `cloud-demo` riêng hỗ trợ preview được duyệt: `NODE_ENV=production`, `AWS_REGION=ap-southeast-2`, `DAYMARK_CATALOG_TARGET_HOST`/`DAYMARK_CATALOG_TARGET_DATABASE` khớp chính xác DB, và `DAYMARK_CATALOG_DATASET_SHA256` khớp fixture + manifest đã rà. Artifact đặt `DAYMARK_CATALOG_ASSET_DIR=/app/apps/backend/assets/daymark-catalog` vì working directory chạy là `.medusa/server`. Chạy `--dry-run` trước, rà kế hoạch rồi mới `--apply` với `DAYMARK_CATALOG_WRITE=1`. `--images preview` cần `DAYMARK_CATALOG_REPRESENTATIVE_PREVIEW=acknowledged` và S3 proxy cấu hình; ảnh vẫn là minh họa preview, không đổi thành ảnh SKU chính xác. Không thêm lệnh này vào startup. Lệnh package có thật:

   ```sh
   # Disposable LOCAL target only, never RDS/shared; default is read-only planning:
   npm run seed:daymark-catalog --workspace=@dtc/backend -- --dry-run
   DAYMARK_CATALOG_WRITE=1 DAYMARK_CATALOG_ENVIRONMENT=local-disposable \
     npm run seed:daymark-catalog --workspace=@dtc/backend -- --apply --images manifest
   ```

   Hai lệnh local trên không dùng cho RDS; không đổi NODE_ENV/giả local/tunnel để vượt guard. Cloud runner gọi cùng script với chế độ `cloud-demo` và target/hash rõ; helper `manage.py task` hiện chỉ hỗ trợ migrate/seed/publishable-key, không tự thêm quyền catalog. Importer sở hữu handle `dm-*`/SKU `DM-*`, chặn xung đột metadata/SKU/options và chỉ tạo tồn khi thiếu mức tồn. Chạy lại phải giữ ID, stock/reservation và orders/customers; nhiều workflow không phải một giao dịch nguyên tử. Sau lỗi giữa chừng, đọc snapshot/dry-run mới trước retry, không xóa để làm lại.

5. **Ảnh và storefront readback.** Manifest hiện dùng ảnh representative; `--images manifest` không tự nhận ảnh này. `--images demo` chỉ test/local loopback và không S3; H&M media importer cấm cloud, không dùng làm lối tắt. Chế độ `preview` chỉ dùng cho demo được duyệt với nhãn minh họa; Trung/Quý vẫn duyệt quyền và ảnh SKU chính xác trước phát hành thương mại. Upload ảnh đã duyệt qua Medusa file provider vào `public-images/`, không upload bucket trực tiếp hay đổi metadata confidence để né guard. Rà checksum, flat filename, MIME và URL trả về `https://<ApiDomain>/product-images/public-images/<key>`; giữ ảnh/URL cũ khi retry. Đọc lại product thumbnail/images bằng Store API với region/key đúng và xem list/PDP/render ảnh trên storefront; ảnh phải trả raster 200 không cần API key, `nosniff`; direct unsigned S3/private prefix/missing/non-image bị từ chối. Import không ảnh không được báo đã hoàn tất nghiệm thu ảnh.
6. **Admin đầu tiên.** Script `bootstrap-preview-admin.js` là đường preview riêng: nhận `DAYMARK_BOOTSTRAP_ADMIN_EMAIL`/`DAYMARK_BOOTSTRAP_ADMIN_PASSWORD` qua ECS Secrets Manager injection, cờ `DAYMARK_BOOTSTRAP_ADMIN_WRITE=1` và target `DAYMARK_BOOTSTRAP_DB_HOST`/`DAYMARK_BOOTSTRAP_DB_NAME` khớp DB. Không đưa giá trị bí mật vào command/environment override. Script từ chối user/auth identity đã có, không reset password; giữ trạng thái từng phần để đối soát. Runner một lần dùng digest đã rà, quyền đọc secret đúng ARN và cleanup task definition/permission/secret sau xác minh login. Không tạo Staff hay chứng minh RBAC. Đường CLI invite dưới đây vẫn có giới hạn logging: Medusa CLI hiện cài có `user -e <email> --invite` và `user -e <email> -p <password>`; đối chiếu `@medusajs/cli/dist/create-cli.js` và `@medusajs/medusa/dist/commands/user.js`. Ưu tiên invite để người nhận tự đặt mật khẩu. Lệnh trong thư mục backend đã cấu hình đúng DB; tại artifact là `/app/apps/backend/.medusa/server`:

   ```sh
   # Template for a separately approved secure operator session; NOT current ECS helper action:
   node ../../../../node_modules/@medusajs/cli/cli.js user -e "$DAYMARK_ADMIN_EMAIL" --invite
   ```

   CLI in bearer invite token/URL ra logger; awslogs hiện thu stdout. **Không chạy trong task logging hiện tại** trước khi Hoàng/Thắng thiết kế runner/capture hạn chế không gửi token vào CloudWatch/CI/artifact hoặc task override. Helper chỉ cho migrate/seed/publishable-key, không có admin, ECS Exec chưa được chứng minh; không bịa `task admin`. Runner mới phải dùng cùng digest/config/DB, lease hữu hạn, quyền tối thiểu, exit code và cleanup. Bàn giao invite một lần qua kênh bí mật đã được nhóm duyệt, xác nhận đúng người nhận; không lưu URL/token/email trong evidence công khai, không trông chờ email notification chưa triển khai. Nếu chọn password CLI, cần runner đọc bí mật an toàn, không shell history/echo/process listing/shared terminal/ECS command override; không dùng CLI password cho runner preview; dùng secret injection và script đã nêu. Không mật khẩu cố định, không mật khẩu preview/local cũ, không ghi credentials vào settings hoặc workflow input. Nếu CLI lỗi sau khi tạo user trước auth identity, kiểm trạng thái trước retry, không tự xóa tài khoản.

7. **Nghiệm thu và rerun.** Người nhận mở HTTPS Admin `/app` và invite URL ở base Admin phù hợp (`/app/invite?token=…`), đặt mật khẩu riêng, đăng nhập, mở catalog/stock/order Admin và xác nhận API không xác thực bị từ chối. Không ghi màn hình token hoặc thông tin khách. Có Admin không chứng minh Staff RBAC/license/allow-deny: phần đó vẫn chưa nghiệm thu. Catalog cloud được chấp nhận chỉ khi scoped count/ID đúng fixture (không suy tổng DB bằng 30 vì giữ ba sản phẩm cũ), 230 SKU không trùng, VND/channel/stock đúng, ảnh đọc lại được và rerun không đổi tồn/đơn/khách có sẵn. Một COD checkout fixture cần quyền ghi riêng và đối soát order/reservation/payment; notifications chưa triển khai phải ghi BLOCKED. Lưu SHA/digest/UTC/exit/readback đã làm sạch; không gọi bootstrap đạt từ `/health`.

## DNS and verification

Cloudflare `@` and `api` are DNS-only CNAMEs targeting the app stack's `LoadBalancerDns` output; Cloudflare flattens the apex record. ACM terminates HTTPS at the ALB. Preserve ACM validation records. The ALB hostname changes if the app stack is recreated after hibernation; update both CNAME targets from the new output, rather than hardcoding an EC2 IP or an old ALB address.

Check API and storefront HTTPS health, rendered catalog/product pages and admin assets. Verify an uploaded raster image through `/product-images/public-images/<key>` without API-key headers, while direct unsigned S3 access remains denied. Public/private-prefix, missing-image and non-image cases need separate checks. RDS and Redis ingress must remain restricted to the application security group. Health endpoints alone do not verify checkout, background jobs, restore or capacity.

Record the revision plus local changes, immutable images, UTC verification time and sanitized results in `docs/report/`. The [November 8–9 evidence](../docs/report/evidence/fargate-2026-11-08/) records public checks, runtime and retained-resource recovery. Never store secret values or connection strings in evidence.

## Pause and hibernate

```sh
python3 deploy/cloudformation/manage.py pause
python3 deploy/cloudformation/manage.py status
# Remove app infrastructure only when the demo no longer needs to stay available:
python3 deploy/cloudformation/manage.py hibernate
```

`pause` drains ECS and requests RDS/Redis stops; the ALB remains provisioned and billable. `hibernate` pauses, then deletes only the app stack, including the ALB. Data, S3, ECR, secrets, encryption key and the persistent data watchdog remain. Storage and other retained services still incur charges. Verify states and check actual billing separately from historical cost models. Never delete foundation/data stacks as a routine shutdown.

## Local development and EC2 fallback

[Docker Compose](../docker-compose.yml) remains the local development layout. The [EC2 fallback runbook](ec2/RUNBOOK.md), [bootstrap](ec2/README.md), and [November 6 report](../docs/report/aws-ec2-deployment-2026-11-06.md) preserve the successful single-VM rehearsal. Its PostgreSQL data is separate from RDS. Caddy and the [fallback SSH workflow](../.github/workflows/deploy.yml) belong to that path, not the primary Fargate deployment. Do not restart, remove or repoint the fallback resources merely to operate the primary stack.
