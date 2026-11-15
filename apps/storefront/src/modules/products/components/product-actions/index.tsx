"use client"

import { customerErrorMessage } from "@lib/util/customer-error-message"
import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button, clx } from "@modules/common/components/ui"
import Divider from "@modules/common/components/divider"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (variantOptions: HttpTypes.StoreProductVariant["options"]) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

/** Human-readable availability for the currently selected variant. */
function variantAvailability(variant?: HttpTypes.StoreProductVariant): {
  available: boolean
  message: string
} {
  if (!variant) {
    return { available: false, message: "" }
  }

  if (!variant.manage_inventory || variant.allow_backorder) {
    return { available: true, message: "Có thể đặt hàng" }
  }

  const quantity = variant.inventory_quantity ?? 0
  if (quantity <= 0) {
    return { available: false, message: "Cỡ này đã hết hàng" }
  }
  if (quantity <= 3) {
    return {
      available: true,
      message: `Chỉ còn ${quantity} sản phẩm trong kho`,
    }
  }
  return { available: true, message: "Còn hàng trong kho" }
}

export default function ProductActions({ product, disabled }: ProductActionsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>(() => {
    const variant = product.variants?.find((entry) => entry.id === searchParams.get("v_id"))
    return optionsAsKeymap(variant?.options ?? null) ?? {}
  })
  const [isAdding, setIsAdding] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(
    null,
  )
  const countryCode = useParams().countryCode as string

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((variant) => {
      const variantOptions = optionsAsKeymap(variant.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  const setOptionValue = (optionId: string, value: string) => {
    setFeedback(null)
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  const isValidVariant = useMemo(() => {
    return product.variants?.some((variant) => {
      const variantOptions = optionsAsKeymap(variant.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    // Selection is local presentation state. Native history preserves the shareable
    // variant URL without racing a server navigation against add-to-cart.
    const query = params.toString()
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname)
  }, [selectedVariant, isValidVariant, pathname, searchParams])

  const availability = useMemo(() => variantAvailability(selectedVariant), [selectedVariant])
  const inStock = availability.available

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)
    setFeedback(null)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })
      setFeedback({
        tone: "success",
        message: "Đã thêm vào giỏ hàng.",
      })
    } catch (error) {
      // The commerce error message is the only safe content here; it never
      // includes stack details or internal identifiers.
      setFeedback({
        tone: "error",
        message:
          error instanceof Error && error.message
            ? error.message
            : "Không thể thêm sản phẩm. Vui lòng thử lại.",
      })
    } finally {
      setIsAdding(false)
    }
  }

  const buttonLabel = !selectedVariant
    ? product.variants && product.variants.length > 1
      ? "Chọn phân loại"
      : "Chưa khả dụng"
    : !isValidVariant
      ? "Chọn phân loại"
      : !inStock
        ? "Hết hàng"
        : "Thêm vào giỏ"

  return (
    <>
      <div className="flex flex-col gap-y-5" ref={actionsRef}>
        {(product.variants?.length ?? 0) > 1 && (
          <div className="flex flex-col gap-y-6">
            {(product.options || []).map((option) => (
              <div key={option.id}>
                <OptionSelect
                  option={option}
                  current={options[option.id]}
                  updateOption={setOptionValue}
                  title={option.title ?? ""}
                  data-testid="product-options"
                  disabled={!!disabled || isAdding}
                />
              </div>
            ))}
            <Divider />
          </div>
        )}

        <ProductPrice product={product} variant={selectedVariant} />

        {selectedVariant && (
          <p
            className={clx("text-dm-caption font-medium", inStock ? "text-success" : "text-danger")}
            role="status"
          >
            {availability.message}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleAddToCart}
            disabled={!inStock || !selectedVariant || !!disabled || isAdding || !isValidVariant}
            className="dm-btn-block"
            size="large"
            isLoading={isAdding}
            loadingLabel="Đang thêm"
            data-testid="add-product-button"
          >
            {buttonLabel}
          </Button>
          <LocalizedClientLink
            href="/cart"
            className="text-center text-dm-caption text-ink-faint underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink"
          >
            Xem giỏ hàng
          </LocalizedClientLink>
        </div>

        {feedback && (
          <p
            role={feedback.tone === "error" ? "alert" : "status"}
            aria-live="polite"
            className={clx(
              "text-dm-small",
              feedback.tone === "error" ? "text-danger" : "text-success",
            )}
          >
            {feedback.tone === "error" ? customerErrorMessage(feedback.message) : feedback.message}
          </p>
        )}

        <ul className="flex flex-col gap-2 border-t border-line pt-5 text-dm-caption text-ink-muted">
          <li>Lựa chọn giao hàng và chi phí được xác nhận khi thanh toán.</li>
          <li>Thanh toán khi nhận hàng. Chưa thu tiền khi đặt.</li>
          <li>
            <LocalizedClientLink href="/store" className="dm-link">
              Thông tin giao hàng và đổi trả
            </LocalizedClientLink>
          </li>
        </ul>

        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
