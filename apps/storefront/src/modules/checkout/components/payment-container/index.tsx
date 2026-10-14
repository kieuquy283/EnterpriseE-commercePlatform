import { Radio as RadioGroupOption } from "@headlessui/react"
import { Text, clx } from "@modules/common/components/ui"
import Radio from "@modules/common/components/radio"
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
        "mb-2 cursor-pointer rounded-rounded border px-8 py-4 text-small-regular",
        { "border-ui-border-interactive": selected }
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          <Radio checked={selected} />
          <Text>{paymentInfoMap[paymentProviderId]?.title || paymentProviderId}</Text>
        </div>
        {paymentInfoMap[paymentProviderId]?.icon}
      </div>
    </RadioGroupOption>
  )
}
