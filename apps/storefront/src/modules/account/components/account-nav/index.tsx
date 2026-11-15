"use client"

import { ArrowRightOnRectangle } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import { useParams, usePathname } from "next/navigation"

import { signout } from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import MapPin from "@modules/common/icons/map-pin"
import Package from "@modules/common/icons/package"
import User from "@modules/common/icons/user"

const AccountNav = ({ customer }: { customer: HttpTypes.StoreCustomer | null }) => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }

  const handleLogout = async () => {
    await signout(countryCode)
  }

  const isOverview = route === `/${countryCode}/account` || route === `/${countryCode}/account/`

  const currentSection = (() => {
    const path = route.split(countryCode)[1] ?? ""
    if (path.startsWith("/account/orders")) return "/account/orders"
    if (path.startsWith("/account/addresses")) return "/account/addresses"
    if (path.startsWith("/account/profile")) return "/account/profile"
    return "/account"
  })()

  return (
    <div>
      {/* Mobile: a compact selector. */}
      <div className="small:hidden" data-testid="mobile-account-nav">
        {!isOverview ? (
          <LocalizedClientLink
            href="/account"
            className="inline-flex items-center gap-x-2 py-2 text-dm-small font-medium text-ink-muted transition-colors duration-200 hover:text-ink"
            data-testid="account-main-link"
          >
            <ChevronDown className="rotate-90" />
            <span>Tài khoản</span>
          </LocalizedClientLink>
        ) : (
          <details className="group rounded-dm-md border border-line bg-canvas">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-dm-small font-medium text-ink">
              <span className="flex flex-col gap-y-0.5">
                <span className="dm-eyebrow">Menu tài khoản</span>
                <span>
                  {currentSection === "/account" && "Tổng quan"}
                  {currentSection === "/account/profile" && "Thông tin cá nhân"}
                  {currentSection === "/account/addresses" && "Địa chỉ"}
                  {currentSection === "/account/orders" && "Đơn hàng"}
                </span>
              </span>
              <ChevronDown className="shrink-0 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <nav aria-label="Tài khoản" className="border-t border-line px-2 py-2">
              <ul className="flex flex-col">
                <li>
                  <LocalizedClientLink
                    href="/account"
                    aria-current={currentSection === "/account" ? "page" : undefined}
                    className="flex items-center gap-x-2 rounded-dm-sm px-2 py-3 text-dm-small text-ink-muted hover:bg-surface"
                    data-testid="overview-link"
                  >
                    <User size={18} />
                    <span>Tổng quan</span>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/profile"
                    aria-current={currentSection === "/account/profile" ? "page" : undefined}
                    className="flex items-center gap-x-2 rounded-dm-sm px-2 py-3 text-dm-small text-ink-muted hover:bg-surface"
                    data-testid="profile-link"
                  >
                    <User size={18} />
                    <span>Thông tin cá nhân</span>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/addresses"
                    aria-current={currentSection === "/account/addresses" ? "page" : undefined}
                    className="flex items-center gap-x-2 rounded-dm-sm px-2 py-3 text-dm-small text-ink-muted hover:bg-surface"
                    data-testid="addresses-link"
                  >
                    <MapPin size={18} />
                    <span>Địa chỉ</span>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/orders"
                    aria-current={currentSection === "/account/orders" ? "page" : undefined}
                    className="flex items-center gap-x-2 rounded-dm-sm px-2 py-3 text-dm-small text-ink-muted hover:bg-surface"
                    data-testid="orders-link"
                  >
                    <Package size={18} />
                    <span>Đơn hàng</span>
                  </LocalizedClientLink>
                </li>
                <li>
                  <button
                    type="button"
                    className="dm-btn-ghost w-full justify-start text-left"
                    onClick={handleLogout}
                    data-testid="logout-button"
                  >
                    <ArrowRightOnRectangle />
                    <span>Đăng xuất</span>
                  </button>
                </li>
              </ul>
            </nav>
          </details>
        )}
      </div>

      {/* Desktop: sticky rail. */}
      <div className="hidden small:block" data-testid="account-nav">
        <div className="small:sticky small:top-24">
          <p className="dm-eyebrow pb-4">Tài khoản</p>
          <nav aria-label="Tài khoản">
            <ul className="flex flex-col gap-y-1">
              <li>
                <AccountNavLink href="/account" route={route!} data-testid="overview-link">
                  Tổng quan
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink href="/account/profile" route={route!} data-testid="profile-link">
                  Thông tin cá nhân
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink
                  href="/account/addresses"
                  route={route!}
                  data-testid="addresses-link"
                >
                  Địa chỉ
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink href="/account/orders" route={route!} data-testid="orders-link">
                  Đơn hàng
                </AccountNavLink>
              </li>
              <li className="pt-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="dm-action-link"
                  data-testid="logout-button"
                >
                  Đăng xuất
                </button>
              </li>
            </ul>
          </nav>
          {customer ? (
            <div className="mt-8 border-t border-line pt-4">
              <p className="dm-eyebrow">Đăng nhập với</p>
              <p className="mt-1 break-words text-dm-caption text-ink-muted">{customer.email}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

type AccountNavLinkProps = {
  href: string
  route: string
  children: React.ReactNode
  "data-testid"?: string
}

const AccountNavLink = ({
  href,
  route,
  children,
  "data-testid": dataTestId,
}: AccountNavLinkProps) => {
  const { countryCode } = useParams() as { countryCode: string }

  const path = route.split(countryCode)[1] ?? ""
  const active =
    href === "/account" ? path === "/account" || path === "/account/" : path.startsWith(href)
  return (
    <LocalizedClientLink
      href={href}
      aria-current={active ? "page" : undefined}
      className={clx(
        "inline-flex items-center border-l-2 border-transparent py-1.5 pl-3 text-dm-small transition-colors duration-200",
        active ? "border-accent font-semibold text-ink" : "text-ink-muted hover:text-ink",
      )}
      data-testid={dataTestId}
    >
      {children}
    </LocalizedClientLink>
  )
}

export default AccountNav
