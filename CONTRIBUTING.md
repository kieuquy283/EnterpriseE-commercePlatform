<a id="contributing-to-daymark"></a>

# Đóng góp cho DAYMARK

Đây là kho mã dùng chung. Bắt đầu từ [đặc tả chính thức](docs/README.md), [thiết lập cục bộ](docs/setup.md) và [AGENTS.md](AGENTS.md). Yêu cầu và quy trình áp dụng cho cả con người lẫn agent lập trình; bảo vệ nhánh và CI cần thực thi các kiểm tra được chọn. Chỉ AGENTS không thể bảo đảm hành vi của cả nhóm.

<a id="a-small-traceable-change"></a>

## Thay đổi nhỏ, có thể truy vết

1. Đọc yêu cầu/luồng, mã nguồn/TODO liên quan và nội dung `git log`. Kiểm tra công việc đồng thời và giữ nguyên thay đổi không liên quan.
2. Xác định một kết quả cùng kiểm thử nghiệm thu. Với ranh giới, provider hoặc schema mới, ghi quyết định và hỏi người đánh giá phụ trách trước khi thực hiện thay đổi cấu trúc chưa được phê duyệt.
3. Dùng nhánh chủ đề `feat/`, `fix/`, `refactor/`, `docs/`, `test/` hoặc `chore/`; ưu tiên một lát cắt nghiệp vụ hoàn chỉnh.
4. Cập nhật hợp đồng/đặc tả khi hành vi đổi. Bổ sung kiểm thử tập trung và ghi rõ phần chưa kiểm thử. Không mô tả tính năng dự kiến như đã triển khai.
5. Mở PR tập trung, nêu mã yêu cầu/luồng, hành vi trước/sau, kiểm chứng, rủi ro và TODO còn mở. Người đánh giá có thể yêu cầu tách PR hoặc làm rõ quyết định.
6. Chỉ hợp nhất khi nhiệm vụ/người dùng cho phép và đủ kiểm tra/đánh giá bắt buộc. Không force-push nhánh main dùng chung. Giữ tương thích migration/dữ liệu đã công bố, trừ khi có kế hoạch migration được đánh giá rõ ràng.

<a id="todos"></a>

## TODO

Dùng `TODO(kind): hành động cụ thể — bối cảnh; yêu cầu/issue` gần phần chưa hoàn thành. Các loại: impl, refactor, dup, shared, design, test, perf, security, ops. Ví dụ:

```ts
// TODO(test): Reconcile final-size stock under concurrent checkout — FR-06.
```

Dùng `npm run todo`. Giữ công việc nhiều bước trong [danh sách công việc](docs/spec/07-delivery.md) hoặc issue; tránh ghi chú mơ hồ rải rác. Xóa TODO đã giải quyết và nêu trong nội dung commit.

<a id="commits"></a>

## Commit

Tiêu đề theo quy ước, dùng động từ chỉ hành động và không quá 72 ký tự: `type(scope): description`. Các loại: feat, fix, refactor, docs, test, perf, chore, ci. Phạm vi chỉ khu vực bị ảnh hưởng. Mỗi commit là một thay đổi logic; lockfile gốc được sinh đi cùng thay đổi dependency gây ra nó.

Nội dung commit đáng kể giải thích các mục sau; giữ tên trường để thống nhất quy ước:

- **What:** hành vi nhìn thấy được và thay đổi triển khai chính.
- **Why:** yêu cầu/luồng, quyết định và phương án thay thế có ảnh hưởng.
- **Follow-ups:** TODO còn lại, tương thích hoặc giới hạn vận hành.
- **Validated:** kiểm tra/kết quả chính xác và những gì chưa chạy.

Không bịa kết quả kiểm thử hoặc phê duyệt của người đánh giá. Agent chỉ commit/push khi nhiệm vụ cho phép.

<a id="validation-by-scope"></a>

## Kiểm chứng theo phạm vi

| Thay đổi                           | Bằng chứng bắt buộc                                                                                             |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Nội dung tài liệu/báo cáo          | `npm run docs:check`; rà cách phân biệt mục tiêu/đã triển khai/đã kiểm chứng và độ bao phủ yêu cầu giảng viên   |
| Công cụ/nội dung trình bày         | Build/kiểm tra kiểu, kiểm thử tuyến/điều hướng và rà bản in/tràn nội dung nếu có                                |
| Chính sách/workflow backend        | Lint/kiểu backend cùng kiểm thử unit/HTTP/tích hợp liên quan                                                    |
| Hành trình storefront              | Lint/kiểu/build storefront cùng hành trình Playwright liên quan                                                 |
| Schema                             | Migration mới được sinh, kiểm tra cài mới/nâng cấp trên dữ liệu dùng riêng; không viết lại migration đã áp dụng |
| Hạ tầng/phát hành                  | Lint/Guard CloudFormation và kiểm thử vòng đời; change set được đánh giá, ngân sách và quyền triển khai rõ ràng |
| Tính đúng đắn/hiệu năng thương mại | Dữ liệu mẫu cô lập, thao tác lặp/cạnh tranh, bản ghi đối soát và chỉ số có tên                                  |

Chỉ dùng npm và lockfile gốc. Không đưa kết quả sinh tự động, thông tin xác thực, `.env` riêng, cấu hình triển khai riêng hoặc bản ghi khách hàng thô vào Git. Không chạy kiểm thử ghi/tải trên dữ liệu dùng chung chỉ để đủ danh sách kiểm tra. Thay đổi ứng dụng tuân thủ AGENTS theo phạm vi. Đọc [vận hành](docs/spec/06-operations.md) trước thao tác trên hệ thống thật.

<a id="ownership-and-review"></a>

## Trách nhiệm và đánh giá

Ghi người đánh giá/vận hành phụ trách theo issue hoặc đợt phát hành, không chỉ định một chủ sở hữu duy nhất vĩnh viễn. Thay đổi nghiệp vụ hướng khách hàng cần đánh giá luồng; thay đổi kiến trúc/tích hợp cần đánh giá ranh giới/hợp đồng; thao tác dữ liệu/cloud cần đánh giá migration/chi phí/khôi phục. Chức năng Medusa có sẵn phải được kiểm chứng trong cấu hình đã chọn trước khi nghiệm thu. CI có thể thực thi tài liệu/hợp đồng, E2E nghiệp vụ cô lập và kiểm tra hạ tầng bắt buộc; tài liệu này không khẳng định cấu hình bảo vệ kho mã đã thay đổi.

<a id="review-by-business-flow"></a>

## Đánh giá theo luồng nghiệp vụ

Chọn người đánh giá và người chạy nghiệm thu cho mỗi issue/PR. Đây là trách nhiệm đánh giá, không phải tên người dùng GitHub được tự đặt hay quyền sở hữu thư mục độc quyền. Một luồng có thể đi qua cả hai ứng dụng; người đánh giá theo dõi toàn hành trình.

| Luồng / yêu cầu                              | Trọng tâm thay đổi và đánh giá                                              | Ranh giới triển khai thường gặp                                              |
| -------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Tài khoản và lịch sử riêng / FR-01, FR-07    | Danh tính, phân quyền và phản hồi riêng tư                                  | Thao tác dữ liệu/xác thực storefront, API auth/customer/order backend        |
| Duyệt và khám phá / FR-02                    | Truy vấn toàn danh mục, hiển thị theo vùng/kênh, biến thể và giá            | Dữ liệu/UI danh mục storefront, API product/pricing Medusa                   |
| Giỏ hàng đến mua hàng / FR-03–FR-05          | Tổng tiền có thẩm quyền, kết quả thử lại, đối soát thanh toán và đơn        | Checkout/dữ liệu storefront, workflow cart/payment/order Medusa              |
| Kho và xử lý giao hàng / FR-06, FR-07, FR-09 | Quyền nhân viên, hạch toán kho, bàn giao vật lý và thu COD                  | Medusa Admin, workflow/provider inventory/fulfillment                        |
| Thông báo / FR-08                            | Ý định gửi bền vững, gửi trùng, thử lại và khôi phục                        | Workflow/module/provider thông báo dự kiến; chưa nghiệm thu                  |
| Gợi ý / REC-01                               | Điều kiện hợp lệ, dữ liệu công khai, đồng ý, dự phòng và hết hạn bộ nhớ đệm | Module recommendation/personalization, workflow, route và dữ liệu storefront |
| Phát hành và khôi phục / NFR                 | Năng lực, chi phí, an toàn migration, quay lui và bằng chứng đo             | Công cụ triển khai và vận hành; thao tác thật cần quyền riêng                |

Với công việc xuyên luồng, nêu rõ người đánh giá các luồng bị ảnh hưởng. Nghiệm thu theo [hợp đồng luồng](docs/spec/02-flows.md), không chỉ dựa vào một kiểm thử cấp tệp đã đạt.

<a id="formatting-lint-and-commit-verification"></a>

## Định dạng, lint và kiểm chứng commit

Dùng Node 24.22.1 và lockfile npm gốc; `packageManager` chọn npm 11.12.1. Chưa chuyển sang pnpm. Oxfmt 0.78.0 là công cụ định dạng trực tiếp của dự án. Prettier có thể vẫn được cài gián tiếp bởi framework hoặc Oxfmt; không còn là lệnh dự án.

Chạy `npm run format -- path/to/file` cho tệp được chọn; chỉ dùng `npm run format` khi chủ đích định dạng toàn kho mã. Quy tắc dùng dấu nháy kép, hai khoảng trắng, không dấu chấm phẩy và không sắp xếp import/package. Mã hiện có mang định dạng cũ; tránh viết lại hàng loạt. `npm run format:check` kiểm tra cấu hình formatter và kiểm tra staged trong CI; hook pre-commit kiểm tra mọi tệp nguồn/cấu hình được hỗ trợ đã stage. Dùng `npm run format:check -- path/to/file` để kiểm tra tường minh thêm. Build sinh tự động, lockfile, tài liệu/bằng chứng và bộ dữ liệu được loại trừ theo `.oxfmtrc.json`.

ESLint là linter duy nhất: chưa có phương án Oxlint thay thế đầy đủ đã kiểm chứng cho quy tắc kiến trúc Medusa và quy tắc framework/TypeScript Next. Vì vậy Oxlint không được cài hoặc chạy. TypeScript và kiểm thử ứng dụng là các kiểm tra riêng. Xem [Oxfmt CLI chính thức](https://oxc.rs/docs/guide/usage/formatter/cli).

Husky 9.1.7 quản lý `.husky/pre-commit`; lint-staged 16.4.0 chọn kiểm tra qua `lint-staged.config.mjs`. `npm ci` cài hook cục bộ qua `prepare`; bỏ qua khi ở production, CI hoặc không có `.git` (kể cả lớp dependency Docker). Sau khi cài với script bị tắt, chạy `npm run hooks:install` thủ công. Nếu dùng đường dẫn hook riêng, kiểm tra `git config --get core.hooksPath` trước vì Husky thay thiết lập cục bộ đó.

Hook chạy `npm run hooks:verify`, dùng cơ chế sao lưu/khôi phục của lint-staged và `--hide-unstaged` để ẩn thay đổi tracked chưa stage, kể cả tệp stage một phần. Các lệnh chỉ kiểm tra; sửa định dạng và tự stage kết quả. Dependency untracked không bị ignore vẫn được nhìn thấy. Xem [hướng dẫn lint-staged](https://github.com/lint-staged/lint-staged#readme) và [thiết lập Husky](https://typicode.github.io/husky/get-started.html).

Tệp staged được hỗ trợ chạy Oxfmt. Tài liệu và hướng dẫn theo phạm vi chạy trình kiểm tra tài liệu; thay đổi backend/storefront chạy ESLint của ứng dụng liên quan. Thay đổi package/lockfile/Turbo/ESLint gốc chọn kiểm tra công cụ nền và lint cả hai ứng dụng. Thay đổi presentation chạy kiểm tra kiểu và kiểm thử công cụ. Hook không build, seed hoặc truy cập cơ sở dữ liệu/cloud. Kiểm tra kiểu đầy đủ, kiểm thử tích hợp và build thuộc CI/PR. Có thể bỏ hook bằng `git commit --no-verify` hoặc `HUSKY=0`; phải giải thích trong PR và chạy kiểm tra bắt buộc. CI và bảo vệ kho mã là ranh giới thực thi chung; tài liệu này không thay đổi bảo vệ nhánh.
