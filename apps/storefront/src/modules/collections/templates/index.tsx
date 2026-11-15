import Image from "next/image"
import { Suspense } from "react"

import { OptionValueIds } from "@lib/util/product-option-filters"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"

const collectionArt: Record<string, string> = {
  "dm-daily-essentials": "/collection-art/daily-essentials.jpg",
  "dm-workday": "/collection-art/workday.jpg",
  "dm-off-hours": "/editorial/clothing-denim.jpg",
}

const collectionNotes: Record<string, string> = {
  "dm-daily-essentials": "Những món đồ cơ bản, dễ phối và luôn có chỗ trong tủ đồ thường ngày.",
  "dm-workday": "Chỉn chu vừa đủ cho giờ làm việc, thoải mái cho cả ngày dài.",
  "dm-off-hours":
    "Phom dáng rộng rãi cho buổi tối, cuối tuần và những khoảng thời gian của riêng bạn.",
}

export default function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
  optionValueIds,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const handle = collection.handle ?? ""
  const art = collectionArt[handle]
  const note = collectionNotes[handle]

  return (
    <div>
      <header className="border-b border-line">
        <div className="grid grid-cols-1 small:grid-cols-2">
          <div className="flex flex-col justify-center px-[var(--dm-gutter)] py-12 small:py-20">
            <nav aria-label="Đường dẫn điều hướng">
              <ol className="flex items-center gap-2 text-dm-caption text-ink-faint">
                <li>
                  <LocalizedClientLink href="/store" className="hover:text-ink">
                    Cửa hàng
                  </LocalizedClientLink>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-ink-muted">
                  {collection.title}
                </li>
              </ol>
            </nav>
            <h1 className="dm-display-lg mt-8">{collection.title}</h1>
            {note && <p className="dm-lead mt-4 max-w-dm-prose">{note}</p>}
            {collection.metadata?.description ? (
              <p className="dm-body mt-3 max-w-dm-prose">
                {String(collection.metadata.description)}
              </p>
            ) : null}
          </div>
          {art && (
            <div className="min-w-0">
              <div className="relative aspect-[4/3] small:aspect-[5/4] overflow-hidden">
                <Image
                  src={art}
                  alt={`${collection.title} bộ sưu tập`}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="dm-cover"
                />
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="content-container flex flex-col gap-8 py-8 small:py-12">
        <aside className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6">
          <RefinementList sortBy={sort} hideOptionsPicker />
        </aside>
        <div className="min-w-0 w-full">
          <Suspense
            fallback={<SkeletonProductGrid numberOfProducts={collection.products?.length ?? 8} />}
          >
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              collectionId={collection.id}
              countryCode={countryCode}
              optionValueIds={optionValueIds}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
