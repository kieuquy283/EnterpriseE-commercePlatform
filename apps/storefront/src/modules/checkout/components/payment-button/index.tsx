"use client"

import { placeOrder } from "@lib/data/cart"
import { isSupportedCheckoutPaymentProvider } from "@lib/util/checkout-payment"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import { useState } from "react"
import ErrorMessage from "../error-message"

export default function PaymentButton({
  cart,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  "data-testid": string
}) {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (session) =>
      session.status === "pending" &&
      isSupportedCheckoutPaymentProvider(session.provider_id)
  )
  const ready = Boolean(
    cart.shipping_address &&
      cart.billing_address &&
      cart.email &&
      cart.shipping_methods?.length &&
      paymentSession
  )

  const handlePayment = async () => {
    if (!ready || submitting) return
    setSubmitting(true)
    setErrorMessage(null)
    try {
      // The backend is responsible for authorizing the selected provider.
      // On simulated failure, complete-cart must not return an Order.
      await placeOrder()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={!ready || submitting}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="payment-error-message"
      />
    </>
  )
}
