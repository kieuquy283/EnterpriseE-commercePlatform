import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { OptionValueIds } from "@lib/util/product-option-filters"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  optionValueIds,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  optionValueIds?: OptionValueIds
}) {
  const queryParams: PaginatedProductsParams = {
    limit: PRODUCT_LIMIT,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return (
      <div className="dm-alert-warning" role="alert">
        <p className="font-semibold">Khu vực bán chưa khả dụng</p>
        <p className="mt-1">Không tải được giá và tình trạng hàng cho khu vực này.</p>
      </div>
    )
  }

  let products: Awaited<ReturnType<typeof listProductsWithSort>>["response"]["products"] = []
  let count = 0
  let failed = false

  try {
    const result = await listProductsWithSort({
      page,
      queryParams,
      sortBy,
      countryCode,
      optionValueIds,
    })
    products = result.response.products
    count = result.response.count
  } catch {
    failed = true
  }

  if (failed) {
    return (
      <div className="dm-alert-error" role="alert">
        <p className="font-semibold">Không tải được danh mục</p>
        <p className="mt-1">Kết nối có thể đang gián đoạn. Tải lại trang để thử lại.</p>
      </div>
    )
  }

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  if (!products.length) {
    return (
      <div className="border-y border-line py-16">
        <p className="text-dm-title-sm font-medium text-ink">Chưa có sản phẩm trong mục này</p>
        <p className="mt-2 max-w-md text-dm-small text-ink-muted">
          Mục này đang được chuẩn bị. Bạn có thể xem các sản phẩm khác trong cửa hàng.
        </p>
        <LocalizedClientLink href="/store" className="dm-btn-secondary mt-6 inline-flex">
          Xem tất cả sản phẩm
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-baseline justify-between border-b border-line pb-4">
        <p className="text-dm-small text-ink-muted">
          <span className="font-semibold text-ink">{count}</span>{" "}
          {count === 1 ? "sản phẩm" : "sản phẩm"}
        </p>
      </div>
      <ul
        className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 small:grid-cols-4 small:gap-x-6"
        data-testid="products-list"
      >
        {products.map((product) => (
          <li key={product.id}>
            <ProductPreview product={product} region={region} />
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <Pagination data-testid="product-pagination" page={page} totalPages={totalPages} />
      )}
    </>
  )
}
