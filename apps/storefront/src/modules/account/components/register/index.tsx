"use client"

import { useActionState } from "react"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { Alert, Input } from "@modules/common/components/ui"
import { signup } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signup, null)

  return (
    <div className="flex w-full max-w-md flex-col gap-y-6" data-testid="register-page">
      <div className="flex flex-col gap-y-2">
        <p className="dm-eyebrow">Tài khoản</p>
        <h1 className="dm-title">Tạo tài khoản DAYMARK</h1>
        <p className="dm-body">Quản lý đơn hàng và địa chỉ của bạn ở cùng một nơi.</p>
      </div>

      {message?.state === "verification_required" && (
        <div data-testid="register-verification-message">
          <Alert tone="info">
            Liên kết xác thực đã được gửi đến{" "}
            <strong className="font-semibold">{message.email}</strong>. Kiểm tra hộp thư để xác thực
            email rồi đăng nhập.
          </Alert>
        </div>
      )}

      <form className="flex w-full flex-col gap-y-4" action={formAction}>
        <div className="grid grid-cols-1 gap-4 xsmall:grid-cols-2">
          <Input
            label="Tên"
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label="Họ"
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
        </div>
        <Input
          label="Email"
          name="email"
          required
          type="email"
          autoComplete="email"
          data-testid="email-input"
        />
        <Input
          label="Số điện thoại (không bắt buộc)"
          name="phone"
          type="tel"
          autoComplete="tel"
          data-testid="phone-input"
        />
        <Input
          label="Mật khẩu"
          name="password"
          required
          type="password"
          autoComplete="new-password"
          data-testid="password-input"
        />

        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="register-error"
        />

        <p className="dm-caption">
          Thông tin tài khoản được dùng để xử lý đơn hàng và lưu địa chỉ của bạn. Bạn có thể quản lý
          lựa chọn gợi ý cá nhân trong tài khoản.
        </p>

        <SubmitButton className="w-full" size="large" data-testid="register-button">
          Tạo tài khoản
        </SubmitButton>
      </form>

      <p className="dm-caption">
        Bạn đã có tài khoản?{" "}
        <button
          type="button"
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="dm-action-link"
        >
          Đăng nhập
        </button>
      </p>
    </div>
  )
}

export default Register
