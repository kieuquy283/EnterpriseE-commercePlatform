"use client"

import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import OrderSummary from "@modules/order/components/order-summary"
import ShippingDetails from "@modules/order/components/shipping-details"
import React from "react"

type OrderDetailsTemplateProps = {
  order: HttpTypes.StoreOrder
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({ order }) => {
  return (
    <div className="flex flex-col gap-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-y-1">
          <p className="dm-eyebrow">Lịch sử đơn hàng</p>
          <h1 className="dm-title">Chi tiết đơn hàng</h1>
        </div>
        <LocalizedClientLink
          href="/account/orders"
          className="dm-btn dm-btn-secondary dm-btn-sm"
          data-testid="back-to-overview-button"
        >
          Về tổng quan
        </LocalizedClientLink>
      </div>

      <div className="flex w-full flex-col gap-y-8" data-testid="order-details-container">
        <div className="dm-panel p-5 small:p-6">
          <OrderDetails order={order} showStatus />
        </div>

        <div className="flex flex-col gap-y-4">
          <h2 className="dm-heading">Sản phẩm</h2>
          <Items order={order} />
        </div>

        <div className="grid grid-cols-1 gap-8 small:grid-cols-2">
          <ShippingDetails order={order} />
          <OrderSummary order={order} />
        </div>

        <Help />
      </div>
    </div>
  )
}

export default OrderDetailsTemplate
