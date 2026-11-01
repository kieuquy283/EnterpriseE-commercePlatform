# Kết quả chạy seed Customer và Cart

Kiểm tra trên database phát triển `commerce`, schema `public`, ngày **23/10/2026**. Hoàn tất đối chiếu lúc **17:51:40 (Asia/Saigon)**.

## Lệnh tạo lại

Tại thư mục gốc repository:

```powershell
npm run backend:seed:sample
```

Xem [hướng dẫn đầy đủ](../../seed-sample-guide.md). Đây là bộ mẫu hồ sơ Customer và giỏ hàng phục vụ ERD; không tạo tài khoản đăng nhập.

## Các bản ghi được tạo

| Thành phần | ID thực tế |
| --- | --- |
| Customer | `cus_01M5M658YFHQH25N7CGQJNY2WR` |
| Cart | `cart_01M5M659ET7855A4QPZ0XCGV45` |
| Dòng áo thun × 2 | `cali_01M5M659EYTHXPQ9CE2A0V6G9T` |
| Dòng túi canvas × 1 | `cali_01M5M659EYWT0WVJYR3HB2Z7HP` |

Customer có email mẫu `erd-sample@example.test`, `has_account=false`. Cart trỏ đúng Customer, region Vietnam, sales channel Online Store và dùng VND. `completed_at=null`.

Đã đọc lại từng dòng hàng, xác nhận variant tồn tại, `product_id` khớp product của variant, và số lượng đúng 2/1. Product/variant ID được ghi đầy đủ trong [manifest](manifest.json).

## Kết quả hai lần chạy

| Nội dung | Lần 1 | Lần 2 |
| --- | --- | --- |
| Customer mới | 1 | 0 |
| Cart mới | 1 | 0 |
| Dòng hàng mới | 2 | 0 |
| ID và số lượng | Được tạo | Giữ nguyên |

Trước seed, database đã có 1 Customer, 2 Cart và 3 CartItem. Sau hai lần chạy có 2 Customer, 3 Cart và 5 CartItem. Đây là tổng số bản ghi chưa xóa của database, không phải số bản ghi chỉ thuộc bộ mẫu.

Cả 3 inventory level giữ nguyên ID và các số stocked/reserved/incoming. Stocked vẫn là áo 25, túi 18, bình 12; reserved và incoming đều bằng 0. Số reservation active giữ nguyên là 0. ID của Customer đã có từ trước vẫn tồn tại.

## Bằng chứng

- [before.json](before.json): snapshot chỉ đọc trước khi seed.
- [first-run.json](first-run.json): manifest sau lần tạo đầu tiên.
- [after-first.json](after-first.json): số đếm và inventory sau lần đầu.
- [second-run.json](second-run.json): manifest lần chạy lại, không tạo thêm dữ liệu.
- [after-second.json](after-second.json): snapshot sau lần chạy lại.
- [validation.json](validation.json): các phép đối chiếu ID, số lượng, số đếm, inventory và reservation đều đạt.

Snapshot chỉ đọc được lấy trước/sau thao tác seed trên database; seed tạo dữ liệu thông qua workflow Medusa. Kết quả này không thay cho các ca kiểm thử đăng nhập, checkout, guest cart, giỏ rỗng hoặc hết hàng.
