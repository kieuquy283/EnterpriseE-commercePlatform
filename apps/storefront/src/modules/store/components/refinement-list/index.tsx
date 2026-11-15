"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"

import { OPTION_VALUE_QUERY_KEY, parseOptionValueIds } from "@lib/util/product-option-filters"
import OptionsPicker from "./options-picker"
import SortProducts, { SortOptions } from "./sort-products"

type RefinementListProps = {
  sortBy: SortOptions
  search?: boolean
  hideOptionsPicker?: boolean
  "data-testid"?: string
}

const RefinementList = ({
  sortBy,
  hideOptionsPicker = false,
  "data-testid": dataTestId,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateQueryParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      updater(params)

      params.delete("page")

      const queryString = params.toString()
      const currentQuery = searchParams.toString()
      const nextPath = queryString ? `${pathname}?${queryString}` : pathname
      const currentPath = currentQuery ? `${pathname}?${currentQuery}` : pathname

      if (nextPath !== currentPath) {
        router.push(nextPath)
      }
    },
    [pathname, router, searchParams],
  )

  const setQueryParams = (name: string, value: string) =>
    updateQueryParams((params) => params.set(name, value))

  const selectedOptionValueIds = useMemo(() => parseOptionValueIds(searchParams), [searchParams])

  const setOptionValueIds = (valueIds: string[]) =>
    updateQueryParams((params) => {
      params.delete(OPTION_VALUE_QUERY_KEY)
      valueIds.forEach((valueId) => params.append(OPTION_VALUE_QUERY_KEY, valueId))
    })

  const clearFilters = () => {
    updateQueryParams((params) => {
      params.delete(OPTION_VALUE_QUERY_KEY)
    })
  }

  const filterCount = selectedOptionValueIds.length

  return (
    <div className="flex flex-col gap-6">
      <SortProducts sortBy={sortBy} setQueryParams={setQueryParams} data-testid={dataTestId} />
      {!hideOptionsPicker && (
        <div className="border-t border-line pt-6">
          <div className="flex items-center justify-between">
            <h2 className="dm-eyebrow">Bộ lọc</h2>
            {filterCount > 0 && (
              <button type="button" onClick={clearFilters} className="dm-action-link">
                Xoá ({filterCount})
              </button>
            )}
          </div>
          <OptionsPicker
            selectedValueIds={selectedOptionValueIds}
            setOptionValueIds={setOptionValueIds}
          />
        </div>
      )}
    </div>
  )
}

export default RefinementList
