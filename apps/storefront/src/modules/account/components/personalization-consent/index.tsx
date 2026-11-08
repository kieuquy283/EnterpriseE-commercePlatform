"use client"

import { getPersonalizationConsent, setPersonalizationConsent } from "@lib/data/personalization"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function PersonalizationConsent() {
  const router = useRouter()
  const [granted, setGranted] = useState<boolean | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  useEffect(() => { void getPersonalizationConsent().then((value) => { setGranted(value); setLoaded(true) }) }, [])
  if (!loaded) return <p role="status">Loading recommendation settings...</p>
  if (granted === null) return <p role="status">Personalization settings are unavailable.</p>
  async function change() {
    setBusy(true)
    setError(false)
    const next = !granted
    const saved = await setPersonalizationConsent(next)
    if (saved) { setGranted(next); router.refresh() }
    else setError(true)
    setBusy(false)
  }
  return (
    <section aria-labelledby="personalization-heading" className="border-t border-gray-200 py-6">
      <h3 id="personalization-heading" className="text-large-semi">Product recommendations</h3>
      <p className="text-small-regular my-3">Allow this store to use your product views and recommendation clicks to suggest items for you. You can turn this off at any time.</p>
      <button type="button" onClick={change} disabled={busy} aria-pressed={granted} className="border px-4 py-2">
        {granted ? "Turn off recommendations" : "Turn on recommendations"}
      </button>
      {error && <p role="alert">Could not update your choice. Please try again.</p>}
    </section>
  )
}
