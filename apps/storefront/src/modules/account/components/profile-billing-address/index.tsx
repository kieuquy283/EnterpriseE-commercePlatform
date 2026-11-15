"use client"

import React, { useActionState, useEffect, useMemo } from "react"

import { Input, NativeSelect } from "@modules/common/components/ui"

import { addCustomerAddress, updateCustomerAddress } from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import AccountInfo from "../account-info"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
  regions: HttpTypes.StoreRegion[]
}

const ProfileBillingAddress: React.FC<MyInformationProps> = ({ customer, regions }) => {
  const regionOptions = useMemo(() => {
    return (
      regions
        ?.map((region) => {
          return region.countries?.map((country) => ({
            value: country.iso_2,
            label: country.display_name,
          }))
        })
        .flat() || []
    )
  }, [regions])

  const [successState, setSuccessState] = React.useState(false)

  const billingAddress = customer.addresses?.find((addr) => addr.is_default_billing)

  const initialState: Record<string, unknown> = {
    isDefaultBilling: true,
    isDefaultShipping: false,
    error: false,
    success: false,
  }

  if (billingAddress) {
    initialState.addressId = billingAddress.id
  }

  const [state, formAction] = useActionState(
    billingAddress ? updateCustomerAddress : addCustomerAddress,
    initialState,
  )

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(!!state.success)
  }, [state])

  const currentInfo = useMemo(() => {
    if (!billingAddress) {
      return "Chưa lưu địa chỉ xuất hoá đơn"
    }

    const country =
      regionOptions?.find((country) => country?.value === billingAddress.country_code)?.label ||
      billingAddress.country_code?.toUpperCase()

    return (
      <div className="flex flex-col font-semibold" data-testid="current-info">
        <span>
          {billingAddress.first_name} {billingAddress.last_name}
        </span>
        <span>{billingAddress.company}</span>
        <span>
          {billingAddress.address_1}
          {billingAddress.address_2 ? `, ${billingAddress.address_2}` : ""}
        </span>
        <span>
          {billingAddress.postal_code}, {billingAddress.city}
        </span>
        <span>{country}</span>
      </div>
    )
  }, [billingAddress, regionOptions])

  return (
    <form action={formAction} onReset={() => clearState()} className="w-full">
      <input type="hidden" name="addressId" value={billingAddress?.id} />
      <AccountInfo
        label="Địa chỉ xuất hoá đơn"
        currentInfo={currentInfo}
        isSuccess={successState}
        isError={!!state.error}
        errorMessage={typeof state.error === "string" ? state.error : undefined}
        clearState={clearState}
        data-testid="account-billing-address-editor"
      >
        <div className="grid grid-cols-1 gap-4 xsmall:grid-cols-2">
          <Input
            label="Tên"
            name="first_name"
            autoComplete="given-name"
            defaultValue={billingAddress?.first_name || undefined}
            required
            data-testid="billing-first-name-input"
          />
          <Input
            label="Họ"
            name="last_name"
            autoComplete="family-name"
            defaultValue={billingAddress?.last_name || undefined}
            required
            data-testid="billing-last-name-input"
          />
          <Input
            label="Công ty (không bắt buộc)"
            name="company"
            autoComplete="organization"
            defaultValue={billingAddress?.company || undefined}
            data-testid="billing-company-input"
          />
          <Input
            label="Số điện thoại"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            defaultValue={billingAddress?.phone ?? customer?.phone ?? ""}
            data-testid="billing-phone-input"
          />
          <div className="xsmall:col-span-2">
            <Input
              label="Địa chỉ"
              name="address_1"
              autoComplete="address-line1"
              defaultValue={billingAddress?.address_1 || undefined}
              required
              data-testid="billing-address-1-input"
            />
          </div>
          <Input
            label="Mã bưu chính"
            name="postal_code"
            autoComplete="postal-code"
            defaultValue={billingAddress?.postal_code || undefined}
            required
            data-testid="billing-postcal-code-input"
          />
          <Input
            label="Tỉnh / Thành phố"
            name="city"
            autoComplete="address-level2"
            defaultValue={billingAddress?.city || undefined}
            required
            data-testid="billing-city-input"
          />
          <Input
            label="Quận / Huyện"
            name="province"
            autoComplete="address-level1"
            defaultValue={billingAddress?.province || undefined}
            data-testid="billing-province-input"
          />
          <NativeSelect
            label="Quốc gia"
            name="country_code"
            defaultValue={billingAddress?.country_code || undefined}
            required
            data-testid="billing-country-code-select"
          >
            <option value="">Chọn quốc gia</option>
            {regionOptions.map((option, i) => {
              return (
                <option key={i} value={option?.value}>
                  {option?.label}
                </option>
              )
            })}
          </NativeSelect>
          <div className="xsmall:col-span-2">
            <Input
              label="Căn hộ, số tầng (không bắt buộc)"
              name="address_2"
              autoComplete="address-line2"
              defaultValue={billingAddress?.address_2 || undefined}
              data-testid="billing-address-2-input"
            />
          </div>
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileBillingAddress
