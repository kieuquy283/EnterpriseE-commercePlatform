import { MagnifyingGlass } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function Search() {
  return (
    <LocalizedClientLink
      aria-label="Tìm sản phẩm"
      className="dm-nav-link"
      data-testid="nav-search-button"
      href="/store"
    >
      <MagnifyingGlass className="h-4 w-4" aria-hidden="true" />
    </LocalizedClientLink>
  )
}
