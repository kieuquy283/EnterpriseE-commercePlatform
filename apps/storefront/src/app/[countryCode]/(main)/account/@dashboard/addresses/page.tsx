import { Metadata } from "next"
import { notFound } from "next/navigation"

import AddressBook from "@modules/account/components/address-book"

import { getRegion } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Địa chỉ",
  description: "Xem địa chỉ của bạn",
}

export default async function Addresses(props: { params: Promise<{ countryCode: string }> }) {
  const params = await props.params
  const { countryCode } = params
  const customer = await retrieveCustomer()
  const region = await getRegion(countryCode)

  if (!customer || !region) {
    notFound()
  }

  return (
    <div className="flex w-full flex-col gap-y-8" data-testid="addresses-page-wrapper">
      <div className="flex flex-col gap-y-2">
        <p className="dm-eyebrow">Tài khoản</p>
        <h1 className="dm-title">Địa chỉ</h1>
        <p className="dm-body max-w-dm-prose">
          Lưu địa chỉ thường dùng để chọn nhanh khi thanh toán.
        </p>
      </div>

      <AddressBook customer={customer} region={region} />
    </div>
  )
}
