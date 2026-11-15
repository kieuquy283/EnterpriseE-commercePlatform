"use client"

import { convertToLocale } from "@lib/util/money"
import { CheckCircleSolid, XMark } from "@medusajs/icons"
import { HttpTypes, StoreCart, StoreCartShippingOption, StorePrice } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { IconButton, clx } from "@modules/common/components/ui"
import { useState } from "react"
import { StoreFreeShippingPrice } from "types/global"

const computeTarget = (cart: HttpTypes.StoreCart, price: HttpTypes.StorePrice) => {
  const priceRule = (price.price_rules || []).find((pr) => pr.attribute === "item_total")!

  const currentAmount = cart.item_total
  const targetAmount = parseFloat(priceRule.value)

  if (priceRule.operator === "gt") {
    return {
      current_amount: currentAmount,
      target_amount: targetAmount,
      target_reached: currentAmount > targetAmount,
      target_remaining: currentAmount > targetAmount ? 0 : targetAmount + 1 - currentAmount,
      remaining_percentage: (currentAmount / targetAmount) * 100,
    }
  } else if (priceRule.operator === "gte") {
    return {
      current_amount: currentAmount,
      target_amount: targetAmount,
      target_reached: currentAmount > targetAmount,
      target_remaining: currentAmount > targetAmount ? 0 : targetAmount - currentAmount,
      remaining_percentage: (currentAmount / targetAmount) * 100,
    }
  } else if (priceRule.operator === "lt") {
    return {
      current_amount: currentAmount,
      target_amount: targetAmount,
      target_reached: targetAmount > currentAmount,
      target_remaining: targetAmount > currentAmount ? 0 : currentAmount + 1 - targetAmount,
      remaining_percentage: (currentAmount / targetAmount) * 100,
    }
  } else if (priceRule.operator === "lte") {
    return {
      current_amount: currentAmount,
      target_amount: targetAmount,
      target_reached: targetAmount > currentAmount,
      target_remaining: targetAmount > currentAmount ? 0 : currentAmount - targetAmount,
      remaining_percentage: (currentAmount / targetAmount) * 100,
    }
  } else {
    return {
      current_amount: currentAmount,
      target_amount: targetAmount,
      target_reached: currentAmount === targetAmount,
      target_remaining: targetAmount > currentAmount ? 0 : targetAmount - currentAmount,
      remaining_percentage: (currentAmount / targetAmount) * 100,
    }
  }
}

export default function ShippingPriceNudge({
  variant = "inline",
  cart,
  shippingOptions,
}: {
  variant?: "popup" | "inline"
  cart: StoreCart
  shippingOptions: StoreCartShippingOption[]
}) {
  if (!cart || !shippingOptions?.length) {
    return
  }

  // Check if any shipping options have a conditional price based on item_total
  const freeShippingPrice = shippingOptions
    .map((shippingOption) => {
      const calculatedPrice = shippingOption.calculated_price

      if (!calculatedPrice) {
        return
      }

      // Get all prices that are:
      // 1. Currency code is same as the cart's
      // 2. Have a rule that is set on item_total
      const validCurrencyPrices = shippingOption.prices.filter(
        (price) =>
          price.currency_code === cart.currency_code &&
          (price.price_rules || []).some((priceRule) => priceRule.attribute === "item_total"),
      )

      return validCurrencyPrices.map((price) => {
        return {
          ...price,
          shipping_option_id: shippingOption.id,
          ...computeTarget(cart, price),
        }
      })
    })
    .flat(1)
    .filter(Boolean)
    // We focus here entirely on free shipping, but this can be edited to handle multiple layers
    // of reduced shipping prices.
    .find((price) => price?.amount === 0)

  if (!freeShippingPrice) {
    return
  }

  if (variant === "popup") {
    return <FreeShippingPopup cart={cart} price={freeShippingPrice} />
  } else {
    return <FreeShippingInline cart={cart} price={freeShippingPrice} />
  }
}

function FreeShippingProgress({
  price,
  trackClassName = "bg-line",
}: {
  price: { target_reached: boolean; remaining_percentage: number }
  trackClassName?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={clx("h-1 w-full overflow-hidden rounded-dm-pill", trackClassName)}
    >
      <div
        className={clx(
          "h-full rounded-dm-pill transition-[width] duration-500 ease-dm-out",
          price.target_reached ? "bg-success" : "bg-accent",
        )}
        style={{ width: `${Math.min(price.remaining_percentage, 100)}%` }}
      />
    </div>
  )
}

function FreeShippingInline({
  cart,
  price,
}: {
  cart: StoreCart
  price: StorePrice & {
    target_reached: boolean
    target_remaining: number
    remaining_percentage: number
  }
}) {
  return (
    <div className="flex flex-col gap-y-2 rounded-dm-sm border border-line bg-surface p-3">
      <div className="flex items-baseline justify-between gap-3 text-dm-caption text-ink-muted">
        <div>
          {price.target_reached ? (
            <span className="flex items-center gap-x-1.5 text-success">
              <CheckCircleSolid className="inline-block" />
              Đã đủ điều kiện miễn phí giao hàng
            </span>
          ) : (
            "Điều kiện miễn phí giao hàng"
          )}
        </div>
        <div
          className={clx({
            "invisible opacity-0": price.target_reached,
          })}
        >
          {convertToLocale({
            amount: price.target_remaining,
            currency_code: cart.currency_code,
          })}{" "}
          nữa
        </div>
      </div>
      <FreeShippingProgress price={price} />
    </div>
  )
}

function FreeShippingPopup({ cart, price }: { cart: StoreCart; price: StoreFreeShippingPrice }) {
  const [isClosed, setIsClosed] = useState(false)

  return (
    <div
      className={clx(
        "dm-invert fixed bottom-5 right-5 z-10 flex flex-col items-end gap-2 transition-all duration-500 ease-dm-out",
        {
          "invisible opacity-0 delay-1000": price.target_reached,
          "invisible opacity-0": isClosed,
          "visible opacity-100": !price.target_reached && !isClosed,
        },
      )}
    >
      <IconButton
        label="Đóng thông báo giao hàng"
        className="bg-canvas text-ink hover:bg-surface"
        onClick={() => setIsClosed(true)}
      >
        <XMark />
      </IconButton>

      <div className="flex w-[calc(100vw-2.5rem)] max-w-[22rem] flex-col gap-y-4 rounded-dm-lg border border-line bg-canvas p-5 text-ink shadow-dm-raised">
        <p className="dm-eyebrow text-ink-faint">Giao hàng</p>
        <p className="text-dm-small text-ink">
          {price.target_reached ? (
            <span className="flex items-center gap-x-1.5 text-success">
              <CheckCircleSolid className="inline-block" />
              Đã đủ điều kiện miễn phí giao hàng
            </span>
          ) : (
            <>
              <span className="tabular-nums font-semibold">
                {convertToLocale({
                  amount: price.target_remaining,
                  currency_code: cart.currency_code,
                })}
              </span>{" "}
              nữa để được miễn phí giao hàng
            </>
          )}
        </p>
        <FreeShippingProgress price={price} trackClassName="bg-canvas/20" />

        <div className="flex flex-wrap items-center gap-2">
          <LocalizedClientLink href="/cart" className="dm-btn dm-btn-secondary dm-btn-sm">
            Xem giỏ hàng
          </LocalizedClientLink>

          <LocalizedClientLink href="/store" className="dm-btn dm-btn-primary dm-btn-sm">
            Xem sản phẩm
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
