import { CreditCard } from "@medusajs/icons"
import {
  SIMULATOR_PAYMENT_ENABLED,
  SIMULATOR_PAYMENT_PROVIDER_ID,
} from "@lib/util/checkout-payment"
import React from "react"

export const paymentInfoMap: Record<string, { title: string; icon: React.JSX.Element }> = {
  pp_system_default: {
    title: "Thanh toán khi nhận hàng",
    icon: <CreditCard />,
  },
  ...(SIMULATOR_PAYMENT_ENABLED
    ? {
        [SIMULATOR_PAYMENT_PROVIDER_ID]: {
          title: "Thanh toán thử (không thu tiền thật)",
          icon: <CreditCard />,
        },
      }
    : {}),
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]
