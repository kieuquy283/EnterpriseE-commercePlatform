import { Radio as RadioGroupOption } from "@headlessui/react"
import { Text, clx } from "@modules/common/components/ui"
import OptionMark from "@modules/checkout/components/option-mark"
import type { JSX } from "react"

type PaymentContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  paymentInfoMap: Record<string, { title: string; icon: JSX.Element }>
}

export default function PaymentContainer({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
}: PaymentContainerProps) {
  const selected = selectedPaymentOptionId === paymentProviderId

  return (
    <RadioGroupOption
      value={paymentProviderId}
      className={clx(
        "flex cursor-pointer items-center justify-between gap-4 rounded-dm-sm border px-4 py-4 text-dm-small transition-colors duration-200 ease-dm-out",
        selected ? "border-accent bg-accent-soft/40" : "border-line hover:border-line-strong",
      )}
    >
      <span className="flex items-center gap-x-3">
        <OptionMark selected={selected} />
        <Text className="text-dm-small font-medium text-ink">
          {paymentInfoMap[paymentProviderId]?.title || paymentProviderId}
        </Text>
      </span>
      {paymentInfoMap[paymentProviderId]?.icon}
    </RadioGroupOption>
  )
}
