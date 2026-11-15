import { Metadata } from "next"

import ProfilePhone from "@modules/account//components/profile-phone"
import ProfileBillingAddress from "@modules/account/components/profile-billing-address"
import ProfileEmail from "@modules/account/components/profile-email"
import ProfileName from "@modules/account/components/profile-name"
import { notFound } from "next/navigation"
import { listRegions } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Thông tin cá nhân",
  description: "Xem và cập nhật thông tin tài khoản DAYMARK.",
}

export default async function Profile() {
  const customer = await retrieveCustomer()
  const regions = await listRegions()

  if (!customer || !regions) {
    notFound()
  }

  return (
    <div className="flex w-full flex-col gap-y-8" data-testid="profile-page-wrapper">
      <div className="flex flex-col gap-y-2">
        <p className="dm-eyebrow">Tài khoản</p>
        <h1 className="dm-title">Thông tin cá nhân</h1>
        <p className="dm-body max-w-dm-prose">
          Cập nhật họ tên, số điện thoại và địa chỉ để dùng cho hoá đơn và giao hàng.
        </p>
      </div>

      <div className="flex w-full flex-col divide-y divide-line">
        <div className="pb-8">
          <ProfileName customer={customer} />
        </div>
        <div className="py-8">
          <ProfileEmail customer={customer} />
        </div>
        <div className="py-8">
          <ProfilePhone customer={customer} />
        </div>
        <div className="pt-8">
          <ProfileBillingAddress customer={customer} regions={regions} />
        </div>
      </div>
    </div>
  )
}
