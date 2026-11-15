import { Heading, Text } from "@modules/common/components/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

const EmptyCartMessage = () => {
  return (
    <div
      className="flex max-w-3xl flex-col items-start gap-y-6 py-16 small:py-24"
      data-testid="empty-cart-message"
    >
      <p className="dm-eyebrow">Giỏ hàng của bạn</p>
      <Heading level="h1" className="dm-display">
        Giỏ hàng đang trống
      </Heading>
      <Text className="dm-lead">
        Những món bạn chọn sẽ được lưu tại đây. Khám phá bộ sưu tập và tìm món đồ cho ngày thường
        của bạn.
      </Text>
      <LocalizedClientLink href="/store" className="dm-btn dm-btn-primary">
        Khám phá bộ sưu tập
      </LocalizedClientLink>
      <Text className="dm-caption">
        Bạn đã đặt hàng?{" "}
        <LocalizedClientLink href="/account/orders" className="dm-link">
          Xem đơn hàng
        </LocalizedClientLink>
      </Text>
    </div>
  )
}

export default EmptyCartMessage
