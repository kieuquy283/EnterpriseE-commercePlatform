import { getPersonalizationConsent } from "@lib/data/personalization"
import TrackProductView from "../track-product-view"

export default async function ConsentAwareProductView({ productId }: { productId: string }) {
  if (process.env.NEXT_PUBLIC_ENABLE_PERSONALIZATION_EVENTS !== "true") return null
  const consent = await getPersonalizationConsent()
  return consent ? <TrackProductView productId={productId} /> : null
}
