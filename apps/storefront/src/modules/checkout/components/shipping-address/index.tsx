import { HttpTypes } from "@medusajs/types"
import { Checkbox, Input } from "@modules/common/components/ui"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.company": cart?.shipping_address?.company || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code": cart?.shipping_address?.country_code || "",
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": cart?.shipping_address?.phone || "",
    email: cart?.email || "",
  })

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region],
  )

  // check if customer has saved addresses that are in the current region
  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code),
      ),
    [customer?.addresses, countriesInRegion],
  )

  const setFormAddress = (address?: HttpTypes.StoreCartAddress, email?: string) => {
    if (address) {
      setFormData((prevState: Record<string, string>) => ({
        ...prevState,
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.company": address?.company || "",
        "shipping_address.postal_code": address?.postal_code || "",
        "shipping_address.city": address?.city || "",
        "shipping_address.country_code": address?.country_code || "",
        "shipping_address.province": address?.province || "",
        "shipping_address.phone": address?.phone || "",
      }))
    }

    if (email) {
      setFormData((prevState: Record<string, string>) => ({
        ...prevState,
        email: email,
      }))
    }
  }

  useEffect(() => {
    // Ensure cart is not null and has a shipping_address before setting form data
    if (cart && cart.shipping_address) {
      setFormAddress(cart?.shipping_address, cart?.email)
    }

    if (cart && !cart.email && customer?.email) {
      setFormAddress(undefined, customer.email)
    }
  }, [cart, customer?.email])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <div className="dm-panel mb-2 flex flex-col gap-y-3 p-4 small:p-5">
          <p className="dm-caption">
            {`Xin chào ${customer.first_name}, bạn muốn dùng một địa chỉ đã lưu?`}
          </p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={
              mapKeys(formData, (_, key) =>
                key.replace("shipping_address.", ""),
              ) as unknown as HttpTypes.StoreCartAddress
            }
            onSelect={setFormAddress}
          />
        </div>
      )}

      <div className="flex flex-col gap-y-8">
        <div className="flex flex-col gap-y-4">
          <h3 className="mb-1 text-dm-small font-semibold text-ink">Thông tin liên hệ</h3>
          <div className="grid grid-cols-1 gap-4 xsmall:grid-cols-2">
            <Input
              label="Email"
              name="email"
              type="email"
              title="Vui lòng nhập địa chỉ email hợp lệ."
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
              data-testid="shipping-email-input"
            />
            <Input
              label="Số điện thoại"
              name="shipping_address.phone"
              type="tel"
              autoComplete="tel"
              value={formData["shipping_address.phone"]}
              onChange={handleChange}
              hint="Chỉ dùng để cập nhật tình trạng giao hàng."
              data-testid="shipping-phone-input"
            />
          </div>
        </div>

        <div className="flex flex-col gap-y-4 border-t border-line pt-8">
          <h3 className="mb-1 text-dm-small font-semibold text-ink">Địa chỉ nhận hàng</h3>
          <div className="grid grid-cols-1 gap-4 xsmall:grid-cols-2">
            <Input
              label="Tên"
              name="shipping_address.first_name"
              autoComplete="given-name"
              value={formData["shipping_address.first_name"]}
              onChange={handleChange}
              required
              data-testid="shipping-first-name-input"
            />
            <Input
              label="Họ"
              name="shipping_address.last_name"
              autoComplete="family-name"
              value={formData["shipping_address.last_name"]}
              onChange={handleChange}
              required
              data-testid="shipping-last-name-input"
            />
            <div className="xsmall:col-span-2">
              <Input
                label="Địa chỉ"
                name="shipping_address.address_1"
                autoComplete="address-line1"
                value={formData["shipping_address.address_1"]}
                onChange={handleChange}
                required
                data-testid="shipping-address-input"
              />
            </div>
            <Input
              label="Mã bưu chính"
              name="shipping_address.postal_code"
              autoComplete="postal-code"
              value={formData["shipping_address.postal_code"]}
              onChange={handleChange}
              required
              data-testid="shipping-postal-code-input"
            />
            <Input
              label="Tỉnh / Thành phố"
              name="shipping_address.city"
              autoComplete="address-level2"
              value={formData["shipping_address.city"]}
              onChange={handleChange}
              required
              data-testid="shipping-city-input"
            />
            <CountrySelect
              name="shipping_address.country_code"
              autoComplete="country"
              region={cart?.region}
              value={formData["shipping_address.country_code"]}
              onChange={handleChange}
              required
              data-testid="shipping-country-select"
            />
            <Input
              label="Quận / Huyện"
              name="shipping_address.province"
              autoComplete="address-level1"
              value={formData["shipping_address.province"]}
              onChange={handleChange}
              data-testid="shipping-province-input"
            />
            <div className="xsmall:col-span-2">
              <Input
                label="Công ty (không bắt buộc)"
                name="shipping_address.company"
                value={formData["shipping_address.company"]}
                onChange={handleChange}
                autoComplete="organization"
                data-testid="shipping-company-input"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="my-6">
        <Checkbox
          id="same-as-billing"
          label="Địa chỉ xuất hoá đơn giống địa chỉ nhận hàng"
          name="same_as_billing"
          checked={checked}
          onChange={onChange}
          data-testid="billing-address-checkbox"
        />
      </div>
    </>
  )
}

export default ShippingAddress
