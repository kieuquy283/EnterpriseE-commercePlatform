"use client"

import { Button } from "@modules/common/components/ui"

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main
      id="daymark-main"
      className="content-container flex min-h-[60vh] flex-col items-start justify-center gap-6 py-20"
    >
      <h1 className="dm-display max-w-3xl">Chưa thể tải trang.</h1>
      <p className="dm-lead max-w-xl">
        Kết nối có thể đang gián đoạn. Thử lại sau giây lát; đơn hàng chỉ hoàn tất khi bạn nhận được
        xác nhận trên trang.
      </p>
      <Button onClick={reset}>Thử lại</Button>
    </main>
  )
}
