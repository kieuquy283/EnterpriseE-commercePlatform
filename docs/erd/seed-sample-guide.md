# Tạo dữ liệu mẫu Customer và Cart

Lệnh này chuẩn bị phần Customer–Cart–CartItem cho bộ mẫu ERD. Nó tận dụng sản phẩm và inventory hiện có, tạo một hồ sơ khách hàng riêng cùng một giỏ chưa hoàn tất có áo thun × 2 và túi canvas × 1.

## Chạy một lệnh

Tại thư mục gốc repository:

```powershell
npm run backend:seed:sample
```

PostgreSQL, Redis và cấu hình Backend phải hoạt động. Cổng trong `DATABASE_URL` của Backend phải khớp với cổng PostgreSQL được Compose công bố trên máy: `5432` theo cấu hình gốc, hoặc `15432` nếu bạn đã đổi cổng để tránh xung đột. Lệnh tự nạp cấu hình của Backend; không cần mở giao diện Storefront hoặc khởi động HTTP server để tạo bộ mẫu.

Dữ liệu nền phải có sẵn: một region Vietnam dùng VND, một sales channel Online Store đang bật, sản phẩm published và hai SKU bên dưới thuộc kênh đó. Database mới cần hoàn tất hướng dẫn khởi tạo nền trong [README của dự án](../../README.md) trước.

## Bộ mẫu được tạo

| Thành phần | Nội dung |
| --- | --- |
| Customer | Email dành riêng cho mẫu `erd-sample@example.test`, tên ERD Sample, `has_account=false` |
| Cart | Gắn đúng Customer, region Vietnam và sales channel Online Store; chưa completed |
| Dòng áo thun | SKU `TEE-ESSENTIAL-BLK`, quantity 2 |
| Dòng túi canvas | SKU `BAG-DAILY-NAT`, quantity 1 |
| Nhãn nhận diện | `metadata.erd_fixture = erd-customer-cart-v1` trên Customer và Cart |

Đây là hồ sơ dữ liệu phục vụ ERD, không phải tài khoản đăng nhập. Lệnh không tạo mật khẩu hoặc auth identity. Khách hàng đã đăng ký qua Storefront được giữ riêng.

Các thao tác tạo/cập nhật sử dụng core workflow của Medusa, không ghi SQL trực tiếp. Workflow tạo giỏ kiểm tra giá và tồn theo cơ chế của Backend. Lệnh dừng ở giỏ hàng, không tạo order, không reset tồn kho hoặc reservation.

## Khi chạy lại

- Nếu bộ mẫu đã đúng, giữ nguyên Customer ID, Cart ID, các line item ID và số lượng.
- Nếu hồ sơ mẫu đã được tạo nhưng giỏ chưa tạo thành công, dùng lại hồ sơ đó để thử tạo giỏ.
- Nếu giỏ mẫu thiếu một dòng và các dòng còn lại vẫn đúng, chỉ thêm dòng còn thiếu.
- Nếu email thuộc hồ sơ không có nhãn nhận diện, có nhiều giỏ được đánh dấu, giỏ đã completed, sai ngữ cảnh hoặc số lượng/dòng hàng đã bị chỉnh khác mẫu, lệnh báo lỗi để người thực hiện kiểm tra. Không tự ghi đè các dữ liệu đó.
- Khóa theo mã bộ mẫu ngăn các lần chạy seed đồng thời tạo trùng khi cùng sử dụng Redis locking. Cấu hình không có Redis chỉ có khóa trong một tiến trình.

Nếu tạo giỏ thất bại, hồ sơ Customer đã tạo có thể còn lại. Lần chạy tiếp theo nhận diện và tận dụng hồ sơ này.

Trên một database khác, ID sẽ được Medusa sinh mới; không sao chép ID của môi trường cũ. Lệnh tìm sản phẩm bằng handle/SKU và đọc lại ID thực tế.

## Kết quả và bằng chứng

Sau khi thành công, lệnh in Customer ID, Cart ID và đường dẫn file:

```text
docs/erd/evidence/seed-sample/manifest.json
```

Manifest chứa thời điểm đọc lại, ID của customer/cart/product/variant/line item, SKU, quantity và thông tin bản ghi nào vừa được tạo. Lệnh đọc lại dữ liệu và kiểm tra đủ hai dòng đúng số lượng, đúng liên kết product/variant trước khi lưu.

Đã thực hiện hai lần chạy trên môi trường phát triển ngày 23/10/2026; xem [kết quả và bằng chứng](evidence/seed-sample/README.md). Lần chạy lại giữ nguyên ID/số lượng, không tăng số bản ghi và không thay đổi inventory level hoặc số reservation.

Để đối chiếu thêm bằng pgAdmin, chạy truy vấn chỉ đọc sau trên database ứng dụng, schema `public`:

```sql
SELECT
  customer.id AS customer_id,
  cart.id AS cart_id,
  cart.completed_at,
  item.id AS line_item_id,
  item.product_id,
  item.variant_id,
  variant.sku,
  item.quantity,
  (item.product_id = variant.product_id) AS product_variant_matches
FROM public.customer customer
JOIN public.cart cart
  ON cart.customer_id = customer.id AND cart.deleted_at IS NULL
JOIN public.cart_line_item item
  ON item.cart_id = cart.id AND item.deleted_at IS NULL
LEFT JOIN public.product_variant variant
  ON variant.id = item.variant_id AND variant.deleted_at IS NULL
WHERE customer.email = 'erd-sample@example.test'
  AND customer.deleted_at IS NULL
  AND customer.metadata ->> 'erd_fixture' = 'erd-customer-cart-v1'
  AND cart.metadata ->> 'erd_fixture' = 'erd-customer-cart-v1'
ORDER BY cart.id, variant.sku;
```

Kỳ vọng có hai dòng thuộc cùng Customer/Cart: `TEE-ESSENTIAL-BLK` × 2 và `BAG-DAILY-NAT` × 1. `completed_at` là NULL và `product_variant_matches` là true trên cả hai dòng. Ghi thời điểm kiểm tra và lưu kết quả cho từng môi trường.

Bộ mẫu này dùng cùng catalog/inventory nền. Các ca giỏ rỗng, guest cart và biến thể hết hàng là các phần kiểm chứng mở rộng riêng, không nằm trong lệnh này.

## Tham khảo triển khai

- [createCustomersWorkflow](https://docs.medusajs.com/resources/references/medusa-workflows/createCustomersWorkflow) tạo hồ sơ khách hàng.
- [createCartWorkflow](https://docs.medusajs.com/resources/references/medusa-workflows/createCartWorkflow) tạo giỏ với customer, region, metadata và các dòng hàng.
- [addToCartWorkflow](https://docs.medusajs.com/resources/references/medusa-workflows/addToCartWorkflow) thêm các dòng còn thiếu; các dòng hiện có được kiểm tra trước để tránh cộng số lượng khi chạy lại.

Chữ ký workflow đã được đối chiếu với package Medusa 2.21.2 đang cài trong repository.
