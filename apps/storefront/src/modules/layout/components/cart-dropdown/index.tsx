"use client"

import { ShoppingBag } from "@medusajs/icons"
import { Popover, PopoverButton, PopoverPanel, Transition } from "@headlessui/react"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"

const CartDropdown = ({ cart: cartState }: { cart?: HttpTypes.StoreCart | null }) => {
  const [activeTimer, setActiveTimer] = useState<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems = cartState?.items?.reduce((total, item) => total + item.quantity, 0) || 0

  const subtotal = cartState?.subtotal ?? 0
  const itemRef = useRef<number>(totalItems || 0)

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }
    open()
  }

  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  // Auto-reveal the mini cart after a line item changes, unless the customer is
  // already on the cart page where the same information is on screen.
  useEffect(() => {
    const previous = itemRef.current
    itemRef.current = totalItems
    if (previous === totalItems || pathname.includes("/cart")) return
    setCartDropdownOpen(true)
    const timer = setTimeout(() => setCartDropdownOpen(false), 5000)
    setActiveTimer(timer)
    return () => clearTimeout(timer)
  }, [totalItems, pathname])

  const sortedItems = [...(cartState?.items ?? [])].sort((a, b) =>
    (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1,
  )

  return (
    <div
      className="z-50 flex h-full items-center"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative flex h-full items-center">
        <PopoverButton as={Fragment}>
          <LocalizedClientLink
            className="dm-nav-link whitespace-nowrap uppercase"
            style={{ letterSpacing: "0.08em" }}
            href="/cart"
            data-testid="nav-cart-link"
            aria-label={`Giỏ hàng (${totalItems})`}
          >
            <span className="hidden small:inline">Giỏ hàng ({totalItems})</span>
            <span className="inline-flex items-center gap-1.5 small:hidden" aria-hidden="true">
              <ShoppingBag />
              {totalItems}
            </span>
            <span className="sr-only">
              {totalItems === 1 ? "sản phẩm trong giỏ" : "sản phẩm trong giỏ"}
            </span>
          </LocalizedClientLink>
        </PopoverButton>

        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-dm-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="absolute right-0 top-[calc(100%+0.75rem)] hidden w-[26rem] border border-line bg-canvas shadow-dm-raised small:block"
            data-testid="nav-cart-dropdown"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h3 className="dm-eyebrow">Giỏ hàng của bạn</h3>
              <span className="text-dm-caption text-ink-faint">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </span>
            </div>

            {sortedItems.length > 0 ? (
              <>
                <ul className="no-scrollbar max-h-[24rem] divide-y divide-line overflow-y-auto">
                  {sortedItems.map((item) => (
                    <li
                      className="grid grid-cols-[4.5rem_1fr] gap-x-4 px-5 py-4"
                      key={item.id}
                      data-testid="cart-item"
                    >
                      <LocalizedClientLink
                        href={`/products/${item.product_handle}`}
                        className="block"
                      >
                        <Thumbnail
                          thumbnail={item.thumbnail}
                          images={item.variant?.product?.images}
                          size="square"
                        />
                      </LocalizedClientLink>
                      <div className="flex min-w-0 flex-col justify-between">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="truncate text-dm-small font-medium text-ink">
                              <LocalizedClientLink
                                href={`/products/${item.product_handle}`}
                                data-testid="product-link"
                              >
                                {item.title}
                              </LocalizedClientLink>
                            </h4>
                            <LineItemOptions
                              variant={item.variant}
                              data-testid="cart-item-variant"
                              data-value={item.variant}
                            />
                            <span
                              className="text-dm-caption text-ink-faint"
                              data-testid="cart-item-quantity"
                              data-value={item.quantity}
                            >
                              Số lượng: {item.quantity}
                            </span>
                          </div>
                          <LineItemPrice
                            item={item}
                            style="tight"
                            currencyCode={cartState?.currency_code ?? "vnd"}
                          />
                        </div>
                        <DeleteButton
                          id={item.id}
                          className="mt-2 self-start text-dm-caption text-ink-faint hover:text-danger"
                          data-testid="cart-item-remove-button"
                        >
                          Xoá
                        </DeleteButton>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-4 border-t border-line px-5 py-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-dm-small text-ink-muted">
                      Tạm tính{" "}
                      <span className="text-dm-caption text-ink-faint">
                        (chưa gồm phí giao hàng và thuế)
                      </span>
                    </span>
                    <span
                      className="text-dm-title-sm font-semibold tabular-nums text-ink"
                      data-testid="cart-subtotal"
                      data-value={subtotal}
                    >
                      {convertToLocale({
                        amount: subtotal,
                        currency_code: cartState?.currency_code ?? "vnd",
                      })}
                    </span>
                  </div>
                  <LocalizedClientLink href="/cart" passHref>
                    <Button className="w-full" data-testid="go-to-cart-button" onClick={close}>
                      Xem giỏ hàng
                    </Button>
                  </LocalizedClientLink>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-start gap-4 px-5 py-10">
                <p className="text-dm-title-sm font-medium text-ink">Giỏ hàng đang trống</p>
                <p className="text-dm-small text-ink-muted">
                  Tìm những món đồ dễ mặc cho mỗi ngày của bạn.
                </p>
                <LocalizedClientLink href="/store" onClick={close}>
                  <Button variant="secondary">Khám phá bộ sưu tập</Button>
                </LocalizedClientLink>
              </div>
            )}
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
