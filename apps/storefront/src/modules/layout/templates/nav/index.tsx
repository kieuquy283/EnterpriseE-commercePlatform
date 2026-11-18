import { ShoppingBag } from "@medusajs/icons"
import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listRegions } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import BrandLogo from "@modules/common/components/brand-logo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import Search from "@modules/layout/components/search"
import SideMenu from "@modules/layout/components/side-menu"

/** Primary shop links, resolved from live categories when available. */
async function primaryLinks(): Promise<{ label: string; href: string }[]> {
  try {
    const categories = await listCategories({
      fields: "id,handle,name,parent_category",
      parent_category_id: "null",
      limit: 6,
    })

    const usable = (categories ?? [])
      .filter((category) => Boolean(category.handle))
      .map((category) => ({
        label: category.name ?? "",
        href: `/categories/${category.handle}`,
      }))
      .filter((link) => link.label.length > 0)

    if (usable.length) {
      return usable
    }
  } catch (error) {
    // A catalog outage must not remove navigation entirely; fall through to
    // the stable route links below.
    if (process.env.NODE_ENV !== "production") {
      console.warn("Primary navigation categories unavailable", error)
    }
  }

  return [{ label: "Tất cả sản phẩm", href: "/store" }]
}

async function collectionLinks(): Promise<{ label: string; href: string }[]> {
  try {
    const { collections } = await listCollections({
      fields: "id,handle,title",
      limit: "3",
    })

    return (collections ?? [])
      .filter((collection) => Boolean(collection.handle))
      .map((collection) => ({
        label: collection.title ?? "",
        href: `/collections/${collection.handle}`,
      }))
  } catch {
    return []
  }
}

export default async function Nav() {
  const regions: HttpTypes.StoreRegion[] = await listRegions()
  const [categories, collections] = await Promise.all([primaryLinks(), collectionLinks()])

  const desktopLinks = [
    { label: "Hàng mới", href: "/store" },
    ...categories.filter((c) => c.href !== "/store").slice(0, 3),
  ]

  return (
    <div className="sticky inset-x-0 top-0 z-50">
      <div className="border-b border-line bg-canvas/95 backdrop-blur-sm">
        <header className="content-container">
          <nav
            aria-label="Điều hướng chính"
            className="flex h-16 items-center justify-between gap-4"
          >
            <div className="flex flex-1 basis-0 items-center gap-1">
              <div className="small:hidden">
                <SideMenu regions={regions} categories={categories} collections={collections} />
              </div>
              <ul className="hidden items-center gap-4 small:flex">
                {desktopLinks.map((link, idx) => (
                  <li key={`nav-${link.href}-${idx}`}>
                    <LocalizedClientLink
                      href={link.href}
                      className="dm-nav-link uppercase"
                      style={{ letterSpacing: "0.08em" }}
                    >
                      {link.label}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center">
              <LocalizedClientLink
                href="/"
                className="transition-opacity duration-200 hover:opacity-70"
                data-testid="nav-store-link"
                aria-label="Trang chủ DAYMARK"
              >
                <BrandLogo variant="full" size="md" />
              </LocalizedClientLink>
            </div>

            <div className="flex flex-1 basis-0 items-center justify-end gap-3 small:gap-5">
              <ul className="hidden items-center gap-5 small:flex">
                <li>
                  <LocalizedClientLink
                    className="dm-nav-link uppercase"
                    style={{ letterSpacing: "0.08em" }}
                    href="/account"
                    data-testid="nav-account-link"
                  >
                    Tài khoản
                  </LocalizedClientLink>
                </li>
              </ul>
              <Search />
              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="dm-nav-link uppercase"
                    style={{ letterSpacing: "0.08em" }}
                    href="/cart"
                    data-testid="nav-cart-link"
                  >
                    <span className="hidden small:inline">Giỏ hàng (0)</span>
                    <span className="inline-flex items-center gap-1.5 small:hidden">
                      <ShoppingBag />0
                    </span>
                  </LocalizedClientLink>
                }
              >
                <CartButton />
              </Suspense>
            </div>
          </nav>
        </header>
      </div>
    </div>
  )
}
