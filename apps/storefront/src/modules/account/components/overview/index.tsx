import { HttpTypes } from "@medusajs/types"

import ChevronDown from "@modules/common/icons/chevron-down"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import PersonalizationConsent from "@modules/account/components/personalization-consent"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const Overview = ({ customer, orders }: OverviewProps) => {
  const profileCompletion = getProfileCompletion(customer)

  return (
    <div className="flex flex-col gap-y-8" data-testid="overview-page-wrapper">
      <div className="flex flex-col gap-y-2">
        <p className="dm-eyebrow">Tài khoản</p>
        <h1 className="dm-title" data-testid="welcome-message" data-value={customer?.first_name}>
          Xin chào {customer?.first_name}
        </h1>
        <p className="dm-body">
          Đăng nhập với{" "}
          <span
            className="break-words font-medium text-ink"
            data-testid="customer-email"
            data-value={customer?.email}
          >
            {customer?.email}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 border-y border-line xsmall:grid-cols-2 xsmall:divide-x xsmall:divide-line">
        <div className="flex flex-col gap-y-3 py-6 xsmall:px-6">
          <p className="dm-eyebrow">Mức độ hoàn thiện hồ sơ</p>
          <p className="flex items-baseline gap-x-2">
            <span
              className="dm-numeric text-dm-title-lg font-medium text-ink"
              data-testid="customer-profile-completion"
              data-value={profileCompletion}
            >
              {profileCompletion}%
            </span>
            <span className="dm-caption">hoàn thiện</span>
          </p>
          <LocalizedClientLink href="/account/profile" className="dm-link self-start text-dm-small">
            Sửa thông tin
          </LocalizedClientLink>
        </div>

        <div className="flex flex-col gap-y-3 py-6 xsmall:px-6">
          <p className="dm-eyebrow">Địa chỉ đã lưu</p>
          <p className="flex items-baseline gap-x-2">
            <span
              className="dm-numeric text-dm-title-lg font-medium text-ink"
              data-testid="addresses-count"
              data-value={customer?.addresses?.length || 0}
            >
              {customer?.addresses?.length || 0}
            </span>
            <span className="dm-caption">địa chỉ</span>
          </p>
          <LocalizedClientLink
            href="/account/addresses"
            className="dm-link self-start text-dm-small"
          >
            Quản lý địa chỉ
          </LocalizedClientLink>
        </div>
      </div>

      <section className="flex flex-col gap-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="dm-heading">Đơn hàng gần đây</h2>
          <LocalizedClientLink href="/account/orders" className="dm-link text-dm-small">
            Tất cả đơn hàng
          </LocalizedClientLink>
        </div>

        <ul
          className="flex flex-col divide-y divide-line border-t border-line"
          data-testid="orders-wrapper"
        >
          {orders && orders.length > 0 ? (
            orders.slice(0, 5).map((order) => {
              return (
                <li key={order.id} data-testid="order-wrapper" data-value={order.id}>
                  <LocalizedClientLink
                    href={`/account/orders/details/${order.id}`}
                    className="flex flex-col gap-2 py-4 transition-colors duration-200 ease-dm-out hover:bg-surface/60 small:flex-row small:items-center small:justify-between"
                  >
                    <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-dm-small">
                      <span
                        className="font-medium text-ink"
                        data-testid="order-id"
                        data-value={order.display_id}
                      >
                        #{order.display_id}
                      </span>
                      <span className="text-ink-muted" data-testid="order-created-date">
                        {new Date(order.created_at).toLocaleDateString("vi-VN", {
                          timeZone: "Asia/Ho_Chi_Minh",
                        })}
                      </span>
                      <span className="tabular-nums text-ink" data-testid="order-amount">
                        {convertToLocale({
                          amount: order.total,
                          currency_code: order.currency_code,
                        })}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="hidden text-ink-faint small:block"
                      data-testid="open-order-button"
                    >
                      <ChevronDown className="-rotate-90" />
                    </span>
                  </LocalizedClientLink>
                </li>
              )
            })
          ) : (
            <li className="py-6">
              <span className="dm-body" data-testid="no-orders-message">
                Đơn hàng đầu tiên của bạn sẽ xuất hiện tại đây.
              </span>
            </li>
          )}
        </ul>
      </section>

      {process.env.NEXT_PUBLIC_ENABLE_PERSONALIZED_RECOMMENDATIONS === "true" && (
        <PersonalizationConsent />
      )}
    </div>
  )
}

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  const billingAddress = customer.addresses?.find((addr) => addr.is_default_billing)

  if (billingAddress) {
    count++
  }

  return (count / 4) * 100
}

export default Overview
