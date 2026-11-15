import { HttpTypes } from "@medusajs/types"
import { productOptionLabel } from "@lib/util/product-option-label"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
}

/**
 * Variant selector.
 *
 * Each option value is rendered as a toggle button. Availability for the
 * selected combination is reported beside the purchase action.
 * The selected value is announced via `aria-pressed`.
 */
const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
}) => {
  const isColour = /colou?r|màu/i.test(title)
  const values = (option.values ?? []).filter((value) => Boolean(value.value))

  return (
    <fieldset className="flex flex-col gap-y-3 border-0 p-0">
      <legend className="flex w-full items-baseline justify-between gap-4 pb-1">
        <span className="dm-label mb-0">
          {isColour ? "Màu sắc" : productOptionLabel(title)}
          {current ? (
            <span className="ml-2 normal-case tracking-normal text-ink-muted">
              {productOptionLabel(current)}
            </span>
          ) : null}
        </span>
        <span className="text-dm-caption text-ink-faint">{current ? "" : "Chọn một"}</span>
      </legend>

      <div className="flex flex-wrap gap-2" data-testid={dataTestId}>
        {values.map((value) => {
          const value_ = value.value as string
          return (
            <button
              type="button"
              onClick={() => updateOption(option.id, value_)}
              key={value.id ?? value_}
              aria-pressed={value_ === current}
              className="dm-choice"
              disabled={disabled}
              data-testid="option-button"
            >
              {productOptionLabel(value_)}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export default OptionSelect
