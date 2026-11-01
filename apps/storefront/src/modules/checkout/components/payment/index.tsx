"use client"

import { RadioGroup } from "@headlessui/react"
import { paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import {
  COD_PAYMENT_PROVIDER_ID,
  isSimulatorPaymentProvider,
  isSupportedCheckoutPaymentProvider,
} from "@lib/util/checkout-payment"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import {
  Button,
  Container,
  Heading,
  Text,
  clx,
} from "@modules/common/components/ui"
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
    (session) => session.status === "pending"
  )
  // Do not expose arbitrary providers: they might require a hosted payment UI.
  // COD is always supported; the simulator is opt-in and must be region-enabled.
  const supportedMethods = availablePaymentMethods.filter((method) =>
    isSupportedCheckoutPaymentProvider(method.id)
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession &&
      supportedMethods.some((method) => method.id === activeSession.provider_id)
      ? activeSession.provider_id
      : supportedMethods.find((method) => method.id === COD_PAYMENT_PROVIDER_ID)
          ?.id ?? supportedMethods[0]?.id ?? ""
  )
  const [simulatedOutcome, setSimulatedOutcome] =
    useState<SimulatedOutcome>("success")

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const isOpen = searchParams.get("step") === "payment"

  const paymentReady = Boolean(
    activeSession &&
      isSupportedCheckoutPaymentProvider(activeSession.provider_id) &&
      (cart.shipping_methods?.length ?? 0) > 0
  )

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
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
      setError("Please choose an available payment method.")
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const isSimulator = isSimulatorPaymentProvider(selectedPaymentMethod)
      const sessionAlreadySelected =
        activeSession?.provider_id === selectedPaymentMethod

      // Always reinitialize the simulator session, even if its provider ID
      // matches: the shopper may have changed the demo outcome on returning.
      if (isSimulator || !sessionAlreadySelected) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
          ...(isSimulator
            ? { data: { simulated_outcome: simulatedOutcome } }
            : {}),
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
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          Payment
          {!isOpen && paymentReady && <CheckCircleSolid />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-payment-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>

      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {supportedMethods.length > 0 ? (
            <RadioGroup
              value={selectedPaymentMethod}
              onChange={(value: string) => {
                setError(null)
                setSelectedPaymentMethod(value)
              }}
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
            <Text>No supported payment method is available for this region.</Text>
          )}

          {isSimulatorPaymentProvider(selectedPaymentMethod) && (
            <div className="mt-4 rounded-rounded border p-4">
              <Text className="txt-medium-plus mb-2">
                Demo payment result (no real money is charged)
              </Text>
              <label htmlFor="simulated-payment-outcome" className="block mb-2">
                <Text>Choose a test outcome</Text>
              </label>
              <select
                id="simulated-payment-outcome"
                value={simulatedOutcome}
                onChange={(event) => {
                  setSimulatedOutcome(event.target.value as SimulatedOutcome)
                  setError(null)
                }}
                disabled={isLoading}
                className="w-full rounded-rounded border border-ui-border-base bg-white p-3"
                data-testid="simulated-payment-outcome"
              >
                <option value="success">Success (authorize payment)</option>
                <option value="failure">Failure (reject payment)</option>
              </select>
              <Text className="mt-2 txt-small text-ui-fg-subtle">
                This is a test-only scenario. The backend must enforce the
                outcome; changing this selector does not process a payment.
              </Text>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!selectedPaymentMethod || isLoading}
            data-testid="submit-payment-button"
          >
            Continue to review
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex items-start gap-x-1 w-full">
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment method
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="payment-method-summary"
                >
                  {paymentInfoMap[activeSession.provider_id]?.title ||
                    activeSession.provider_id}
                </Text>
              </div>
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment details
                </Text>
                <div
                  className="flex gap-2 txt-medium text-ui-fg-subtle items-center"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                    {paymentInfoMap[activeSession.provider_id]?.icon || (
                      <CreditCard />
                    )}
                  </Container>
                  <Text>
                    {isSimulatorPaymentProvider(activeSession.provider_id)
                      ? "Demo only — no real charge"
                      : "Pay when your order arrives"}
                  </Text>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
