import { Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  return (
    <div className="dm-panel flex flex-col gap-4 p-5 small:flex-row small:items-center small:justify-between">
      <div className="flex flex-col gap-y-1.5">
        <Heading level="h2" className="text-dm-title-sm">
          Bạn đã có tài khoản?
        </Heading>
        <Text className="dm-caption">
          Đăng nhập để dùng địa chỉ đã lưu và xem lịch sử đơn hàng.
        </Text>
      </div>
      <LocalizedClientLink
        href="/account"
        className="dm-btn dm-btn-secondary dm-btn-sm self-start whitespace-nowrap small:self-auto"
        data-testid="sign-in-button"
      >
        Đăng nhập
      </LocalizedClientLink>
    </div>
  )
}

export default SignInPrompt
