import { Metadata } from "next"

import OrderOverview from "@modules/account/components/order-overview"
import TransferRequestForm from "@modules/account/components/transfer-request-form"
import { notFound } from "next/navigation"
import { listOrders } from "@lib/data/orders"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const PAGE_SIZE = 10

export const metadata: Metadata = {
  title: "Đơn hàng",
  description: "Tổng quan các đơn hàng của bạn.",
}

export default async function Orders({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const requestedPage = Number((await searchParams).page)
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 1000) : 1
  const orders = await listOrders(PAGE_SIZE + 1, (page - 1) * PAGE_SIZE)

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

      <OrderOverview orders={orders.slice(0, PAGE_SIZE)} />

      {(page > 1 || orders.length > PAGE_SIZE) && (
        <nav
          className="flex items-center justify-between gap-4"
          aria-label="Trang lịch sử đơn hàng"
        >
          {page > 1 ? (
            <LocalizedClientLink
              href={`/account/orders?page=${page - 1}`}
              className="dm-btn-secondary"
            >
              Trang trước
            </LocalizedClientLink>
          ) : (
            <span />
          )}
          {orders.length > PAGE_SIZE && (
            <LocalizedClientLink
              href={`/account/orders?page=${page + 1}`}
              className="dm-btn-secondary"
            >
              Trang sau
            </LocalizedClientLink>
          )}
        </nav>
      )}

      <div className="border-t border-line pt-8">
        <TransferRequestForm />
      </div>
    </div>
  )
}
