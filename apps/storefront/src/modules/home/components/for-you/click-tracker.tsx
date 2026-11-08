"use client"

import { trackPersonalizationClick } from "@lib/data/personalization"
import { useEffect, useRef } from "react"

export default function ClickTracker({ productId, children }: { productId: string; children: React.ReactNode }) {
  const container = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = container.current
    if (!element) return
    const onClick = (event: MouseEvent) => {
      if ((event.target as Element).closest("a")) void trackPersonalizationClick(productId)
    }
    element.addEventListener("click", onClick)
    return () => element.removeEventListener("click", onClick)
  }, [productId])
  return <div ref={container}>{children}</div>
}
