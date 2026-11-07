"use client"

import Image from "next/image"
import { useState } from "react"

import PlaceholderImage from "@modules/common/icons/placeholder-image"

type ProductImageProps = {
  src?: string | null
  alt: string
  sizes: string
  priority?: boolean
  placeholderSize?: number
}

export default function ProductImage({
  src,
  alt,
  sizes,
  priority = false,
  placeholderSize = 24,
}: ProductImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  if (!src || failedUrl === src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center" role="img" aria-label={alt}>
        <PlaceholderImage size={placeholderSize} />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className="absolute inset-0 object-cover object-center"
      onError={() => setFailedUrl(src)}
    />
  )
}
