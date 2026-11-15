import { HttpTypes } from "@medusajs/types"

import ProductImage from "../product-image"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  title?: string
}

/**
 * Portrait-led gallery: the first image is the anchor, the rest stack in a
 * single column on mobile and pair up on wide screens. When a product has no
 * media the gallery renders one honest empty frame instead of collapsing.
 */
const ImageGallery = ({ images, title }: ImageGalleryProps) => {
  if (!images.length) {
    return (
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-none border-0">
        <ProductImage
          src={null}
          alt={title ?? "Sản phẩm"}
          sizes="(max-width: 1024px) 100vw, 55vw"
          placeholderSize={40}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-3">
      {images.map((image, index) => (
        <figure
          key={image.id}
          className="relative aspect-[3/4] w-full overflow-hidden rounded-none border-0 bg-surface"
          id={image.id}
        >
          <ProductImage
            src={image.url}
            priority={index === 0}
            alt={
              title
                ? `${title} — ảnh ${index + 1} trên ${images.length}`
                : `Ảnh sản phẩm ${index + 1}`
            }
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
        </figure>
      ))}
    </div>
  )
}

export default ImageGallery
