import { Metadata } from "next"

import OrderOverview from "@modules/account/components/order-overview"
import TransferRequestForm from "@modules/account/components/transfer-request-form"
import { notFound } from "next/navigation"
import { listOrders } from "@lib/data/orders"

export const metadata: Metadata = {
  title: "Đơn hàng",
  description: "Tổng quan các đơn hàng của bạn.",
}

export default async function Orders() {
  const orders = await listOrders()

  if (!orders) {
    notFound()
  }

  return (
    <div className="flex w-full flex-col gap-y-8" data-testid="orders-page-wrapper">
      <div className="flex flex-col gap-y-2">
        <p className="dm-eyebrow">Lịch sử đơn hàng</p>
        <h1 className="dm-title">Đơn hàng</h1>
        <p className="dm-body max-w-dm-prose">
          Theo dõi tình trạng giao hàng và thanh toán. Mở một đơn để xem sản phẩm, địa chỉ và tổng
          tiền.
        </p>
      </div>

      <OrderOverview orders={orders} />

      <div className="border-t border-line pt-8">
        <TransferRequestForm />
      </div>
    </div>
  )
}
