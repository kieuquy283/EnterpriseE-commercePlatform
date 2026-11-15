import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "404",
  description: "Có lỗi xảy ra",
}

export default async function NotFound() {
  return (
    <div className="content-container flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-y-4 text-center">
      <p className="dm-eyebrow">Thanh toán</p>
      <h1 className="dm-title">Phiên thanh toán không còn khả dụng</h1>
      <p className="dm-body max-w-dm-prose">
        Không tìm thấy giỏ hàng cho phiên thanh toán này. Về giỏ hàng hoặc tiếp tục khám phá bộ sưu
        tập.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <LocalizedClientLink href="/cart" className="dm-btn dm-btn-primary">
          Về giỏ hàng
        </LocalizedClientLink>
        <LocalizedClientLink href="/store" className="dm-btn dm-btn-secondary">
          Khám phá bộ sưu tập
        </LocalizedClientLink>
      </div>
    </div>
  )
}
