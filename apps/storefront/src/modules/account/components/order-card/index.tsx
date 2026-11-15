import { useMemo } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import OrderStatusBadge from "@modules/order/components/order-status-badge"
import ProductImage from "@modules/products/components/product-image"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

const OrderCard = ({ order }: OrderCardProps) => {
  const numberOfLines = useMemo(() => {
    return (
      order.items?.reduce((acc, item) => {
        return acc + item.quantity
      }, 0) ?? 0
    )
  }, [order])

  const numberOfProducts = useMemo(() => {
    return order.items?.length ?? 0
  }, [order])

  return (
    <div className="dm-card flex flex-col gap-y-5 p-5" data-testid="order-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-y-1">
          <p className="dm-eyebrow">Đơn hàng</p>
          <p className="text-dm-title-sm font-medium text-ink tabular-nums">
            #<span data-testid="order-display-id">{order.display_id}</span>
          </p>
          <p className="flex flex-wrap items-center gap-x-3 text-dm-caption text-ink-faint">
            <span data-testid="order-created-at">
              {new Date(order.created_at).toLocaleDateString("vi-VN", {
                timeZone: "Asia/Ho_Chi_Minh",
              })}
            </span>
            <span aria-hidden="true">/</span>
            <span className="tabular-nums text-ink-muted" data-testid="order-amount">
              {convertToLocale({
                amount: order.total,
                currency_code: order.currency_code,
              })}
            </span>
            <span aria-hidden="true">/</span>
            <span>
              {numberOfLines} {numberOfLines === 1 ? "sản phẩm" : "sản phẩm"}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge label="Giao hàng" status={order.fulfillment_status} />
          <OrderStatusBadge label="Thanh toán" status={order.payment_status} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 small:grid-cols-4">
        {order.items?.slice(0, 3).map((i) => {
          return (
            <div key={i.id} className="flex flex-col gap-y-2" data-testid="order-item">
              <div className="dm-media-portrait w-full overflow-hidden rounded-dm-xs bg-surface">
                <ProductImage src={i.thumbnail} alt="" sizes="120px" />
              </div>
              <div className="flex items-baseline gap-x-1 text-dm-caption text-ink-muted">
                <span className="truncate font-medium text-ink" data-testid="item-title">
                  {i.title}
                </span>
                <span aria-hidden="true">×</span>
                <span className="tabular-nums" data-testid="item-quantity">
                  {i.quantity}
                </span>
              </div>
            </div>
          )
        })}
        {numberOfProducts > 4 && (
          <div className="flex h-full flex-col items-center justify-center text-dm-caption text-ink-faint">
            <span className="tabular-nums">+ {numberOfLines - 4}</span>
            <span>món khác</span>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <LocalizedClientLink
          href={`/account/orders/details/${order.id}`}
          className="dm-btn dm-btn-secondary dm-btn-sm"
          data-testid="order-details-link"
        >
          Xem chi tiết
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderCard
