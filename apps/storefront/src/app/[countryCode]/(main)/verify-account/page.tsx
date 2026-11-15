import { Metadata } from "next"
import { Suspense } from "react"

import VerifyAccount from "@modules/account/components/verify-account"

export const metadata: Metadata = {
  title: "Xác thực email",
  description: "Xác thực địa chỉ email để hoàn tất đăng ký.",
}

export default function VerifyAccountPage() {
  return (
    <div className="dm-section">
      <div className="content-container flex w-full justify-center">
        <Suspense
          fallback={
            <p className="text-dm-body text-ink-muted" role="status" aria-live="polite">
              Đang xác thực email
            </p>
          }
        >
          <VerifyAccount />
        </Suspense>
      </div>
    </div>
  )
}
