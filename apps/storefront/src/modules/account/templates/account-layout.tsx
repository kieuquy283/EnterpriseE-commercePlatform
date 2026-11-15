import React from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({ customer, children }) => {
  return (
    <div className="dm-section" data-testid="account-page">
      <div className="content-container flex flex-col">
        <div className="grid grid-cols-1 gap-x-16 gap-y-8 small:grid-cols-[240px_minmax(0,1fr)]">
          {customer && (
            <aside className="border-b border-line pb-6 small:border-b-0 small:border-r small:pr-8">
              <AccountNav customer={customer} />
            </aside>
          )}
          <div className={customer ? "min-w-0 flex-1" : "min-w-0 small:col-span-2"}>{children}</div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-line pt-8 small:flex-row small:items-end">
          <div className="flex flex-col gap-y-2">
            <h2 className="dm-heading">Bạn cần hỗ trợ về đơn hàng?</h2>
            <p className="dm-body max-w-dm-prose">
              Chúng tôi sẵn sàng hỗ trợ về cỡ, giao hàng và đổi trả.
            </p>
          </div>
          <LocalizedClientLink
            href="/#daymark-service"
            className="dm-btn dm-btn-secondary dm-btn-sm"
          >
            Chăm sóc khách hàng
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
