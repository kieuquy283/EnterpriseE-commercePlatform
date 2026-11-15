"use client"

import { Table, Text } from "@modules/common/components/ui"
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductImage from "@modules/products/components/product-image"
import Spinner from "@modules/common/icons/spinner"
import { useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  // TODO: Update this to grab the actual max inventory
  const maxQtyFromInventory = 10
  const maxQuantity = item.variant?.manage_inventory ? 10 : maxQtyFromInventory

  if (type === "preview") {
    return (
      <Table.Row className="w-full" data-testid="product-row">
        <Table.Cell className="!pl-0 px-0 py-3">
          <div className="dm-media-portrait w-12 overflow-hidden rounded-dm-xs bg-surface">
            <ProductImage src={item.thumbnail} alt="" sizes="48px" placeholderSize={12} />
          </div>
        </Table.Cell>

        <Table.Cell className="px-0 py-3 text-left">
          <Text as="span" className="block truncate text-dm-small font-medium text-ink">
            {item.product_title}
          </Text>
          <Text as="span" className="block text-dm-caption text-ink-faint">
            {item.variant?.title}
          </Text>
        </Table.Cell>

        <Table.Cell className="!pr-0 px-0 py-3">
          <span className="flex flex-col items-end">
            <span className="flex items-baseline gap-x-1.5 text-dm-caption text-ink-faint">
              <span className="tabular-nums" data-testid="product-quantity">
                {item.quantity}
              </span>
              <span aria-hidden="true">×</span>
              <LineItemUnitPrice item={item} style="tight" currencyCode={currencyCode} />
            </span>
            <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
          </span>
        </Table.Cell>
      </Table.Row>
    )
  }

  return (
    <li
      className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-x-5 gap-y-4 border-b border-line py-6 first:pt-0 last:border-b-0 small:grid-cols-[96px_minmax(0,1fr)_11rem_7rem] small:gap-x-6"
      data-testid="product-row"
      aria-busy={updating || undefined}
    >
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        className="dm-media-portrait block w-full overflow-hidden rounded-dm-sm bg-surface"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductImage
          src={item.thumbnail}
          alt=""
          sizes="(max-width: 1024px) 88px, 96px"
          placeholderSize={16}
        />
      </LocalizedClientLink>

      <div className="flex min-w-0 flex-col gap-y-1.5">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className="block break-words text-dm-body font-medium leading-snug text-ink transition-colors duration-200 ease-dm-out hover:text-accent"
          data-testid="product-title"
        >
          {item.product_title}
        </LocalizedClientLink>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />

        <ErrorMessage error={error} data-testid="product-error-message" />
      </div>

      <div className="col-span-2 flex items-center justify-between gap-x-4 small:col-span-1 small:justify-start">
        {/* DOM order keeps the remove action first; it is rendered to the
            right of the quantity pill by `flex-row-reverse`. */}
        <div className="flex flex-row-reverse items-center gap-x-4">
          <div data-testid="product-delete-button">
            <DeleteButton id={item.id} className="text-dm-small">
              Xoá
            </DeleteButton>
          </div>
          <div className="flex items-center gap-x-2">
            <label htmlFor={`quantity-${item.id}`} className="dm-caption sr-only">
              Số lượng của {item.product_title}
            </label>
            <CartItemSelect
              id={`quantity-${item.id}`}
              value={item.quantity}
              onChange={(value) => changeQuantity(parseInt(value.target.value))}
              data-testid="product-select-button"
            >
              {/* TODO: Update this with the v2 way of managing inventory */}
              {Array.from(
                {
                  length: Math.min(maxQuantity, 10),
                },
                (_, i) => (
                  <option value={i + 1} key={i}>
                    {i + 1}
                  </option>
                ),
              )}
            </CartItemSelect>
          </div>
        </div>
        {updating && (
          <span className="flex items-center gap-x-2 text-dm-caption text-ink-faint">
            <Spinner size="14" />
            Đang cập nhật
          </span>
        )}
      </div>

      <div className="col-span-2 flex items-baseline justify-between gap-x-4 border-t border-line/70 pt-3 small:col-span-1 small:flex-col small:items-end small:gap-y-1 small:border-t-0 small:pt-0">
        <span className="dm-caption small:hidden">Thành tiền</span>
        <div className="flex items-baseline gap-x-2">
          {item.quantity > 1 && (
            <LineItemUnitPrice item={item} style="tight" currencyCode={currencyCode} />
          )}
          <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
        </div>
      </div>
    </li>
  )
}

export default Item
