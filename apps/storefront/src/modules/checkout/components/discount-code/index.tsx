"use client"

import { Badge, Input } from "@modules/common/components/ui"
import React from "react"

import { applyPromotions } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import Trash from "@modules/common/icons/trash"
import ErrorMessage from "../error-message"
import { SubmitButton } from "../submit-button"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")

  const { promotions = [] } = cart
  const removePromotionCode = async (code: string) => {
    const validPromotions = promotions.filter((promotion) => promotion.code !== code)

    await applyPromotions(validPromotions.filter((p) => p.code !== undefined).map((p) => p.code!))
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")

    const code = formData.get("code")
    if (!code) {
      return
    }
    const input = document.getElementById("promotion-input") as HTMLInputElement
    const codes = promotions.filter((p) => p.code !== undefined).map((p) => p.code!)
    codes.push(code.toString())

    try {
      await applyPromotions(codes)
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e))
    }

    if (input) {
      input.value = ""
    }
  }

  return (
    <div className="flex w-full flex-col gap-y-4">
      <form action={(a) => addPromotionCode(a)} className="flex flex-col gap-y-3">
        {isOpen ? (
          <>
            <Input
              id="promotion-input"
              name="code"
              type="text"
              label="Mã ưu đãi"
              autoComplete="off"
              data-testid="discount-input"
            />
            <div className="flex items-center gap-x-2">
              <SubmitButton variant="secondary" size="small" data-testid="discount-apply-button">
                Áp dụng
              </SubmitButton>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage("")
                  setIsOpen(false)
                }}
                className="dm-btn dm-btn-ghost dm-btn-sm"
              >
                Huỷ
              </button>
            </div>
            <ErrorMessage error={errorMessage} data-testid="discount-error-message" />
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="dm-action-link self-start"
            aria-expanded={isOpen}
            data-testid="add-discount-button"
          >
            Thêm mã ưu đãi
          </button>
        )}
      </form>

      {promotions.length > 0 && (
        <div className="flex flex-col gap-y-2">
          <p className="dm-eyebrow">Đã áp dụng</p>
          {promotions.map((promotion) => {
            return (
              <div
                key={promotion.id}
                className="flex w-full items-center justify-between gap-x-3"
                data-testid="discount-row"
              >
                <span className="flex min-w-0 items-baseline gap-x-2" data-testid="discount-code">
                  <Badge tone={promotion.is_automatic ? "accent" : "neutral"}>
                    {promotion.code}
                  </Badge>
                  <span className="truncate text-dm-caption text-ink-muted tabular-nums">
                    (
                    {promotion.application_method?.value !== undefined &&
                      promotion.application_method.currency_code !== undefined && (
                        <>
                          {promotion.application_method.type === "percentage"
                            ? `${promotion.application_method.value}%`
                            : convertToLocale({
                                amount: +promotion.application_method.value,
                                currency_code: promotion.application_method.currency_code,
                              })}
                        </>
                      )}
                    )
                  </span>
                </span>
                {!promotion.is_automatic && (
                  <button
                    type="button"
                    className="dm-btn-icon"
                    onClick={() => {
                      if (!promotion.code) {
                        return
                      }

                      removePromotionCode(promotion.code)
                    }}
                    data-testid="remove-discount-button"
                  >
                    <Trash size={14} />
                    <span className="sr-only">Xoá mã ưu đãi khỏi đơn hàng</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DiscountCode
