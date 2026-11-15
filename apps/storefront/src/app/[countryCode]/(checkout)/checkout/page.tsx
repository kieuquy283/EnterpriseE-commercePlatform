import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CheckoutSteps from "@modules/checkout/components/checkout-steps"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Thanh toán",
}

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()

  return (
    <div className="dm-section">
      <div className="content-container">
        <div className="flex flex-col gap-y-6 border-b border-line pb-8">
          <h1 className="dm-display">Hoàn tất đơn hàng</h1>
          <CheckoutSteps cart={cart} />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-x-16 gap-y-12 small:grid-cols-[minmax(0,1fr)_22rem]">
          <CheckoutForm cart={cart} customer={customer} />
          <CheckoutSummary cart={cart} />
        </div>
      </div>
    </div>
  )
}
