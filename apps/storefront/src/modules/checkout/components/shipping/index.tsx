"use client"
import { Radio, RadioGroup } from "@headlessui/react"
import { setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import { Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import CheckoutSection from "@modules/checkout/components/section"
import OptionMark from "@modules/checkout/components/option-mark"
import { Button, Text, clx } from "@modules/common/components/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

const PICKUP_OPTION_ON = "__PICKUP_ON"
const PICKUP_OPTION_OFF = "__PICKUP_OFF"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

function formatAddress(address: HttpTypes.StoreCartAddress) {
  if (!address) {
    return ""
  }

  let ret = ""

  if (address.address_1) {
    ret += ` ${address.address_1}`
  }

  if (address.address_2) {
    ret += `, ${address.address_2}`
  }

  if (address.postal_code) {
    ret += `, ${address.postal_code} ${address.city}`
  }

  if (address.country_code) {
    ret += `, ${address.country_code.toUpperCase()}`
  }

  return ret
}

const optionClass = (selected: boolean, disabled?: boolean) =>
  clx(
    "flex w-full cursor-pointer items-center justify-between gap-4 rounded-dm-sm border px-4 py-4 text-dm-small transition-colors duration-200 ease-dm-out",
    selected ? "border-accent bg-accent-soft/40" : "border-line hover:border-line-strong",
    disabled && "cursor-not-allowed opacity-50 hover:border-line",
  )

const Shipping: React.FC<ShippingProps> = ({ cart, availableShippingMethods }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)

  const [showPickupOptions, setShowPickupOptions] = useState<string>(PICKUP_OPTION_OFF)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null,
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"

  const { _shippingMethods, _pickupMethods } = useMemo(() => {
    const isPickup = (method: HttpTypes.StoreCartShippingOption) =>
      (method as unknown as { service_zone?: { fulfillment_set?: { type?: string } } }).service_zone
        ?.fulfillment_set?.type === "pickup"
    return {
      _shippingMethods: availableShippingMethods?.filter((method) => !isPickup(method)),
      _pickupMethods: availableShippingMethods?.filter(isPickup),
    }
  }, [availableShippingMethods])

  const hasPickupOptions = !!_pickupMethods?.length

  useEffect(() => {
    let active = true
    const calculated =
      _shippingMethods?.filter((method) => method.price_type === "calculated") ?? []
    setIsLoadingPrices(calculated.length > 0)
    setCalculatedPricesMap({})
    if (calculated.length) {
      Promise.allSettled(
        calculated.map((method) => calculatePriceForShippingOption(method.id, cart.id)),
      ).then((results) => {
        if (!active) return
        const prices: Record<string, number> = {}
        for (const result of results) {
          if (
            result.status === "fulfilled" &&
            result.value?.id &&
            typeof result.value.amount === "number"
          ) {
            prices[result.value.id] = result.value.amount
          }
        }
        setCalculatedPricesMap(prices)
        setIsLoadingPrices(false)
      })
    }
    setShowPickupOptions(
      _pickupMethods?.some((method) => method.id === shippingMethodId)
        ? PICKUP_OPTION_ON
        : PICKUP_OPTION_OFF,
    )
    return () => {
      active = false
    }
  }, [_shippingMethods, _pickupMethods, cart.id, shippingMethodId])

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const handleSetShippingMethod = async (id: string, variant: "shipping" | "pickup") => {
    setError(null)

    if (variant === "pickup") {
      setShowPickupOptions(PICKUP_OPTION_ON)
    } else {
      setShowPickupOptions(PICKUP_OPTION_OFF)
    }

    let currentId: string | null = null
    setIsLoading(true)
    setShippingMethodId((prev) => {
      currentId = prev
      return id
    })

    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setShippingMethodId(currentId)

        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const hasShippingMethod = (cart.shipping_methods?.length ?? 0) > 0

  return (
    <CheckoutSection
      index={1}
      id="checkout-delivery"
      title="Giao hàng"
      isOpen={isOpen}
      isComplete={hasShippingMethod}
      onEdit={handleEdit}
      editTestId="edit-delivery-button"
    >
      {isOpen ? (
        <>
          <div className="grid">
            <div className="flex flex-col gap-y-1">
              <span className="text-dm-small font-semibold text-ink">Phương thức giao hàng</span>
              <span className="text-dm-caption text-ink-faint">
                Chọn phương thức giao hàng phù hợp với bạn.
              </span>
            </div>
            <div className="mt-4" data-testid="delivery-options-container">
              <div className="flex flex-col gap-2 pb-8">
                {hasPickupOptions && (
                  <RadioGroup
                    value={showPickupOptions}
                    onChange={(_value) => {
                      const id = _pickupMethods.find((option) => !option.insufficient_inventory)?.id

                      if (id) {
                        handleSetShippingMethod(id, "pickup")
                      }
                    }}
                  >
                    <Radio
                      value={PICKUP_OPTION_ON}
                      data-testid="delivery-option-radio"
                      className={optionClass(showPickupOptions === PICKUP_OPTION_ON)}
                    >
                      <span className="flex items-center gap-x-3">
                        <OptionMark selected={showPickupOptions === PICKUP_OPTION_ON} />
                        <span className="text-dm-small font-medium text-ink">
                          Nhận hàng tại cửa hàng
                        </span>
                      </span>
                      <span className="tabular-nums text-ink-muted">-</span>
                    </Radio>
                  </RadioGroup>
                )}
                <RadioGroup
                  value={shippingMethodId}
                  onChange={(v) => {
                    if (v) {
                      return handleSetShippingMethod(v, "shipping")
                    }
                  }}
                >
                  {_shippingMethods?.map((option) => {
                    const isDisabled =
                      option.price_type === "calculated" &&
                      !isLoadingPrices &&
                      typeof calculatedPricesMap[option.id] !== "number"

                    return (
                      <Radio
                        key={option.id}
                        value={option.id}
                        data-testid="delivery-option-radio"
                        disabled={isDisabled}
                        className={optionClass(option.id === shippingMethodId, isDisabled)}
                      >
                        <span className="flex items-center gap-x-3">
                          <OptionMark selected={option.id === shippingMethodId} />
                          <span className="text-dm-small font-medium text-ink">
                            {option.name === "Standard delivery"
                              ? "Giao hàng tiêu chuẩn"
                              : option.name}
                          </span>
                        </span>
                        <span className="tabular-nums text-ink">
                          {option.price_type === "flat" ? (
                            convertToLocale({
                              amount: option.amount!,
                              currency_code: cart?.currency_code,
                            })
                          ) : typeof calculatedPricesMap[option.id] === "number" ? (
                            convertToLocale({
                              amount: calculatedPricesMap[option.id],
                              currency_code: cart?.currency_code,
                            })
                          ) : isLoadingPrices ? (
                            <Loader />
                          ) : (
                            "-"
                          )}
                        </span>
                      </Radio>
                    )
                  })}
                </RadioGroup>
              </div>
            </div>
          </div>

          {showPickupOptions === PICKUP_OPTION_ON && (
            <div className="grid">
              <div className="flex flex-col gap-y-1">
                <span className="text-dm-small font-semibold text-ink">Cửa hàng</span>
                <span className="text-dm-caption text-ink-faint">Chọn cửa hàng gần bạn.</span>
              </div>
              <div className="mt-4" data-testid="delivery-options-container">
                <div className="flex flex-col gap-2 pb-8">
                  <RadioGroup
                    value={shippingMethodId}
                    onChange={(v) => {
                      if (v) {
                        return handleSetShippingMethod(v, "pickup")
                      }
                    }}
                  >
                    {_pickupMethods?.map((option) => {
                      return (
                        <Radio
                          key={option.id}
                          value={option.id}
                          disabled={option.insufficient_inventory}
                          data-testid="delivery-option-radio"
                          className={optionClass(
                            option.id === shippingMethodId,
                            option.insufficient_inventory ?? undefined,
                          )}
                        >
                          <span className="flex items-start gap-x-3">
                            <OptionMark selected={option.id === shippingMethodId} />
                            <span className="flex flex-col gap-y-0.5">
                              <span className="text-dm-small font-medium text-ink">
                                {option.name === "Standard delivery"
                                  ? "Giao hàng tiêu chuẩn"
                                  : option.name}
                              </span>
                              <span className="text-dm-caption text-ink-faint">
                                {formatAddress(
                                  (
                                    option as unknown as {
                                      service_zone?: {
                                        fulfillment_set?: {
                                          location?: { address: HttpTypes.StoreCartAddress }
                                        }
                                      }
                                    }
                                  ).service_zone?.fulfillment_set?.location
                                    ?.address as HttpTypes.StoreCartAddress,
                                )}
                              </span>
                            </span>
                          </span>
                          <span className="tabular-nums text-ink">
                            {convertToLocale({
                              amount: option.amount!,
                              currency_code: cart?.currency_code,
                            })}
                          </span>
                        </Radio>
                      )
                    })}
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-y-3 border-t border-line pt-8">
            <Button
              size="large"
              className="w-full small:w-auto"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={!cart.shipping_methods?.[0]}
              data-testid="submit-delivery-option-button"
            >
              Tiếp tục đến thanh toán
            </Button>
            <ErrorMessage error={error} data-testid="delivery-option-error-message" />
          </div>
        </>
      ) : (
        <div>
          {hasShippingMethod && (
            <dl className="grid grid-cols-1 gap-6 small:grid-cols-2">
              <div className="flex flex-col gap-y-1">
                <dt className="dm-eyebrow">Phương thức</dt>
                <dd className="text-dm-small text-ink-muted">
                  {cart.shipping_methods!.at(-1)!.name}{" "}
                  <span className="tabular-nums">
                    {convertToLocale({
                      amount: cart.shipping_methods!.at(-1)!.amount!,
                      currency_code: cart?.currency_code,
                    })}
                  </span>
                </dd>
              </div>
            </dl>
          )}
          {!hasShippingMethod && (
            <Text className="text-dm-small text-ink-faint">
              Bạn chưa chọn phương thức giao hàng.
            </Text>
          )}
        </div>
      )}
    </CheckoutSection>
  )
}

export default Shipping
