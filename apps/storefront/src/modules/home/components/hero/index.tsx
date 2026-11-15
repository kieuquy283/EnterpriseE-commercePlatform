import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ArrowBadge from "@modules/common/components/arrow-badge"

/** An original editorial composition; product galleries use their own catalog media. */
export default function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="w-full bg-surface">
      <div className="overflow-hidden">
        <div className="grid small:min-h-[calc(100svh-64px)] small:grid-cols-[0.44fr_0.56fr]">
          <div className="flex flex-col justify-between gap-12 px-6 py-10 small:px-[5vw] small:py-14">
            <div>
              <h1
                id="hero-heading"
                className="max-w-[11ch] font-sans text-[clamp(2.5rem,4.6vw,4.5rem)] font-normal uppercase leading-[1.08] tracking-[-0.045em] text-ink"
              >
                Mặc giản đơn.
                <br />
                Sống trọn
                <br />
                mỗi ngày.
              </h1>
            </div>
            <div className="grid grid-cols-[0.8fr_1.2fr] items-end gap-5 small:gap-6">
              <div className="relative aspect-[3/4] overflow-hidden rounded-dm-sm bg-stage">
                <Image
                  src="/collection-art/hero-detail.jpg"
                  alt="Áo thun trắng mặc hằng ngày"
                  fill
                  sizes="(max-width: 1024px) 35vw, 180px"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="mb-5 max-w-[24ch] text-dm-small leading-relaxed text-ink-muted">
                  Những món đồ dễ mặc, dễ phối. Từ giảng đường, công sở đến cuối tuần của riêng bạn.
                </p>
                <LocalizedClientLink href="/store" className="dm-btn-primary whitespace-nowrap">
                  <span>Khám phá ngay</span>
                  <ArrowBadge />
                </LocalizedClientLink>
              </div>
            </div>
          </div>
          <div className="relative min-h-[440px] small:min-h-[calc(100svh-64px)]">
            <Image
              src="/collection-art/hero-feature.jpg"
              alt="Người mẫu mặc trang phục tông be trong không gian studio"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-[75%_center]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
