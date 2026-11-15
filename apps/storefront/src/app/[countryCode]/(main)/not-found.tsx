import { Metadata } from "next"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BrandLogo from "@modules/common/components/brand-logo"

export const metadata: Metadata = {
  title: "Không tìm thấy trang",
  description: "Trang bạn yêu cầu không tồn tại.",
}

export default function NotFound() {
  return (
    <div className="content-container flex min-h-[60vh] flex-col items-start justify-center py-20">
      <BrandLogo variant="mark" size="lg" />
      <p className="dm-eyebrow mt-8">Lỗi 404</p>
      <h1 className="dm-display mt-3 max-w-xl">Trang này đã hết mùa.</h1>
      <p className="dm-lead mt-4 max-w-dm-prose">
        Đường dẫn không tồn tại hoặc sản phẩm đã được gỡ khỏi bộ sưu tập.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <LocalizedClientLink href="/store" className="dm-btn-primary">
          Khám phá bộ sưu tập
        </LocalizedClientLink>
        <LocalizedClientLink href="/" className="dm-btn-secondary">
          Về trang chủ
        </LocalizedClientLink>
      </div>
    </div>
  )
}
