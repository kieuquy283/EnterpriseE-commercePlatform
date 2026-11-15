import Image from "next/image"
import { Suspense } from "react"

import { vi } from "@lib/copy/vi"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import ArrowBadge from "@modules/common/components/arrow-badge"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ApproachMotion, CollectionMotion } from "@modules/home/components/editorial-motion"
import Hero from "@modules/home/components/hero"
import PopularProducts from "@modules/home/components/popular-products"
import ForYou from "@modules/home/components/for-you"

/** Collection artwork keyed by handle; the catalog seed uses `dm-*` handles. */
const collectionArt: Record<string, string> = {
  "dm-daily-essentials": "/collection-art/daily-essentials.jpg",
  "dm-workday": "/collection-art/workday.jpg",
  "dm-off-hours": "/editorial/clothing-denim.jpg",
}

const fallbackArt = [
  "/editorial/clothing-shirts.jpg",
  "/editorial/clothing-layers.jpg",
  "/editorial/clothing-denim.jpg",
]

function collectionCopy(
  collection: HttpTypes.StoreCollection,
  index: number,
): { art: string; note: string } {
  const handle = collection.handle ?? ""
  const notes = vi.home.notes as Record<string, string>
  return {
    art: collectionArt[handle] ?? fallbackArt[index % fallbackArt.length],
    note: notes[handle] ?? vi.home.notes.fallback,
  }
}

function SkeletonRail({ label }: { label: string }) {
  return (
    <div className="content-container dm-section" role="status" aria-live="polite">
      <div className="dm-skeleton h-4 w-40" />
      <span className="sr-only">{label}</span>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 small:grid-cols-3 medium:grid-cols-4 small:gap-x-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index}>
            <div className="dm-skeleton aspect-[4/5] w-full rounded-dm-md" />
            <div className="dm-skeleton mt-4 h-3 w-3/4" />
            <div className="dm-skeleton mt-2 h-3 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function Home(props: { params: Promise<{ countryCode: string }> }) {
  const params = await props.params
  const { countryCode } = params

  const [region, collectionResult] = await Promise.all([
    getRegion(countryCode),
    listCollections({ fields: "id, handle, title" }).catch(() => ({
      collections: [] as HttpTypes.StoreCollection[],
      count: 0,
    })),
  ])

  const collections = (collectionResult.collections ?? []).slice(0, 3)

  return (
    <>
      <Hero />

      <ApproachMotion>
        <section aria-labelledby="approach-heading" className="content-container py-16 small:py-28">
          <div className="grid gap-8 small:grid-cols-2 small:gap-20">
            <h2 id="approach-heading" className="dm-display max-w-[15ch]" data-approach-title>
              {vi.home.approach.heading}
            </h2>
            <div className="small:pt-2" data-approach-copy>
              <p className="dm-lead max-w-dm-prose">{vi.home.approach.body}</p>
              <LocalizedClientLink
                href="/store"
                className="dm-link mt-8 inline-block text-dm-small"
              >
                Tìm món đồ của bạn
              </LocalizedClientLink>
            </div>
          </div>
        </section>
      </ApproachMotion>

      {region ? (
        <>
          <CollectionMotion>
            <section aria-labelledby="collections-heading" className="border-t border-line">
              <div className="content-container flex flex-wrap items-end justify-between gap-6 py-8 small:py-12">
                <h2 id="collections-heading" className="dm-title">
                  {vi.home.collections.heading}
                </h2>
                <LocalizedClientLink href="/store" className="dm-link text-dm-small">
                  {vi.common.shopEverything}
                </LocalizedClientLink>
              </div>
              {collections.length ? (
                <ul className="grid small:grid-cols-3">
                  {collections.map((collection, index) => {
                    const copy = collectionCopy(collection, index)
                    return (
                      <li key={collection.id} className="min-w-0" data-collection-story>
                        <LocalizedClientLink
                          href={`/collections/${collection.handle}`}
                          className="group block"
                        >
                          <div
                            className="relative aspect-[4/5] overflow-hidden bg-surface"
                            data-collection-image
                          >
                            <Image
                              src={copy.art}
                              alt=""
                              fill
                              unoptimized
                              sizes="(max-width: 1024px) 100vw, 34vw"
                              className="dm-cover"
                            />
                          </div>
                          <div className="border-b border-line px-5 py-7 small:px-8 small:py-10">
                            <div className="flex items-baseline justify-between gap-4">
                              <h3 className="dm-heading">{collection.title}</h3>
                              <ArrowBadge />
                            </div>
                            <p className="dm-body mt-3 max-w-sm">{copy.note}</p>
                          </div>
                        </LocalizedClientLink>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="content-container py-12 dm-body">{vi.home.collections.emptyBody}</p>
              )}
            </section>
          </CollectionMotion>
          <Suspense fallback={<SkeletonRail label={vi.common.loadingSuggestions} />}>
            <ForYou region={region} />
          </Suspense>

          <Suspense fallback={<SkeletonRail label={vi.common.loadingProducts} />}>
            <PopularProducts region={region} />
          </Suspense>
        </>
      ) : (
        <section className="content-container pb-16" role="alert">
          <div className="dm-alert-warning">
            <p className="font-semibold">{vi.store.regionErrorTitle}</p>
            <p className="mt-1">{vi.store.regionErrorBody}</p>
          </div>
        </section>
      )}

      <>
        {/* Closing editorial band. */}
        <section
          aria-labelledby="closing-heading"
          className="bg-accent-soft border-y border-accent/20"
        >
          <div className="content-container grid grid-cols-1 gap-10 py-16 small:grid-cols-12 small:items-end small:py-24">
            <div className="small:col-span-8">
              <h2 id="closing-heading" className="dm-display max-w-3xl text-balance">
                {vi.home.closing.headingLine1}
                <br />
                {vi.home.closing.headingLine2}
              </h2>
              <p className="dm-lead mt-6 max-w-dm-prose">{vi.home.closing.body}</p>
            </div>
            <div className="small:col-span-4 small:text-right">
              <LocalizedClientLink href="/store" className="dm-btn-primary">
                <span>{vi.home.closing.cta}</span>
                <ArrowBadge />
              </LocalizedClientLink>
            </div>
          </div>
        </section>
      </>
    </>
  )
}
