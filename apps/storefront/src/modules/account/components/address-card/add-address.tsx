"use client"

import { Plus } from "@medusajs/icons"
import { Alert, Button, Heading, Input } from "@modules/common/components/ui"
import { useCallback, useActionState, useEffect, useState } from "react"

import { addCustomerAddress } from "@lib/data/customer"
import useToggleState from "@lib/hooks/use-toggle-state"
import { HttpTypes } from "@medusajs/types"
import CountrySelect from "@modules/checkout/components/country-select"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Modal from "@modules/common/components/modal"

const AddAddress = ({
  region,
}: {
  region: HttpTypes.StoreRegion
  addresses: HttpTypes.StoreCustomerAddress[]
}) => {
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)

  const [formState, formAction] = useActionState(addCustomerAddress, {
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

  return (
    <>
      <button
        type="button"
        className="dm-btn-secondary w-full justify-between text-left"
        onClick={open}
        data-testid="add-address-button"
      >
        <span className="flex flex-col gap-y-1">
          <span className="text-dm-small font-semibold text-ink">Địa chỉ mới</span>
          <span className="dm-caption">Lưu địa chỉ để dùng nhanh khi thanh toán.</span>
        </span>
        <Plus />
      </button>

      <Modal isOpen={state} close={close} data-testid="add-address-modal">
        <Modal.Title>
          <Heading level="h2" className="mb-2 text-dm-title-sm">
            Thêm địa chỉ
          </Heading>
        </Modal.Title>
        <form action={formAction}>
          <Modal.Body>
            <div className="flex w-full flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 xsmall:grid-cols-2">
                <Input
                  label="Tên"
                  name="first_name"
                  autoComplete="given-name"
                  required
                  data-testid="first-name-input"
                />
                <Input
                  label="Họ"
                  name="last_name"
                  autoComplete="family-name"
                  required
                  data-testid="last-name-input"
                />
                <Input
                  label="Công ty (không bắt buộc)"
                  name="company"
                  autoComplete="organization"
                  data-testid="company-input"
                />
                <div className="xsmall:col-span-2">
                  <Input
                    label="Địa chỉ"
                    name="address_1"
                    autoComplete="address-line1"
                    required
                    data-testid="address-1-input"
                  />
                </div>
                <div className="xsmall:col-span-2">
                  <Input
                    label="Phường / Xã"
                    name="address_2"
                    autoComplete="address-line2"
                    required
                    data-testid="address-2-input"
                  />
                </div>
                <Input
                  label="Mã bưu chính"
                  name="postal_code"
                  autoComplete="postal-code"
                  required
                  pattern="[0-9]{6}"
                  title="Nhập đúng 6 chữ số."
                  data-testid="postal-code-input"
                />
                <Input
                  label="Quận / Huyện"
                  name="city"
                  autoComplete="address-level2"
                  required
                  data-testid="city-input"
                />
                <Input
                  label="Tỉnh / Thành phố"
                  name="province"
                  autoComplete="address-level1"
                  required
                  data-testid="state-input"
                />
                <CountrySelect
                  region={region}
                  name="country_code"
                  required
                  autoComplete="country"
                  data-testid="country-select"
                />
                <div className="xsmall:col-span-2">
                  <Input
                    label="Số điện thoại"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    pattern="0[0-9]{9}"
                    data-testid="phone-input"
                  />
                </div>
              </div>
              {formState.error && (
                <div data-testid="address-error">
                  <Alert tone="error">{formState.error}</Alert>
                </div>
              )}
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

export default AddAddress
