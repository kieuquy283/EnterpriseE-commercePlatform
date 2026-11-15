"use client"

import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import { useSearchParams } from "next/navigation"

const STEPS = [
  { id: "address", label: "Địa chỉ" },
  { id: "delivery", label: "Giao hàng" },
  { id: "payment", label: "Thanh toán" },
  { id: "review", label: "Kiểm tra" },
] as const

type StepId = (typeof STEPS)[number]["id"]

function getReachedStep(cart: HttpTypes.StoreCart): StepId {
  if (!cart.shipping_address || !cart.email) {
    return "address"
  }

  if ((cart.shipping_methods?.length ?? 0) === 0) {
    return "delivery"
  }

  const hasPaymentSession = cart.payment_collection?.payment_sessions?.some(
    (session) => session.status === "pending",
  )

  return hasPaymentSession ? "review" : "payment"
}

/**
 * Accessible checkout progress. The URL step wins because it reflects which
 * section the shopper is editing; the cart state supplies the fallback so a
 * direct visit shows the step that still needs attention.
 */
const CheckoutSteps = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const searchParams = useSearchParams()
  const requested = searchParams.get("step")
  const requestedIndex = STEPS.findIndex((step) => step.id === requested)
  const reachedIndex = STEPS.findIndex((step) => step.id === getReachedStep(cart))
  const currentIndex = Math.max(0, requestedIndex >= 0 ? requestedIndex : reachedIndex)

  return (
    <nav aria-label="Tiến trình thanh toán">
      <ol className="flex flex-wrap items-center gap-x-4 gap-y-2 small:gap-x-8">
        {STEPS.map((step, index) => {
          const isCurrent = index === currentIndex
          const isComplete = index < currentIndex

          return (
            <li
              key={step.id}
              aria-current={isCurrent ? "step" : undefined}
              className="flex items-center gap-x-2"
            >
              <span
                aria-hidden="true"
                className={clx(
                  "inline-flex h-5 w-5 items-center justify-center rounded-dm-pill text-dm-micro font-semibold tabular-nums",
                  isCurrent && "bg-inverse text-canvas",
                  isComplete && "bg-accent-soft text-accent-ink",
                  !isCurrent && !isComplete && "border border-line text-ink-faint",
                )}
              >
                {index + 1}
              </span>
              <span
                className={clx(
                  "text-dm-micro font-semibold uppercase tracking-[0.14em]",
                  isCurrent ? "text-ink" : "text-ink-faint",
                )}
              >
                {step.label}
              </span>
              {isCurrent ? <span className="sr-only"> (bước hiện tại)</span> : null}
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="ml-2 hidden h-px w-8 bg-line-strong small:block"
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default CheckoutSteps
