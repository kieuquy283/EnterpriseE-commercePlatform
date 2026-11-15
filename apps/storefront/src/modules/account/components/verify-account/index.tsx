"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Alert, SpinnerMark } from "@modules/common/components/ui"
import { confirmEmailVerification } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type VerificationState = "verifying" | "success" | "error"

const VerifyAccount = () => {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [state, setState] = useState<VerificationState>("verifying")
  // Guard against the effect running twice in React Strict Mode, which would
  // consume the single-use token before the customer sees the result.
  const confirmed = useRef(false)

  useEffect(() => {
    if (confirmed.current) {
      return
    }
    confirmed.current = true

    if (!token) {
      setState("error")
      return
    }

    confirmEmailVerification(token).then(({ success }) => setState(success ? "success" : "error"))
  }, [token])

  return (
    <div className="flex w-full max-w-md flex-col gap-y-6" data-testid="verify-account-page">
      <div className="flex flex-col gap-y-2">
        <p className="dm-eyebrow">Tài khoản</p>
        <h1 className="dm-title">Xác thực email</h1>
      </div>

      {state === "verifying" && (
        <p
          className="flex items-center gap-x-3 text-dm-body text-ink-muted"
          role="status"
          aria-live="polite"
        >
          <SpinnerMark className="text-ink-faint" />
          Đang xác thực email
        </p>
      )}

      {state === "success" && (
        <>
          <Alert tone="success">Email đã được xác thực. Bạn có thể đăng nhập vào tài khoản.</Alert>
          <LocalizedClientLink href="/account" className="dm-btn dm-btn-primary self-start">
            Đến trang đăng nhập
          </LocalizedClientLink>
        </>
      )}

      {state === "error" && (
        <>
          <Alert tone="error">
            Liên kết xác thực không hợp lệ hoặc đã hết hạn. Đăng nhập để yêu cầu email xác thực mới.
          </Alert>
          <LocalizedClientLink href="/account" className="dm-btn dm-btn-secondary self-start">
            Đến trang đăng nhập
          </LocalizedClientLink>
        </>
      )}
    </div>
  )
}

export default VerifyAccount
