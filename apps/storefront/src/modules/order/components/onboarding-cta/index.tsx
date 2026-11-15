"use client"

import { resetOnboardingState } from "@lib/data/onboarding"
import { Button } from "@modules/common/components/ui"

const OnboardingCta = ({ orderId }: { orderId: string }) => {
  return (
    <div className="dm-panel w-full max-w-4xl p-5">
      <div className="flex flex-col items-start gap-y-3">
        <p className="text-dm-title-sm font-medium text-ink">Đơn hàng thử đã được tạo</p>
        <p className="dm-caption">Bạn có thể hoàn tất cài đặt cửa hàng trong trang quản trị.</p>
        <Button
          className="w-fit"
          size="small"
          variant="secondary"
          onClick={() => resetOnboardingState(orderId)}
        >
          Hoàn tất trong trang quản trị
        </Button>
      </div>
    </div>
  )
}

export default OnboardingCta
