import { HttpTypes } from "@medusajs/types"
import OrderStatusBadge from "@modules/order/components/order-status-badge"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="flex flex-col gap-y-1">
          <p className="dm-eyebrow">Mã đơn hàng</p>
          <p className="dm-numeric text-dm-title font-medium text-ink" data-testid="order-id">
            {order.display_id}
          </p>
        </div>

        {showStatus ? (
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge
              label="Giao hàng"
              status={order.fulfillment_status}
              statusTestId="order-status"
            />
            <OrderStatusBadge
              label="Thanh toán"
              status={order.payment_status}
              statusTestId="order-payment-status"
            />
          </div>
        ) : null}
      </div>

      <dl className="grid grid-cols-1 gap-6 border-t border-line pt-6 small:grid-cols-2">
        <div className="flex flex-col gap-y-1">
          <dt className="dm-eyebrow">Ngày đặt hàng</dt>
          <dd className="text-dm-small text-ink-muted">
            <span data-testid="order-date">
              {new Date(order.created_at).toLocaleDateString("vi-VN", {
                timeZone: "Asia/Ho_Chi_Minh",
              })}
            </span>
          </dd>
        </div>
        <div className="flex flex-col gap-y-1">
          <dt className="dm-eyebrow">Email của đơn hàng</dt>
          <dd className="break-words text-dm-small font-medium text-ink">
            <span data-testid="order-email">{order.email}</span>
          </dd>
        </div>
      </dl>
    </div>
  )
}

export default OrderDetails
