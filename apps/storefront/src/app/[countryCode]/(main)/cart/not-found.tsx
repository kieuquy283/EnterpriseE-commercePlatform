import { Metadata } from "next"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "404",
  description: "Có lỗi xảy ra",
}

export default function NotFound() {
  return (
    <div className="content-container flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-y-4 text-center">
      <p className="dm-eyebrow">Giỏ hàng</p>
      <h1 className="dm-title">Không tìm thấy giỏ hàng</h1>
      <p className="dm-body max-w-dm-prose">
        Giỏ hàng có thể đã hết hạn. Chọn sản phẩm để tạo giỏ mới hoặc khám phá bộ sưu tập.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <LocalizedClientLink href="/store" className="dm-btn dm-btn-primary">
          Khám phá bộ sưu tập
        </LocalizedClientLink>
        <LocalizedClientLink href="/" className="dm-btn dm-btn-secondary">
          Về trang chủ
        </LocalizedClientLink>
      </div>
    </div>
  )
}
