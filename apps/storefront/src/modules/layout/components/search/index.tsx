import { MagnifyingGlass } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function Search() {
  return (
    <LocalizedClientLink
      aria-label="Search products"
      className="flex items-center hover:text-ui-fg-base"
      data-testid="nav-search-button"
      href="/store"
    >
      <MagnifyingGlass />
    </LocalizedClientLink>
  )
}
