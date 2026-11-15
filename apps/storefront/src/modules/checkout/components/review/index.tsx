"use client"

import { isSupportedCheckoutPaymentProvider } from "@lib/util/checkout-payment"
import CheckoutSection from "@modules/checkout/components/section"
import { Text } from "@modules/common/components/ui"
import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

const Review = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const searchParams = useSearchParams()
  const isOpen = searchParams.get("step") === "review"

  const previousStepsCompleted = Boolean(
    cart.shipping_address &&
    cart.billing_address &&
    cart.email &&
    (cart.shipping_methods?.length ?? 0) > 0 &&
    cart.payment_collection?.payment_sessions?.some(
      (session) =>
        session.status === "pending" && isSupportedCheckoutPaymentProvider(session.provider_id),
    ),
  )

  return (
    <CheckoutSection
      index={3}
      id="checkout-review"
      title="Kiểm tra và đặt hàng"
      isOpen={isOpen}
      isComplete={false}
    >
      {isOpen && previousStepsCompleted && (
        <div className="flex flex-col gap-y-6">
          <Text className="max-w-dm-prose text-dm-caption text-ink-faint">
            Vui lòng kiểm tra sản phẩm, địa chỉ, phí giao hàng và tổng tiền trước khi đặt. Với COD,
            bạn thanh toán khi nhận hàng.
          </Text>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </div>
      )}
      {isOpen && !previousStepsCompleted && (
        <Text className="text-dm-small text-ink-muted">
          Vui lòng hoàn tất địa chỉ, phương thức giao hàng và thanh toán trước khi đặt hàng.
        </Text>
      )}
    </CheckoutSection>
  )
}

export default Review
