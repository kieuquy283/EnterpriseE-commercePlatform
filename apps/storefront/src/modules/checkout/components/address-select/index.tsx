import { Listbox, Transition } from "@headlessui/react"
import { ChevronUpDown } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import { Fragment, useMemo } from "react"

import compareAddresses from "@lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import OptionMark from "../option-mark"

type AddressSelectProps = {
  addresses: HttpTypes.StoreCustomerAddress[]
  addressInput: HttpTypes.StoreCartAddress | null
  onSelect: (address: HttpTypes.StoreCartAddress | undefined, email?: string) => void
}

const AddressSelect = ({ addresses, addressInput, onSelect }: AddressSelectProps) => {
  const handleSelect = (id: string) => {
    const savedAddress = addresses.find((a) => a.id === id)
    if (savedAddress) {
      onSelect(savedAddress as HttpTypes.StoreCartAddress)
    }
  }

  const selectedAddress = useMemo(() => {
    return addresses.find((a) => addressInput && compareAddresses(a, addressInput))
  }, [addresses, addressInput])

  return (
    <Listbox onChange={handleSelect} value={selectedAddress?.id}>
      <div className="relative">
        <Listbox.Button
          className="dm-field relative flex items-center justify-between gap-3 text-left"
          data-testid="shipping-address-select"
        >
          {({ open }) => (
            <>
              <span className="block truncate">
                {selectedAddress ? selectedAddress.address_1 : "Chọn địa chỉ đã lưu"}
              </span>
              <ChevronUpDown
                className={clx("shrink-0 text-ink-faint transition-transform duration-200", {
                  "rotate-180": open,
                })}
              />
            </>
          )}
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options
            className="absolute z-20 max-h-60 w-full overflow-auto rounded-dm-sm border border-line bg-canvas py-1 text-dm-small shadow-dm-card focus:outline-none"
            data-testid="shipping-address-options"
          >
            {addresses.map((address) => {
              return (
                <Listbox.Option
                  key={address.id}
                  value={address.id}
                  className="relative cursor-pointer select-none px-3 py-3 transition-colors duration-150 hover:bg-surface"
                  data-testid="shipping-address-option"
                >
                  <div className="flex items-start gap-x-3">
                    <OptionMark
                      selected={selectedAddress?.id === address.id}
                      data-testid="shipping-address-radio"
                    />
                    <div className="flex min-w-0 flex-col gap-y-1">
                      <span className="text-dm-small font-semibold text-ink">
                        {address.first_name} {address.last_name}
                      </span>
                      {address.company && (
                        <span className="text-dm-caption text-ink-muted">{address.company}</span>
                      )}
                      <div className="flex flex-col text-dm-caption text-ink-muted">
                        <span>
                          {address.address_1}
                          {address.address_2 && <span>, {address.address_2}</span>}
                        </span>
                        <span>
                          {address.postal_code}, {address.city}
                        </span>
                        <span>
                          {address.province && `${address.province}, `}
                          {address.country_code?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Listbox.Option>
              )
            })}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  )
}

export default AddressSelect
