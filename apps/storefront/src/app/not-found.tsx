import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Không tìm thấy trang",
  description: "Trang bạn yêu cầu không tồn tại.",
}

export default function NotFound() {
  return (
    <div className="content-container flex min-h-screen flex-col items-start justify-center py-24">
      <p className="dm-eyebrow">Lỗi 404</p>
      <h1 className="dm-display mt-3 max-w-xl">Trang này đã hết mùa.</h1>
      <p className="dm-lead mt-4 max-w-dm-prose">
        Đường dẫn không tồn tại hoặc sản phẩm đã được gỡ khỏi bộ sưu tập.
      </p>
      <Link href="/" className="dm-btn-primary mt-8">
        Về DAYMARK
      </Link>
    </div>
  )
}
