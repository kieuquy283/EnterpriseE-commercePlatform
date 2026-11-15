import React, { Suspense } from "react"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ConsentAwareProductView from "@modules/products/components/consent-aware-product-view"
import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <Suspense fallback={null}>
        <ConsentAwareProductView productId={product.id} />
      </Suspense>

      <div className="content-container" data-testid="product-container">
        <nav aria-label="Đường dẫn điều hướng" className="pt-6">
          <ol className="flex flex-wrap items-center gap-2 text-dm-caption text-ink-faint">
            <li>
              <a href={`/${countryCode}/store`} className="hover:text-ink">
                Cửa hàng
              </a>
            </li>
            {product.collection?.handle && (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <a
                    href={`/${countryCode}/collections/${product.collection.handle}`}
                    className="hover:text-ink"
                  >
                    {product.collection.title}
                  </a>
                </li>
              </>
            )}
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="truncate text-ink-muted">
              {product.title}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 gap-8 py-8 small:grid-cols-12 small:gap-16 small:py-10">
          {/* Media */}
          <div className="small:col-span-7">
            <ImageGallery images={images} title={product.title ?? undefined} />
          </div>

          {/* Purchase column */}
          <div className="small:col-span-5 small:py-8">
            <div className="flex flex-col gap-y-8 small:sticky small:top-28">
              <ProductInfo product={product} />

              <div className="border-t border-line pt-6">
                <ProductOnboardingCta />
                <Suspense
                  fallback={<ProductActions disabled={true} product={product} region={region} />}
                >
                  <ProductActionsWrapper id={product.id} region={region} />
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        {/* Detail accordions spanning the full width below the buy area. */}
        <div className="small:ml-auto small:w-5/12 border-t border-line py-8">
          <ProductTabs product={product} />
        </div>
      </div>

      <div className="border-t border-line" data-testid="related-products-container">
        <div className="content-container dm-section">
          <Suspense fallback={<SkeletonRelatedProducts />}>
            <RelatedProducts product={product} countryCode={countryCode} />
          </Suspense>
        </div>
      </div>
    </>
  )
}

export default ProductTemplate
