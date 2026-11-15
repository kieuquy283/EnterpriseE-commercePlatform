import { paymentInfoMap } from "@lib/constants"
import { COD_PAYMENT_PROVIDER_ID, isSimulatorPaymentProvider } from "@lib/util/checkout-payment"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0].payments?.[0]
  const paymentAmount = payment
    ? convertToLocale({
        amount: payment.amount,
        currency_code: order.currency_code,
      })
    : null

  const paymentDescription = payment
    ? payment.provider_id === COD_PAYMENT_PROVIDER_ID
      ? `${paymentAmount} thu tiền khi giao hàng`
      : isSimulatorPaymentProvider(payment.provider_id)
        ? `${paymentAmount} - thanh toán thử (không thu tiền thật)`
        : `Số tiền thanh toán: ${paymentAmount}`
    : null

  return (
    <section className="flex flex-col gap-y-4">
      <h2 className="dm-heading">Thanh toán</h2>
      {payment ? (
        <dl className="grid grid-cols-1 gap-6 small:grid-cols-2">
          <div className="flex flex-col gap-y-1">
            <dt className="dm-eyebrow">Phương thức</dt>
            <dd
              className="flex items-center gap-x-2 text-dm-small text-ink-muted"
              data-testid="payment-method"
            >
              {paymentInfoMap[payment.provider_id]?.title || payment.provider_id}
            </dd>
          </div>
          <div className="flex flex-col gap-y-1">
            <dt className="dm-eyebrow">Chi tiết</dt>
            <dd
              className="flex items-center gap-x-2 text-dm-small text-ink-muted"
              data-testid="payment-amount"
            >
              {paymentInfoMap[payment.provider_id]?.icon}
              <span>{paymentDescription}</span>
            </dd>
          </div>
        </dl>
      ) : (
        <p className="dm-caption">Chưa ghi nhận thanh toán cho đơn hàng này.</p>
      )}
    </section>
  )
}

export default PaymentDetails
