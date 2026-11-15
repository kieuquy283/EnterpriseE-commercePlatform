import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  return (
    <section className="flex flex-col gap-y-4">
      <h2 className="dm-heading">Giao hàng</h2>
      <dl className="grid grid-cols-1 gap-6 small:grid-cols-3">
        <div className="flex flex-col gap-y-1" data-testid="shipping-address-summary">
          <dt className="dm-eyebrow">Địa chỉ</dt>
          <dd className="flex flex-col text-dm-small text-ink-muted">
            <span>
              {order.shipping_address?.first_name} {order.shipping_address?.last_name}
            </span>
            <span>
              {order.shipping_address?.address_1} {order.shipping_address?.address_2}
            </span>
            <span>
              {order.shipping_address?.postal_code}, {order.shipping_address?.city}
            </span>
            <span>{order.shipping_address?.country_code?.toUpperCase()}</span>
          </dd>
        </div>

        <div className="flex flex-col gap-y-1" data-testid="shipping-contact-summary">
          <dt className="dm-eyebrow">Thông tin liên hệ</dt>
          <dd className="flex flex-col text-dm-small text-ink-muted">
            <span>{order.shipping_address?.phone}</span>
            <span className="break-words">{order.email}</span>
          </dd>
        </div>

        <div className="flex flex-col gap-y-1" data-testid="shipping-method-summary">
          <dt className="dm-eyebrow">Phương thức</dt>
          <dd className="text-dm-small text-ink-muted">
            {(order.shipping_methods?.[0] as { name?: string })?.name}{" "}
            <span className="tabular-nums">
              (
              {convertToLocale({
                amount: order.shipping_methods?.[0]?.total ?? 0,
                currency_code: order.currency_code,
              })}
              )
            </span>
          </dd>
        </div>
      </dl>
    </section>
  )
}

export default ShippingDetails
