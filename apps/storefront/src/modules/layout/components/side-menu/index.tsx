"use client"

import { Dialog, DialogPanel, Transition } from "@headlessui/react"
import { ArrowRightMini, BarsThree, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import useToggleState from "@lib/hooks/use-toggle-state"
import BrandLogo from "@modules/common/components/brand-logo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Fragment } from "react"

import CountrySelect from "../country-select"

type MenuLink = { label: string; href: string }

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  categories?: MenuLink[]
  collections?: MenuLink[]
}

const staticLinks: MenuLink[] = [
  { label: "Tất cả sản phẩm", href: "/store" },
  { label: "Tài khoản", href: "/account" },
  { label: "Giỏ hàng", href: "/cart" },
]

const SideMenu = ({ regions, categories = [], collections = [] }: SideMenuProps) => {
  const { state, open, close } = useToggleState()
  const countryToggleState = useToggleState()

  const shopLinks = [...(categories.length ? categories : staticLinks.slice(0, 1))]
  const accountLinks = staticLinks.slice(1)

  return (
    <div className="flex h-full items-center">
      <button
        type="button"
        onClick={open}
        data-testid="nav-menu-button"
        aria-haspopup="dialog"
        aria-expanded={state}
        className="dm-btn-icon"
        aria-label="Mở danh mục"
      >
        <BarsThree aria-hidden="true" />
      </button>

      <Transition show={state} as={Fragment}>
        <Dialog onClose={close} aria-label="Danh mục" className="relative z-[70]">
          <Transition.Child
            as={Fragment}
            enter="ease-dm-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className="fixed inset-0 bg-charcoal-900/30"
              data-testid="side-menu-backdrop"
              aria-hidden="true"
            />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="ease-dm-out duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="fixed inset-y-0 left-0 w-full max-w-sm">
              <DialogPanel
                data-testid="nav-menu-popup"
                className="flex h-full flex-col justify-between border-r border-line bg-canvas px-6 py-5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <BrandLogo size="sm" />
                    <button
                      type="button"
                      onClick={close}
                      data-testid="close-menu-button"
                      aria-label="Đóng danh mục"
                      className="dm-btn-icon"
                    >
                      <XMark />
                    </button>
                  </div>

                  <nav aria-label="Điều hướng trên di động" className="mt-10">
                    <p className="dm-eyebrow">Cửa hàng</p>
                    <ul className="mt-3 flex flex-col gap-1">
                      {shopLinks.map((link) => (
                        <li key={link.href}>
                          <LocalizedClientLink
                            href={link.href}
                            onClick={close}
                            data-testid={`${link.label.toLowerCase()}-link`}
                            className="block py-2 font-sans text-dm-title font-medium text-ink transition-colors hover:text-accent"
                          >
                            {link.label}
                          </LocalizedClientLink>
                        </li>
                      ))}
                    </ul>

                    {collections.length > 0 && (
                      <>
                        <p className="dm-eyebrow mt-8">Bộ sưu tập</p>
                        <ul className="mt-3 flex flex-col gap-1">
                          {collections.map((link) => (
                            <li key={link.href}>
                              <LocalizedClientLink
                                href={link.href}
                                onClick={close}
                                className="block py-1.5 text-dm-body text-ink-muted transition-colors hover:text-ink"
                              >
                                {link.label}
                              </LocalizedClientLink>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    <ul className="mt-8 flex flex-col gap-1 border-t border-line pt-6">
                      {accountLinks.map((link) => (
                        <li key={link.href}>
                          <LocalizedClientLink
                            href={link.href}
                            onClick={close}
                            data-testid={`${link.label.toLowerCase()}-link`}
                            className="block py-1.5 text-dm-body text-ink-muted transition-colors hover:text-ink"
                          >
                            {link.label}
                          </LocalizedClientLink>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>

                <div className="flex flex-col gap-y-4 border-t border-line pt-5">
                  <div
                    className="flex items-center justify-between"
                    onMouseEnter={countryToggleState.open}
                    onMouseLeave={countryToggleState.close}
                  >
                    {regions && (
                      <CountrySelect toggleState={countryToggleState} regions={regions} />
                    )}
                    <ArrowRightMini
                      className={
                        countryToggleState.state
                          ? "-rotate-90 text-ink-muted transition-transform duration-150"
                          : "text-ink-muted transition-transform duration-150"
                      }
                    />
                  </div>
                  <p className="text-dm-caption text-ink-faint">
                    © {new Date().getFullYear()} DAYMARK. Cho mọi ngày thường.
                  </p>
                </div>
              </DialogPanel>
            </div>
          </Transition.Child>
        </Dialog>
      </Transition>
    </div>
  )
}

export default SideMenu
