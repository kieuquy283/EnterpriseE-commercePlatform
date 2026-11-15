import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react"
import { Button, clx } from "@modules/common/components/ui"
import React, { Fragment, useMemo } from "react"

import useToggleState from "@lib/hooks/use-toggle-state"
import ChevronDown from "@modules/common/icons/chevron-down"
import X from "@modules/common/icons/x"

import { getProductPrice } from "@lib/util/get-product-price"
import OptionSelect from "./option-select"
import { HttpTypes } from "@medusajs/types"
import { isSimpleProduct } from "@lib/util/product"

type MobileActionsProps = {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  options: Record<string, string | undefined>
  updateOptions: (title: string, value: string) => void
  inStock?: boolean
  handleAddToCart: () => void
  isAdding?: boolean
  show: boolean
  optionsDisabled: boolean
}

const MobileActions: React.FC<MobileActionsProps> = ({
  product,
  variant,
  options,
  updateOptions,
  inStock,
  handleAddToCart,
  isAdding,
  show,
  optionsDisabled,
}) => {
  const { state, open, close } = useToggleState()

  const price = getProductPrice({
    product: product,
    variantId: variant?.id,
  })

  const selectedPrice = useMemo(() => {
    if (!price) {
      return null
    }
    const { variantPrice, cheapestPrice } = price

    return variantPrice || cheapestPrice || null
  }, [price])

  const isSimple = isSimpleProduct(product)

  return (
    <>
      <div
        className={clx("lg:hidden inset-x-0 bottom-0 fixed z-50", {
          "pointer-events-none": !show,
        })}
      >
        <Transition
          as={Fragment}
          show={show}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur-sm"
            data-testid="mobile-actions"
          >
            <div className="flex items-center justify-between gap-3 pb-2">
              <span
                className="truncate text-dm-small font-medium text-ink"
                data-testid="mobile-title"
              >
                {product.title}
              </span>
              {selectedPrice ? (
                <div className="flex shrink-0 items-baseline gap-2">
                  {selectedPrice.price_type === "sale" && (
                    <span className="text-dm-caption text-ink-faint line-through">
                      {selectedPrice.original_price}
                    </span>
                  )}
                  <span
                    className={clx(
                      "text-dm-small font-semibold tabular-nums",
                      selectedPrice.price_type === "sale" ? "text-accent" : "text-ink",
                    )}
                  >
                    {selectedPrice.calculated_price}
                  </span>
                </div>
              ) : null}
            </div>
            <div className={clx("grid w-full gap-2", isSimple ? "grid-cols-1" : "grid-cols-2")}>
              {!isSimple && (
                <Button
                  onClick={open}
                  variant="secondary"
                  className="w-full"
                  data-testid="mobile-actions-button"
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="truncate">
                      {variant ? Object.values(options).join(" / ") : "Chọn phân loại"}
                    </span>
                    <ChevronDown />
                  </span>
                </Button>
              )}
              <Button
                onClick={handleAddToCart}
                disabled={!inStock || !variant || isAdding}
                className="w-full"
                isLoading={isAdding}
                loadingLabel="Đang thêm"
                data-testid="mobile-cart-button"
              >
                {!variant ? "Chọn phân loại" : !inStock ? "Hết hàng" : "Thêm vào giỏ"}
              </Button>
            </div>
          </div>
        </Transition>
      </div>
      <Transition appear show={state} as={Fragment}>
        <Dialog as="div" className="relative z-[75]" onClose={close}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-charcoal-900/40" />
          </Transition.Child>

          <div className="fixed inset-x-0 bottom-0">
            <div className="flex min-h-full h-full items-center justify-center text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-dm-out duration-300"
                enterFrom="opacity-0 translate-y-6"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-6"
              >
                <DialogPanel
                  className="flex max-h-[85vh] w-full flex-col gap-y-4 overflow-y-auto rounded-t-dm-lg border-t border-line bg-canvas px-4 pb-8 pt-4 text-left"
                  data-testid="mobile-actions-modal"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="dm-eyebrow">Chọn phân loại</p>
                      <DialogTitle className="dm-heading mt-1">{product.title}</DialogTitle>
                    </div>
                    <button
                      type="button"
                      onClick={close}
                      aria-label="Đóng lựa chọn"
                      className="dm-btn-icon"
                      data-testid="close-modal-button"
                    >
                      <X />
                    </button>
                  </div>

                  {(product.variants?.length ?? 0) > 1 && (
                    <div className="flex flex-col gap-y-6">
                      {(product.options || []).map((option) => (
                        <div key={option.id}>
                          <OptionSelect
                            option={option}
                            current={options[option.id]}
                            updateOption={updateOptions}
                            title={option.title ?? ""}
                            disabled={optionsDisabled}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </DialogPanel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default MobileActions
