import BrandLogo from "@modules/common/components/brand-logo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import MedusaCTA from "@modules/layout/components/medusa-cta"

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full bg-canvas small:min-h-screen">
      <header className="border-b border-line">
        <nav className="content-container flex h-16 items-center justify-between gap-4">
          <LocalizedClientLink
            href="/cart"
            className="flex flex-1 basis-0 items-center gap-x-2 text-dm-small font-medium text-ink-muted transition-colors duration-200 hover:text-ink"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="hidden small:block">Về giỏ hàng</span>
            <span className="block small:hidden">Quay lại</span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="flex shrink-0 items-center"
            data-testid="store-link"
            aria-label="Trang chủ DAYMARK"
          >
            <BrandLogo />
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </header>
      <main id="daymark-main" className="relative" data-testid="checkout-container">
        {children}
      </main>
      <div className="flex w-full items-center justify-center py-6">
        <MedusaCTA />
      </div>
    </div>
  )
}
