import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getRegion } from "@lib/data/regions"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

export default async function StorePage(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { countryCode } = await props.params
  const searchParams = await props.searchParams
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  const query = typeof searchParams.q === "string" ? searchParams.q.trim().slice(0, 80) : ""
  const requestedPage = Number(searchParams.page)
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, 1000)
    : 1

  return <StoreTemplate countryCode={countryCode} region={region} query={query} page={page} />
}
