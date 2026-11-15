"use client"
import { setAddresses } from "@lib/data/cart"
import useToggleState from "@lib/hooks/use-toggle-state"
import compareAddresses from "@lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"
import Spinner from "@modules/common/icons/spinner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState } from "react"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import CheckoutSection from "../section"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "address"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true,
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [message, formAction] = useActionState(setAddresses, null)

  const isComplete = Boolean(cart?.shipping_address && cart?.billing_address && cart?.email)

  return (
    <CheckoutSection
      index={0}
      id="checkout-address"
      title="Thông tin và địa chỉ"
      isOpen={isOpen}
      isComplete={isComplete}
      onEdit={handleEdit}
      editTestId="edit-address-button"
    >
      {isOpen ? (
        <form action={formAction} className="flex flex-col gap-y-8">
          <ShippingAddress
            customer={customer}
            checked={sameAsBilling}
            onChange={toggleSameAsBilling}
            cart={cart}
          />

          {!sameAsBilling && (
            <div className="flex flex-col gap-y-4 border-t border-line pt-8">
              <div className="flex flex-col gap-y-1">
                <h3 className="dm-heading">Địa chỉ xuất hoá đơn</h3>
                <p className="dm-caption">Địa chỉ này sẽ xuất hiện trên hoá đơn.</p>
              </div>

              <BillingAddress cart={cart} />
            </div>
          )}

          <div className="flex flex-col gap-y-3 border-t border-line pt-8">
            <SubmitButton
              size="large"
              className="w-full small:w-auto"
              data-testid="submit-address-button"
            >
              Tiếp tục đến giao hàng
            </SubmitButton>
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        <div>
          {cart && cart.shipping_address ? (
            <dl className="grid grid-cols-1 gap-6 small:grid-cols-3">
              <div className="flex flex-col gap-y-1" data-testid="shipping-address-summary">
                <dt className="dm-eyebrow">Địa chỉ nhận hàng</dt>
                <dd className="flex flex-col text-dm-small text-ink-muted">
                  <span>
                    {cart.shipping_address.first_name} {cart.shipping_address.last_name}
                  </span>
                  <span>
                    {cart.shipping_address.address_1} {cart.shipping_address.address_2}
                  </span>
                  <span>
                    {cart.shipping_address.postal_code}, {cart.shipping_address.city}
                  </span>
                  <span>{cart.shipping_address.country_code?.toUpperCase()}</span>
                </dd>
              </div>

              <div className="flex flex-col gap-y-1" data-testid="shipping-contact-summary">
                <dt className="dm-eyebrow">Thông tin liên hệ</dt>
                <dd className="flex flex-col text-dm-small text-ink-muted">
                  <span>{cart.shipping_address.phone}</span>
                  <span className="break-words">{cart.email}</span>
                </dd>
              </div>

              <div className="flex flex-col gap-y-1" data-testid="billing-address-summary">
                <dt className="dm-eyebrow">Địa chỉ xuất hoá đơn</dt>
                {sameAsBilling ? (
                  <dd className="text-dm-small text-ink-muted">
                    Địa chỉ xuất hoá đơn giống địa chỉ nhận hàng.
                  </dd>
                ) : (
                  <dd className="flex flex-col text-dm-small text-ink-muted">
                    <span>
                      {cart.billing_address?.first_name} {cart.billing_address?.last_name}
                    </span>
                    <span>
                      {cart.billing_address?.address_1} {cart.billing_address?.address_2}
                    </span>
                    <span>
                      {cart.billing_address?.postal_code}, {cart.billing_address?.city}
                    </span>
                    <span>{cart.billing_address?.country_code?.toUpperCase()}</span>
                  </dd>
                )}
              </div>
            </dl>
          ) : (
            <Text className="flex items-center gap-x-3 text-dm-small text-ink-faint">
              <Spinner size="16" />
              Đang tải thông tin đã lưu của bạn.
            </Text>
          )}
        </div>
      )}
    </CheckoutSection>
  )
}

export default Addresses
