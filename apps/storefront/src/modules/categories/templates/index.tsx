import { notFound } from "next/navigation"
import { Suspense } from "react"

import { OptionValueIds } from "@lib/util/product-option-filters"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"

export default function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
  optionValueIds,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  const parents = [] as HttpTypes.StoreProductCategory[]

  const getParents = (node: HttpTypes.StoreProductCategory) => {
    if (node.parent_category) {
      parents.push(node.parent_category)
      getParents(node.parent_category)
    }
  }

  getParents(category)

  return (
    <div className="content-container" data-testid="category-container">
      <header className="border-b border-line py-10 small:py-14">
        <nav aria-label="Đường dẫn điều hướng">
          <ol className="flex flex-wrap items-center gap-2 text-dm-caption text-ink-faint">
            <li>
              <LocalizedClientLink href="/store" className="hover:text-ink">
                Cửa hàng
              </LocalizedClientLink>
            </li>
            {parents.map((parent) => (
              <li key={parent.id} className="flex items-center gap-2">
                <span aria-hidden="true">/</span>
                <LocalizedClientLink
                  href={`/categories/${parent.handle}`}
                  className="hover:text-ink"
                  data-testid="sort-by-link"
                >
                  {parent.name}
                </LocalizedClientLink>
              </li>
            ))}
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink-muted">
              {category.name}
            </li>
          </ol>
        </nav>

        <h1 className="dm-display mt-5 max-w-2xl" data-testid="category-page-title">
          {category.name}
        </h1>

        {category.description && (
          <p className="dm-lead mt-4 max-w-dm-prose">{category.description}</p>
        )}
      </header>

      <div className="flex flex-col gap-8 py-8 small:py-12">
        <aside className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6">
          {category.category_children && category.category_children.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-1">
              {category.category_children.map((child) => (
                <li key={child.id}>
                  <LocalizedClientLink
                    href={`/categories/${child.handle}`}
                    className="block py-1.5 text-dm-small text-ink-muted transition-colors hover:text-ink"
                  >
                    {child.name}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="small:ml-auto">
            <RefinementList sortBy={sort} data-testid="sort-by-container" hideOptionsPicker />
          </div>
        </aside>

        <div className="min-w-0 w-full">
          <Suspense
            fallback={<SkeletonProductGrid numberOfProducts={category.products?.length ?? 8} />}
          >
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              categoryId={category.id}
              countryCode={countryCode}
              optionValueIds={optionValueIds}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
