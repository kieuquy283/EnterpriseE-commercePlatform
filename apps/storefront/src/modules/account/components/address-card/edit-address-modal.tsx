"use client"

import { deleteCustomerAddress, updateCustomerAddress } from "@lib/data/customer"
import useToggleState from "@lib/hooks/use-toggle-state"
import { PencilSquare as Edit, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import CountrySelect from "@modules/checkout/components/country-select"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Modal from "@modules/common/components/modal"
import { Alert, Button, Heading, Input, Text, clx } from "@modules/common/components/ui"
import Spinner from "@modules/common/icons/spinner"
import React, { useCallback, useActionState, useEffect, useState } from "react"

type EditAddressProps = {
  region: HttpTypes.StoreRegion
  address: HttpTypes.StoreCustomerAddress
  isActive?: boolean
}

const EditAddress: React.FC<EditAddressProps> = ({ region, address, isActive = false }) => {
  const [removing, setRemoving] = useState(false)
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)

  const [formState, formAction] = useActionState(updateCustomerAddress, {
    success: false,
    error: null,
  } as { success: boolean; error: string | null })

  const close = useCallback(() => {
    setSuccessState(false)
    closeModal()
  }, [closeModal])

  useEffect(() => {
    if (successState) {
      close()
    }
  }, [successState, close])

  useEffect(() => {
    if (formState.success) {
      setSuccessState(true)
    }
  }, [formState])

  const removeAddress = async () => {
    setRemoving(true)
    await deleteCustomerAddress(address.id)
    setRemoving(false)
  }

  return (
    <>
      <div
        className={clx(
          "flex h-full min-h-[220px] w-full flex-col justify-between gap-y-4 rounded-dm-md border p-5 transition-colors duration-200 ease-dm-out",
          isActive
            ? "border-accent bg-accent-soft/20"
            : "border-line bg-canvas hover:border-line-strong",
        )}
        data-testid="address-container"
      >
        <div className="flex flex-col gap-y-1">
          <Heading
            level="h3"
            className="text-left text-dm-small font-semibold text-ink"
            data-testid="address-name"
          >
            {address.first_name} {address.last_name}
          </Heading>
          {address.company && (
            <Text className="text-dm-caption text-ink-muted" data-testid="address-company">
              {address.company}
            </Text>
          )}
          <Text className="flex flex-col text-left text-dm-small text-ink-muted">
            <span data-testid="address-address">
              {address.address_1}
              {address.address_2 && <span>, {address.address_2}</span>}
            </span>
            <span data-testid="address-postal-city">
              {address.postal_code}, {address.city}
            </span>
            <span data-testid="address-province-country">
              {address.province && `${address.province}, `}
              {address.country_code?.toUpperCase()}
            </span>
          </Text>
        </div>
        <div className="flex items-center gap-x-4 border-t border-line pt-3">
          <button
            type="button"
            className="dm-action-link"
            onClick={open}
            data-testid="address-edit-button"
          >
            <Edit />
            Chỉnh sửa
          </button>
          <button
            type="button"
            className="dm-action-link"
            onClick={removeAddress}
            disabled={removing}
            aria-busy={removing || undefined}
            data-testid="address-delete-button"
          >
            {removing ? <Spinner /> : <Trash />}
            Xoá
          </button>
        </div>
      </div>

      <Modal isOpen={state} close={close} data-testid="edit-address-modal">
        <Modal.Title>
          <Heading level="h2" className="mb-2 text-dm-title-sm">
            Sửa địa chỉ
          </Heading>
        </Modal.Title>
        <form action={formAction}>
          <input type="hidden" name="addressId" value={address.id} />
          <Modal.Body>
            <div className="flex w-full flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 xsmall:grid-cols-2">
                <Input
                  label="Tên"
                  name="first_name"
                  autoComplete="given-name"
                  required
                  defaultValue={address.first_name || undefined}
                  data-testid="first-name-input"
                />
                <Input
                  label="Họ"
                  name="last_name"
                  autoComplete="family-name"
                  required
                  defaultValue={address.last_name || undefined}
                  data-testid="last-name-input"
                />
                <Input
                  label="Công ty (không bắt buộc)"
                  name="company"
                  autoComplete="organization"
                  defaultValue={address.company || undefined}
                  data-testid="company-input"
                />
                <div className="xsmall:col-span-2">
                  <Input
                    label="Địa chỉ"
                    name="address_1"
                    autoComplete="address-line1"
                    required
                    defaultValue={address.address_1 || undefined}
                    data-testid="address-1-input"
                  />
                </div>
                <div className="xsmall:col-span-2">
                  <Input
                    label="Căn hộ, số tầng (không bắt buộc)"
                    name="address_2"
                    autoComplete="address-line2"
                    defaultValue={address.address_2 || undefined}
                    data-testid="address-2-input"
                  />
                </div>
                <Input
                  label="Mã bưu chính"
                  name="postal_code"
                  autoComplete="postal-code"
                  required
                  defaultValue={address.postal_code || undefined}
                  data-testid="postal-code-input"
                />
                <Input
                  label="Tỉnh / Thành phố"
                  name="city"
                  autoComplete="address-level2"
                  required
                  defaultValue={address.city || undefined}
                  data-testid="city-input"
                />
                <Input
                  label="Quận / Huyện"
                  name="province"
                  autoComplete="address-level1"
                  defaultValue={address.province || undefined}
                  data-testid="state-input"
                />
                <CountrySelect
                  name="country_code"
                  region={region}
                  required
                  autoComplete="country"
                  defaultValue={address.country_code || undefined}
                  data-testid="country-select"
                />
                <div className="xsmall:col-span-2">
                  <Input
                    label="Số điện thoại"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    defaultValue={address.phone || undefined}
                    data-testid="phone-input"
                  />
                </div>
              </div>
              {formState.error && <Alert tone="error">{formState.error}</Alert>}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="mt-6 flex gap-3">
              <Button type="reset" variant="secondary" onClick={close} data-testid="cancel-button">
                Huỷ
              </Button>
              <SubmitButton data-testid="save-button">Lưu địa chỉ</SubmitButton>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  )
}

export default EditAddress
