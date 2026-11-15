# DAYMARK

<img src="docs/brand/daymark-swallow.svg" width="120" alt="Biểu tượng chim én DAYMARK" />

**Made for the everyday.** DAYMARK là dự án thương mại điện tử hướng đến vận hành thực tế cho một thương hiệu quần áo thường ngày giả định tại Việt Nam. Dự án kết nối hành trình mua sắm của khách hàng và vận hành cửa hàng: nhập kho, công bố sản phẩm, khám phá, thanh toán, xử lý đơn, theo dõi giao hàng và đối soát giao nhận/thanh toán.

<a id="architecture"></a>

## Kiến trúc

Ứng dụng khách hàng dùng Next.js. Medusa sở hữu các năng lực thương mại trong một modular monolith, với hai vai trò chạy API/Admin và worker. PostgreSQL lưu dữ liệu giao dịch, Redis hỗ trợ điều phối và bộ nhớ đệm, S3 lưu nội dung đa phương tiện. Gợi ý sản phẩm là năng lực khám phá tùy chọn, có yêu cầu riêng về đánh giá và quyền sử dụng dữ liệu.

[Tài liệu kỹ thuật](docs/technical/README.md) giải thích ranh giới triển khai, lưu trữ, triển khai AWS, kiểm thử và quy trình vận hành. [Đặc tả nghiệp vụ](docs/README.md#primary-business-first-specification) xác định người dùng, yêu cầu, chính sách và luồng logic độc lập với lựa chọn công nghệ.

<a id="getting-started"></a>

## Bắt đầu sử dụng

Làm theo [hướng dẫn thiết lập cục bộ](docs/setup.md) để chọn phiên bản Node được ghim, cài các npm workspace, cấu hình dịch vụ cục bộ và chuẩn bị ứng dụng. Phiên bản môi trường chạy và trình quản lý gói được quy định trong các tệp phiên bản và manifest của kho mã.

```sh
npm ci
npm run backend:dev
# Trong terminal khác:
npm run storefront:dev
```

Thiết lập cơ sở dữ liệu, nhập danh mục có chủ đích và tạo tài khoản quản trị là các bước vận hành riêng trong hướng dẫn thiết lập. Giữ thông tin xác thực trong cấu hình môi trường riêng tư.

<a id="documentation"></a>

## Tài liệu

- [Mục lục tài liệu](docs/README.md)
- [Yêu cầu nghiệp vụ và thiết kế logic](docs/README.md#primary-business-first-specification)
- [Thiết kế kỹ thuật và vận hành](docs/technical/README.md)
- [Nhận diện thương hiệu](docs/brand/README.md) và [hệ thống thiết kế storefront](docs/design-system/README.md)
- [Bộ dữ liệu danh mục và quy trình nhập](docs/catalog/DATASET.md)
- [Quy ước đóng góp và kiểm chứng](CONTRIBUTING.md)
- [Hướng dẫn cho agent](AGENTS.md)
- [Công cụ trình bày và báo cáo](presentation/README.md)

<a id="repository"></a>

## Cấu trúc kho mã

| Vị trí            | Trách nhiệm                                                      |
| ----------------- | ---------------------------------------------------------------- |
| `apps/backend`    | Cấu hình Medusa, module, workflow, API và phần mở rộng Admin     |
| `apps/storefront` | Ứng dụng khách hàng và kiểm thử nghiệm thu trên trình duyệt      |
| `deploy`          | Hạ tầng, công cụ quản lý vòng đời và hướng dẫn triển khai        |
| `load`            | Kịch bản tải và hiệu năng                                        |
| `scripts`         | Tiện ích kho mã và công cụ dữ liệu ngoại tuyến                   |
| `docs`            | Đặc tả nghiệp vụ, hướng dẫn kỹ thuật và bằng chứng có ngày tháng |
| `presentation`    | Công cụ trình bày dùng chung và các bộ trang báo cáo             |
