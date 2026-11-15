import { HttpTypes } from "@medusajs/types"
import { Table, Text } from "@modules/common/components/ui"

import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import ProductImage from "@modules/products/components/product-image"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
}

const Item = ({ item, currencyCode }: ItemProps) => {
  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 px-0 py-5">
        <div className="dm-media-portrait w-16 overflow-hidden rounded-dm-xs bg-surface small:w-20">
          <ProductImage src={item.thumbnail} alt="" sizes="80px" placeholderSize={14} />
        </div>
      </Table.Cell>

      <Table.Cell className="px-3 py-5 text-left">
        <Text
          as="span"
          className="block break-words text-dm-body font-medium leading-snug text-ink"
          data-testid="product-name"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      <Table.Cell className="!pr-0 px-0 py-5">
        <span className="flex flex-col items-end gap-y-1">
          <span className="flex items-baseline gap-x-1.5 text-dm-caption text-ink-faint">
            <span className="tabular-nums" data-testid="product-quantity">
              {item.quantity}
            </span>
            <span aria-hidden="true">×</span>
            <LineItemUnitPrice item={item} style="tight" currencyCode={currencyCode} />
          </span>

          <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
