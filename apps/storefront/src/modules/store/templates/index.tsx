import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"
import Link from "next/link"

const PRODUCT_LIMIT = 12

export default async function StoreTemplate({
  countryCode,
  region,
  query,
  page,
}: {
  countryCode: string
  region: HttpTypes.StoreRegion
  query: string
  page: number
}) {
  const {
    response: { products, count },
  } = await listProducts({
    countryCode,
    pageParam: page,
    queryParams: {
      limit: PRODUCT_LIMIT,
      ...(query ? { q: query } : {}),
    },
  })

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)
  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (nextPage > 1) params.set("page", String(nextPage))
    const suffix = params.toString()
    return `/${countryCode}/store${suffix ? `?${suffix}` : ""}`
  }

  return (
    <div className="py-6 content-container" data-testid="category-container">
      <h1 className="mb-6 text-2xl-semi" data-testid="store-page-title">
        Products
      </h1>
      <form action={`/${countryCode}/store`} method="get" className="mb-8 flex max-w-xl gap-2">
        <input
          aria-label="Search products"
          className="w-full rounded border border-ui-border-base px-3 py-2"
          defaultValue={query}
          maxLength={80}
          name="q"
          placeholder="Search products"
          type="search"
        />
        <button className="rounded bg-ui-button-inverted px-4 py-2 text-ui-fg-on-color" type="submit">
          Search
        </button>
      </form>
      {query && <p className="mb-6">{count} results for &quot;{query}&quot;</p>}
      {products.length ? (
        <ul className="grid grid-cols-2 gap-x-6 gap-y-8 small:grid-cols-3 medium:grid-cols-4" data-testid="products-list">
          {products.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} />
            </li>
          ))}
        </ul>
      ) : (
        <p>No products found.</p>
      )}
      {totalPages > 1 && (
        <nav aria-label="Product pages" className="mt-8 flex items-center justify-center gap-6">
          {page > 1 && <Link href={pageHref(page - 1)}>Previous</Link>}
          <span>Page {page} of {totalPages}</span>
          {page < totalPages && <Link href={pageHref(page + 1)}>Next</Link>}
        </nav>
      )}
    </div>
  )
}
