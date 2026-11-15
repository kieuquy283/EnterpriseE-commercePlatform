import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderSummaryProps = {
  order: HttpTypes.StoreOrder
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  const getAmount = (amount?: number | null) => {
    if (!amount) {
      return
    }

    return convertToLocale({
      amount,
      currency_code: order.currency_code,
    })
  }

  return (
    <section className="flex flex-col gap-y-4">
      <h2 className="dm-heading">Tóm tắt đơn hàng</h2>
      <div className="flex flex-col">
        <div className="dm-data-row">
          <span className="text-ink-muted">Tạm tính</span>
          <span className="tabular-nums text-ink">{getAmount(order.subtotal)}</span>
        </div>
        {order.discount_total > 0 && (
          <div className="dm-data-row">
            <span className="text-ink-muted">Ưu đãi</span>
            <span className="tabular-nums text-accent">- {getAmount(order.discount_total)}</span>
          </div>
        )}
        {order.gift_card_total > 0 && (
          <div className="dm-data-row">
            <span className="text-ink-muted">Thẻ quà tặng</span>
            <span className="tabular-nums text-accent">- {getAmount(order.gift_card_total)}</span>
          </div>
        )}
        <div className="dm-data-row">
          <span className="text-ink-muted">Phí giao hàng</span>
          <span className="tabular-nums text-ink">{getAmount(order.shipping_total)}</span>
        </div>
        <div className="dm-data-row">
          <span className="text-ink-muted">Thuế</span>
          <span className="tabular-nums text-ink">{getAmount(order.tax_total)}</span>
        </div>
        <div className="dm-data-row-last mt-2 border-t border-line-strong pt-4">
          <span className="text-dm-small font-semibold uppercase tracking-[0.08em] text-ink">
            Tổng cộng
          </span>
          <span className="dm-total" data-testid="order-total">
            {getAmount(order.total)}
          </span>
        </div>
      </div>
    </section>
  )
}

export default OrderSummary
