"use client"

import { RadioGroup } from "@headlessui/react"
import { paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import {
  COD_PAYMENT_PROVIDER_ID,
  isSimulatorPaymentProvider,
  isSupportedCheckoutPaymentProvider,
} from "@lib/util/checkout-payment"
import { CreditCard } from "@medusajs/icons"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer from "@modules/checkout/components/payment-container"
import CheckoutSection from "@modules/checkout/components/section"
import { Button, Text } from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

type SimulatedOutcome = "success" | "failure"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: HttpTypes.StoreCart
  availablePaymentMethods: { id: string }[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (session) => session.status === "pending",
  )
  // Do not expose arbitrary providers: they might require a hosted payment UI.
  // COD is always supported; the simulator is opt-in and must be region-enabled.
  const supportedMethods = availablePaymentMethods.filter((method) =>
    isSupportedCheckoutPaymentProvider(method.id),
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession && supportedMethods.some((method) => method.id === activeSession.provider_id)
      ? activeSession.provider_id
      : (supportedMethods.find((method) => method.id === COD_PAYMENT_PROVIDER_ID)?.id ??
          supportedMethods[0]?.id ??
          ""),
  )
  const [simulatedOutcome, setSimulatedOutcome] = useState<SimulatedOutcome>("success")

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const isOpen = searchParams.get("step") === "payment"

  const paymentReady = Boolean(
    activeSession &&
    isSupportedCheckoutPaymentProvider(activeSession.provider_id) &&
    (cart.shipping_methods?.length ?? 0) > 0,
  )

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams],
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    if (
      !selectedPaymentMethod ||
      !supportedMethods.some((method) => method.id === selectedPaymentMethod)
    ) {
      setError("Vui lòng chọn phương thức thanh toán khả dụng.")
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const isSimulator = isSimulatorPaymentProvider(selectedPaymentMethod)
      const sessionAlreadySelected = activeSession?.provider_id === selectedPaymentMethod

      // Always reinitialize the simulator session, even if its provider ID
      // matches: the shopper may have changed the demo outcome on returning.
      if (isSimulator || !sessionAlreadySelected) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
          ...(isSimulator ? { data: { simulated_outcome: simulatedOutcome } } : {}),
        })
      }

      router.push(pathname + "?" + createQueryString("step", "review"), {
        scroll: false,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <CheckoutSection
      index={2}
      id="checkout-payment"
      title="Thanh toán"
      isOpen={isOpen}
      isComplete={paymentReady}
      onEdit={handleEdit}
      editTestId="edit-payment-button"
    >
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {supportedMethods.length > 0 ? (
            <RadioGroup
              value={selectedPaymentMethod}
              onChange={(value: string) => {
                setError(null)
                setSelectedPaymentMethod(value)
              }}
              className="flex flex-col gap-2"
            >
              {supportedMethods.map((method) => (
                <div key={method.id}>
                  <PaymentContainer
                    paymentInfoMap={paymentInfoMap}
                    paymentProviderId={method.id}
                    selectedPaymentOptionId={selectedPaymentMethod}
                  />
                </div>
              ))}
            </RadioGroup>
          ) : (
            <Text className="text-dm-small text-ink-muted">
              Chưa có phương thức thanh toán được hỗ trợ tại khu vực này.
            </Text>
          )}

          {isSimulatorPaymentProvider(selectedPaymentMethod) && (
            <div className="dm-panel mt-4 flex flex-col gap-y-2 p-4">
              <p className="text-dm-small font-semibold text-ink">Kết quả thanh toán thử</p>
              <p className="dm-caption">
                Chỉ dùng để kiểm thử. Không thu tiền thật; kết quả được xử lý trên hệ thống.
              </p>
              <label htmlFor="simulated-payment-outcome" className="dm-label mt-2">
                Kết quả thử
              </label>
              <select
                id="simulated-payment-outcome"
                value={simulatedOutcome}
                onChange={(event) => {
                  setSimulatedOutcome(event.target.value as SimulatedOutcome)
                  setError(null)
                }}
                disabled={isLoading}
                className="dm-field"
                data-testid="simulated-payment-outcome"
              >
                <option value="success">Thành công (chấp nhận thanh toán)</option>
                <option value="failure">Thất bại (từ chối thanh toán)</option>
              </select>
              <p className="dm-hint">Thay đổi lựa chọn này chưa thực hiện thanh toán.</p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-y-3">
            <Button
              size="large"
              className="w-full small:w-auto"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={!selectedPaymentMethod || isLoading}
              data-testid="submit-payment-button"
            >
              Tiếp tục kiểm tra đơn
            </Button>
            <ErrorMessage error={error} data-testid="payment-method-error-message" />
          </div>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <dl className="grid grid-cols-1 items-start gap-6 small:grid-cols-2">
              <div className="flex flex-col gap-y-1">
                <dt className="dm-eyebrow">Phương thức thanh toán</dt>
                <dd className="text-dm-small text-ink-muted" data-testid="payment-method-summary">
                  {paymentInfoMap[activeSession.provider_id]?.title || activeSession.provider_id}
                </dd>
              </div>
              <div className="flex flex-col gap-y-1">
                <dt className="dm-eyebrow">Thông tin thanh toán</dt>
                <dd
                  className="flex items-center gap-x-2 text-dm-small text-ink-muted"
                  data-testid="payment-details-summary"
                >
                  <span className="flex h-7 w-fit items-center rounded-dm-xs bg-surface p-2">
                    {paymentInfoMap[activeSession.provider_id]?.icon || <CreditCard />}
                  </span>
                  <span>
                    {isSimulatorPaymentProvider(activeSession.provider_id)
                      ? "Thanh toán thử, không thu tiền thật"
                      : "Thanh toán khi nhận hàng"}
                  </span>
                </dd>
              </div>
            </dl>
          ) : null}
        </div>
      </div>
    </CheckoutSection>
  )
}

export default Payment
