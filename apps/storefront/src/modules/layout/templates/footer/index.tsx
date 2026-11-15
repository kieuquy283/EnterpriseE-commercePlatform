import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import BrandLogo from "@modules/common/components/brand-logo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const year = new Date().getFullYear()

/**
 * Service promises the storefront can actually honour today. Cash on delivery
 * and manual fulfilment are the only configured paths, so nothing here claims
 * express courier or self-service returns that do not exist.
 */
const serviceNotes = [
  {
    title: "Giao hàng",
    body: "Lựa chọn giao hàng và chi phí được xác nhận khi thanh toán.",
  },
  {
    title: "Thanh toán",
    body: "Thanh toán khi nhận hàng. Hiện chưa hỗ trợ thanh toán thẻ.",
  },
  {
    title: "Đổi trả",
    body: "Liên hệ cửa hàng về đơn hàng của bạn trước khi gửi trả sản phẩm.",
  },
]

export default async function Footer() {
  const [categories, collectionResult] = await Promise.all([
    listCategories().catch(() => []),
    listCollections({ fields: "*products" }).catch(() => ({
      collections: [],
      count: 0,
    })),
  ])

  const topLevelCategories = (categories ?? []).filter((category) => !category.parent_category)
  const collections = collectionResult.collections ?? []

  return (
    <footer className="mt-20 border-t border-line bg-surface/60">
      <div className="content-container">
        <div className="grid grid-cols-1 gap-12 py-14 small:grid-cols-12 small:gap-8 small:py-20">
          <div className="small:col-span-5">
            <BrandLogo size="md" showTagline />
            <p className="mt-6 max-w-dm-prose text-dm-body text-ink-muted">
              Trang phục thường ngày giản dị, dễ phối cho giảng đường, công sở và cuối tuần. Cho
              nhịp sống của bạn tại Việt Nam.
            </p>
          </div>

          {topLevelCategories.length > 0 && (
            <nav aria-labelledby="footer-categories-heading" className="small:col-span-2">
              <h2 id="footer-categories-heading" className="dm-eyebrow">
                Cửa hàng
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5" data-testid="footer-categories">
                {topLevelCategories.slice(0, 6).map((category) => (
                  <li key={category.id}>
                    <LocalizedClientLink
                      href={`/categories/${category.handle}`}
                      data-testid="category-link"
                      className="text-dm-small text-ink-muted transition-colors hover:text-ink"
                    >
                      {category.name}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {collections.length > 0 && (
            <nav aria-labelledby="footer-collections-heading" className="small:col-span-2">
              <h2 id="footer-collections-heading" className="dm-eyebrow">
                Bộ sưu tập
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {collections.slice(0, 6).map((collection) => (
                  <li key={collection.id}>
                    <LocalizedClientLink
                      href={`/collections/${collection.handle}`}
                      className="text-dm-small text-ink-muted transition-colors hover:text-ink"
                    >
                      {collection.title}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div id="daymark-service" className="small:col-span-3 scroll-mt-24">
            <h2 className="dm-eyebrow">Dịch vụ</h2>
            <dl className="mt-4 flex flex-col gap-4">
              {serviceNotes.map((note) => (
                <div key={note.title}>
                  <dt className="text-dm-small font-semibold text-ink">{note.title}</dt>
                  <dd className="mt-1 text-dm-caption text-ink-muted">{note.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-line py-6 text-dm-caption text-ink-faint small:flex-row small:items-center small:justify-between">
          <p>© {year} DAYMARK. Giá bằng đồng Việt Nam. Tổng tiền được xác nhận khi thanh toán.</p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <li>
              <LocalizedClientLink
                href="/#daymark-service"
                className="transition-colors hover:text-ink"
              >
                Giao hàng và đổi trả
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink href="/account" className="transition-colors hover:text-ink">
                Theo dõi đơn hàng
              </LocalizedClientLink>
            </li>
            <li>
              <a
                href="https://docs.medusajs.com"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-ink"
              >
                Nền tảng
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
