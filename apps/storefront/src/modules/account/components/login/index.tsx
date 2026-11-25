import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { Alert, Input } from "@modules/common/components/ui"
import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)
  const router = useRouter()

  useEffect(() => {
    if (message?.state === "success") router.refresh()
  }, [message, router])

  return (
    <div className="flex w-full max-w-md flex-col gap-y-6" data-testid="login-page">
      <div className="flex flex-col gap-y-2">
        <p className="dm-eyebrow">Tài khoản</p>
        <h1 className="dm-title">Chào mừng bạn trở lại</h1>
        <p className="dm-body">Đăng nhập để xem đơn hàng, lưu địa chỉ và thanh toán nhanh hơn.</p>
      </div>

      {message?.state === "verification_required" && (
        <div data-testid="login-verification-message">
          <Alert tone="info">
            Liên kết xác thực đã được gửi đến{" "}
            <strong className="font-semibold">{message.email}</strong>. Hãy xác thực email rồi đăng
            nhập.
          </Alert>
        </div>
      )}

      <form className="flex w-full flex-col gap-y-4" action={formAction}>
        <Input
          label="Email"
          name="email"
          type="email"
          title="Vui lòng nhập địa chỉ email hợp lệ."
          autoComplete="email"
          required
          data-testid="email-input"
        />
        <Input
          label="Mật khẩu"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          data-testid="password-input"
        />

        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="login-error-message"
        />

        <SubmitButton data-testid="sign-in-button" className="w-full" size="large">
          Đăng nhập
        </SubmitButton>
      </form>

      <p className="dm-caption">
        Bạn mới đến với DAYMARK?{" "}
        <button
          type="button"
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="dm-action-link"
          data-testid="register-button"
        >
          Tạo tài khoản
        </button>
      </p>
    </div>
  )
}

export default Login
