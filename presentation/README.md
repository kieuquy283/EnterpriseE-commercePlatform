<a id="daymark-presentation"></a>

# Công cụ trình bày DAYMARK

Thư viện trình bày dùng các bộ trang báo cáo được đăng ký trong `src/reports/registry.ts`. Các nguồn báo cáo được giữ lại nhưng không đăng ký chỉ là tài liệu tham khảo.

<a id="run"></a>

## Chạy

Từ gốc kho mã:

```sh
npm run presentation:dev
npm run presentation:build
npm run presentation:test
```

Lockfile npm gốc có thẩm quyền; `presentation/` không có lockfile riêng. Vite dùng base tương đối và phục vụ biểu tượng chim én đã duyệt từ `public/brand/`.

<a id="navigation"></a>

## Điều hướng

- `#/` mở thư viện; không tự mở bộ trang đã lưu.
- `#/daymark-week-6/1` mở trực tiếp báo cáo Tuần 6/10.
- Mở báo cáo và trở về thư viện tạo mục lịch sử trình duyệt; đổi trang cập nhật mục hiện tại.
- Khung 16:9 lấp viewport. Thanh điều khiển dưới với ảnh thu nhỏ nằm ngang hiện khi rê chuột hoặc focus bàn phím ở cạnh dưới; không có nút mở thường trực.
- Thanh chỉ có thư viện, trước/sau, số trang, phát/dừng 30 giây và toàn màn hình.
- Phím: `ArrowRight` / `Enter` tới, `ArrowLeft` lùi, `Home` / `End` đầu/cuối, `Space` phát/dừng. Space/Enter giữ hành vi nút gốc.
- Chuyển trang và hover tôn trọng `prefers-reduced-motion`.

<a id="deck-facts-and-sources"></a>

## Nội dung và nguồn báo cáo

Báo cáo DAYMARK Tuần 6/10 có tám trang: vấn đề quần áo thường ngày, tác nhân, chín ca bắt buộc, hành trình nhập kho đến COD, kiến trúc AWS/Medusa đề xuất, trách nhiệm đồng bộ/bất đồng bộ, mục tiêu tải chưa đạt và trình tự triển khai Tuần 6–10. Số kiểm thử/năng lực là mục tiêu, không phải kết quả được khẳng định.

Yêu cầu chính thức ở `docs/spec/01-business.md` đến `docs/spec/07-delivery.md`. Đường dẫn được ghi làm metadata nguồn trong báo cáo/trang. Nội dung không có ghi chú diễn giả hoặc bảng giải thích ẩn.

<a id="structure"></a>

## Cấu trúc

- `src/engine/`: định tuyến thư viện/báo cáo, khung toàn màn hình, thanh ảnh thu nhỏ, khối trang tái sử dụng và helper định tuyến/phát/bàn phím.
- `src/reports/registry.ts`: đăng ký `week-06-reset/`.
- `src/reports/daymark-scope-revamp/`, `src/reports/engineering-checkpoint/`: nguồn tham khảo không thuộc đăng ký công khai.
- `src/styles/presentation.css`: kiểu thư viện, khung toàn màn hình, thanh tự ẩn; `slide.css`: nội dung báo cáo 16:9.

<a id="motion-diagrams-and-branding"></a>

## Chuyển động, sơ đồ và thương hiệu

Motion 14.13.0 (khớp tham chiếu được cung cấp) xử lý chuyển trang và nhịp chuyển động từng trang. Mỗi trang chọn preset trong dữ liệu báo cáo; tiêu đề, thẻ, hành trình, chỉ số và kết thúc có cách xuất hiện riêng. Giảm chuyển động tắt dịch chuyển. Mermaid tải khi cần cho sơ đồ kiến trúc, dùng bảo mật strict và chủ đề ô liu/ngà.

Wordmark dùng SVG chim én đã vẽ nét và cắt sát. Đầu trang: thương hiệu trái, mục giữa, tuần phụ bên phải. Số trang tĩnh chỉ ở chân trang. Để hiện thanh dưới, đưa chuột đến cạnh dưới hoặc focus bằng bàn phím.
