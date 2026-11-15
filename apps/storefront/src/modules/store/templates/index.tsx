import { Suspense } from "react"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { listCategories } from "@lib/data/categories"
import { listProductsWithSort } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"
import Link from "next/link"

const PRODUCT_LIMIT = 12

function buildHref(
  countryCode: string,
  params: { q?: string; page?: number; sortBy?: SortOptions },
) {
  const search = new URLSearchParams()
  if (params.sortBy && params.sortBy !== "created_at") search.set("sortBy", params.sortBy)
  if (params.q) search.set("q", params.q)
  if (params.page && params.page > 1) search.set("page", String(params.page))
  const suffix = search.toString()
  return `/${countryCode}/store${suffix ? `?${suffix}` : ""}`
}

export default async function StoreTemplate({
  countryCode,
  region,
  query,
  page,
  sortBy,
}: {
  countryCode: string
  region: HttpTypes.StoreRegion
  query: string
  page: number
  sortBy: SortOptions
}) {
  let catalogFailed = false
  const [categoryList, productResult] = await Promise.all([
    listCategories({
      fields: "id,handle,name",
      parent_category_id: "null",
      limit: 8,
    }).catch(() => [] as HttpTypes.StoreProductCategory[]),
    listProductsWithSort({
      countryCode,
      sortBy,
      page,
      queryParams: {
        limit: PRODUCT_LIMIT,
        ...(query ? { q: query } : {}),
      },
    }).catch(() => {
      catalogFailed = true
      return {
        response: {
          products: [] as HttpTypes.StoreProduct[],
          count: 0,
        },
      }
    }),
  ])

  const {
    response: { products, count },
  } = productResult

  const categories = (categoryList ?? []).filter((category) => Boolean(category.handle))

  const totalPages = Math.max(1, Math.ceil(count / PRODUCT_LIMIT))

  return (
    <div className="content-container" data-testid="category-container">
      <header className="border-b border-line py-10 small:py-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h1 className="dm-display max-w-3xl" data-testid="store-page-title">
            {query ? "Kết quả tìm kiếm" : "Tủ đồ mỗi ngày"}
          </h1>
          <p className="max-w-sm text-dm-small text-ink-muted">
            Áo thun, sơ mi, quần và những lớp áo nhẹ cho mỗi ngày. Chọn một mẫu để xem cỡ, màu và
            tình trạng còn hàng.
          </p>
        </div>

        <form
          action={`/${countryCode}/store`}
          method="get"
          role="search"
          className="mt-8 flex max-w-xl gap-2"
        >
          <div className="flex-1">
            <label htmlFor="store-search" className="sr-only">
              Tìm sản phẩm
            </label>
            <input
              id="store-search"
              className="dm-field"
              defaultValue={query}
              maxLength={80}
              name="q"
              placeholder="Tìm áo sơ mi, quần, linen…"
              type="search"
              autoComplete="off"
            />
          </div>
          <input type="hidden" name="sortBy" value={sortBy} />
          <button className="dm-btn-primary" type="submit">
            Tìm kiếm
          </button>
        </form>
      </header>

      <div className="flex flex-col gap-8 py-8 small:py-12">
        <aside
          className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6"
          aria-label="Khám phá"
        >
          <Suspense fallback={null}>
            <RefinementList sortBy={sortBy} hideOptionsPicker />
          </Suspense>

          <ul className="flex flex-wrap gap-x-4 gap-y-1 small:flex-row small:gap-5">
            <li>
              <LocalizedClientLink
                href="/store"
                aria-current="page"
                className="block py-1.5 text-dm-small font-semibold text-ink"
              >
                Tất cả sản phẩm
              </LocalizedClientLink>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <LocalizedClientLink
                  href={`/categories/${category.handle}`}
                  className="block py-1.5 text-dm-small text-ink-muted transition-colors hover:text-ink"
                >
                  {category.name}
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        </aside>

        <div className="min-w-0 w-full">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4">
            <p className="text-dm-small text-ink-muted">
              {query ? (
                <>
                  <span className="font-semibold text-ink">{count}</span>{" "}
                  {count === 1 ? "kết quả" : "kết quả"} cho &ldquo;{query}&rdquo;
                </>
              ) : (
                <>
                  <span className="font-semibold text-ink">{count}</span>{" "}
                  {count === 1 ? "sản phẩm" : "sản phẩm"}
                </>
              )}
            </p>
            {query && (
              <Link
                href={`/${countryCode}/store`}
                className="text-dm-caption text-ink-faint underline decoration-line-strong underline-offset-4 hover:text-ink"
              >
                Xoá tìm kiếm
              </Link>
            )}
          </div>

          {catalogFailed ? (
            <div role="alert" className="dm-alert-error mt-8">
              <p className="font-semibold">Không tải được bộ sưu tập</p>
              <p className="mt-2">Vui lòng thử lại sau giây lát.</p>
              <a
                href={buildHref(countryCode, { q: query, page })}
                className="dm-link mt-3 inline-block"
              >
                Thử lại
              </a>
            </div>
          ) : products.length ? (
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
          ) : (
            <div className="mt-10 border-y border-line px-0 py-16">
              <p className="text-dm-title-sm font-medium text-ink">
                {query ? "Chưa tìm thấy sản phẩm phù hợp" : "Chưa có sản phẩm"}
              </p>
              <p className="mx-auto mt-2 max-w-md text-dm-small text-ink-muted">
                {query
                  ? "Thử từ khoá ngắn hơn như áo, linen hoặc quần, hoặc xem toàn bộ danh mục."
                  : "Bộ sưu tập đang được chuẩn bị. Mời bạn quay lại sau."}
              </p>
              <LocalizedClientLink href="/store" className="dm-btn-secondary mt-6 inline-flex">
                Xem tất cả sản phẩm
              </LocalizedClientLink>
            </div>
          )}

          {totalPages > 1 && (
            <nav
              aria-label="Phân trang"
              className="mt-12 flex items-center justify-between border-t border-line pt-6"
            >
              {page > 1 ? (
                <Link
                  href={buildHref(countryCode, {
                    q: query,
                    sortBy,
                    page: page - 1,
                  })}
                  rel="prev"
                  className="dm-btn-secondary dm-btn-sm"
                >
                  Trước
                </Link>
              ) : (
                <span aria-hidden="true" />
              )}
              <span className="text-dm-caption text-ink-muted">
                Trang {page} trên {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={buildHref(countryCode, {
                    q: query,
                    sortBy,
                    page: page + 1,
                  })}
                  rel="next"
                  className="dm-btn-secondary dm-btn-sm"
                >
                  Tiếp
                </Link>
              ) : (
                <span aria-hidden="true" />
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  )
}
