import { Container, clx } from "@modules/common/components/ui"
import React from "react"

import ProductImage from "../product-image"

type ThumbnailProps = {
  thumbnail?: string | null
  images?: { url?: string }[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  /**
   * Marketing surface name used by the missing-image state so the customer is
   * told plainly that a photograph is not available rather than shown a
   * different garment.
   */
  label?: string
  "data-testid"?: string
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  className,
  label,
  "data-testid": dataTestid,
}) => {
  const initialImage = thumbnail || images?.[0]?.url

  return (
    <Container
      className={clx(
        "relative w-full overflow-hidden rounded-none border-0 bg-surface p-0 ",
        className,
        {
          "aspect-[3/4]": isFeatured || size === "full",
          "aspect-[4/5]": !isFeatured && size !== "square" && size !== "full",
          "aspect-[1/1]": size === "square",
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium",
          "w-[440px]": size === "large",
          "w-full": size === "full",
        },
      )}
      data-testid={dataTestid}
    >
      <ImageOrPlaceholder image={initialImage} size={size} label={label} />
    </Container>
  )
}

const ImageOrPlaceholder = ({
  image,
  size,
  label,
}: Pick<ThumbnailProps, "size" | "label"> & { image?: string }) => {
  return (
    <ProductImage
      src={image}
      alt={label ? `${label} — ảnh sản phẩm` : "Ảnh sản phẩm"}
      placeholderSize={size === "small" ? 16 : 24}
      sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
    />
  )
}

export default Thumbnail
