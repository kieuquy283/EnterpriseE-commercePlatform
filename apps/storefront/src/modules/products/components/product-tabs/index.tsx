"use client"

import { productOptionLabel } from "@lib/util/product-option-label"
import { HttpTypes } from "@medusajs/types"
import Accordion from "./accordion"
import { clx } from "@modules/common/components/ui"

import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

type TabDefinition = {
  label: string
  content: React.ReactNode
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs: TabDefinition[] = [
    {
      label: "Chi tiết và phom dáng",
      content: <ProductInfoTab product={product} />,
    },
    {
      label: "Chọn cỡ",
      content: <SizingTab product={product} />,
    },
    {
      label: "Giao hàng và đổi trả",
      content: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <h2 className="dm-eyebrow mb-2">Thông tin sản phẩm</h2>
      <Accordion type="multiple" defaultValue={["Chi tiết và phom dáng"]}>
        {tabs.map((tab) => (
          <Accordion.Item key={tab.label} title={tab.label} headingSize="medium" value={tab.label}>
            {tab.content}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-2.5 last:border-b-0">
      <dt className="text-dm-caption uppercase text-ink-faint">{label}</dt>
      <dd className="text-right text-dm-small text-ink">
        {value && value.trim().length ? value : "Chưa cập nhật"}
      </dd>
    </div>
  )
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  return (
    <div className="py-5">
      <dl className="max-w-xl">
        <DetailRow label="Chất liệu" value={product.material ?? undefined} />
        <DetailRow label="Xuất xứ" value={product.origin_country ?? undefined} />
        <DetailRow
          label="Danh mục"
          value={
            product.categories
              ?.map((category) => category.name)
              .filter(Boolean)
              .join(", ") || undefined
          }
        />
        <DetailRow label="Khối lượng" value={product.weight ? `${product.weight} g` : undefined} />
        <DetailRow label="Mã mẫu" value={product.handle ?? undefined} />
      </dl>
      <p className="dm-hint mt-4 max-w-xl">Số đo chi tiết của mẫu này đang được cập nhật.</p>
    </div>
  )
}

/**
 * Size information is derived from the variants the product actually sells, so
 * the list can never advertise a size that does not exist in the warehouse.
 */
const SizingTab = ({ product }: ProductTabsProps) => {
  const sizeOption = product.options?.find((option) => /size|kích/i.test(option.title ?? ""))
  const colorOption = product.options?.find((option) => /colou?r|màu/i.test(option.title ?? ""))

  const sizeValues = (sizeOption?.values ?? [])
    .map((value) => value.value)
    .filter((value): value is string => Boolean(value))
  const colorValues = (colorOption?.values ?? [])
    .map((value) => value.value)
    .filter((value): value is string => Boolean(value))

  return (
    <div className="flex flex-col gap-6 py-5">
      {sizeValues.length > 0 ? (
        <div>
          <p className="dm-eyebrow">Các cỡ có sẵn</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {sizeValues.map((size) => (
              <li key={productOptionLabel(size)} className="dm-chip">
                {productOptionLabel(size)}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="dm-small text-ink-muted">Mẫu này chỉ có một cỡ.</p>
      )}

      {colorValues.length > 0 && (
        <div>
          <p className="dm-eyebrow">Các màu có sẵn</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {colorValues.map((colour) => (
              <li key={productOptionLabel(colour)} className="dm-chip">
                {productOptionLabel(colour)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="dm-eyebrow">Hướng dẫn chọn cỡ</p>
        <p className="dm-small mt-3 max-w-xl text-ink-muted">
          Chọn trong các cỡ được liệt kê. Số đo chi tiết đang được cập nhật; không quy đổi nhãn cỡ
          thành số đo cơ thể.
        </p>
      </div>
    </div>
  )
}

const ShippingInfoTab = () => {
  const items = [
    {
      icon: <FastDelivery aria-hidden="true" />,
      title: "Giao tiêu chuẩn",
      body: "Chọn phương thức giao hàng theo địa chỉ khi thanh toán. Cửa hàng sẽ xác nhận thời gian giao.",
    },
    {
      icon: <Refresh aria-hidden="true" />,
      title: "Thanh toán khi nhận hàng",
      body: "Cửa hàng nhận thanh toán khi giao hàng. Chưa hỗ trợ thanh toán thẻ và chưa thu tiền khi bạn đặt đơn.",
    },
  ]

  return (
    <div className="flex flex-col gap-5 py-5">
      {items.map((item) => (
        <div key={item.title} className="flex items-start gap-3">
          <span className="mt-0.5 text-ink-muted">{item.icon}</span>
          <div>
            <p className="text-dm-small font-semibold text-ink">{item.title}</p>
            <p className="dm-small mt-1 max-w-xl text-ink-muted">{item.body}</p>
          </div>
        </div>
      ))}
      <div className={clx("dm-alert-info")}>
        <p className="font-semibold">Đổi trả</p>
        <p className="mt-1">
          Liên hệ cửa hàng trước khi gửi trả. Sản phẩm sẽ được kiểm tra trước khi nhập lại kho hoặc
          xử lý hoàn tiền.
        </p>
      </div>
    </div>
  )
}

export default ProductTabs
