"use client"

import * as Accordion from "@radix-ui/react-accordion"
import { useEffect, useState } from "react"

import { ChevronDownMini } from "@medusajs/icons"
import { productOptionLabel } from "@lib/util/product-option-label"
import { listProductOptions } from "@lib/data/product-options"
import { HttpTypes } from "@medusajs/types"
import clsx from "clsx"

type OptionsPickerProps = {
  selectedValueIds: string[]
  setOptionValueIds: (valueIds: string[]) => void
}

const OptionsPicker = ({ selectedValueIds, setOptionValueIds }: OptionsPickerProps) => {
  const [options, setOptions] = useState<HttpTypes.StoreProductOption[]>([])
  const [openItems, setOpenItems] = useState<string[]>([])

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setOptions(await listProductOptions())
      } catch (error) {
        console.error("Failed to fetch product options", error)
      }
    }

    fetchOptions()
  }, [])

  useEffect(() => {
    if (options.length) {
      setOpenItems(options.map((option) => option.id))
    }
  }, [options])

  if (!options.length) {
    return null
  }

  return (
    <div className="mt-3 flex flex-col gap-y-2">
      <div className="flex items-center justify-between">
        <span
          className="text-dm-caption font-semibold uppercase text-ink-muted"
          style={{ letterSpacing: "0.08em" }}
        >
          Phân loại
        </span>
      </div>
      <Accordion.Root
        type="multiple"
        value={openItems}
        onValueChange={(values) => setOpenItems(values as string[])}
        className="flex flex-col gap-y-1"
      >
        {options.map((option) => {
          const values =
            option.values
              ?.map((value) => ({
                id: value.id,
                label: value.value,
              }))
              .filter(
                (value): value is { id: string; label: string } => !!value.id && !!value.label,
              ) || []

          if (!values.length) {
            return null
          }

          const toggleValue = (valueId: string) => {
            const isSelected = selectedValueIds.includes(valueId)
            const nextSelections = isSelected
              ? selectedValueIds.filter((id) => id !== valueId)
              : [...selectedValueIds, valueId]

            setOptionValueIds(Array.from(new Set(nextSelections)))
          }

          const isOpen = openItems.includes(option.id)
          const selectedCount = values.filter((value) => selectedValueIds.includes(value.id)).length

          return (
            <Accordion.Item key={option.id} value={option.id} className="overflow-hidden">
              <Accordion.Header>
                <Accordion.Trigger className="flex w-full items-center justify-between py-3 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-dm-small font-semibold text-ink">
                      {option.title || "Lựa chọn"}
                    </span>
                    <span className="text-dm-caption text-ink-faint">({selectedCount})</span>
                  </div>
                  <span
                    className={clsx(
                      "flex h-7 w-7 items-center justify-center text-ink-muted transition-transform duration-150",
                      {
                        "rotate-180": isOpen,
                      },
                    )}
                  >
                    <ChevronDownMini />
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="pb-4 pt-1">
                <div className="flex flex-wrap gap-2">
                  {values.map((value) => {
                    const isSelected = selectedValueIds.includes(value.id)

                    return (
                      <button
                        key={value.id}
                        onClick={() => toggleValue(value.id)}
                        className="dm-choice"
                        aria-pressed={isSelected}
                      >
                        {productOptionLabel(value.label)}
                      </button>
                    )
                  })}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          )
        })}
      </Accordion.Root>
    </div>
  )
}

export default OptionsPicker
