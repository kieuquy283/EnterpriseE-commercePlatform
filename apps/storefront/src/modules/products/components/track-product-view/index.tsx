"use client"

import { trackPersonalizationView } from "@lib/data/personalization"
import { useEffect, useRef } from "react"

export default function TrackProductView({ productId }: { productId: string }) {
  const tracked = useRef(false)
  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    void trackPersonalizationView(productId)
  }, [productId])
  return null
}
