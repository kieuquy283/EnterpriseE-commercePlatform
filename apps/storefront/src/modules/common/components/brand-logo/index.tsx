import Image from "next/image"

import { clx } from "@modules/common/components/ui"

type BrandLogoProps = {
  /**
   * `full` shows the swallow beside the wordmark, `mark` shows only the
   * provisional swallow emblem, `wordmark` only the typographic lockup.
   */
  variant?: "full" | "mark" | "wordmark"
  size?: "sm" | "md" | "lg"
  className?: string
  /** Rendered next to the wordmark, for example the collection name. */
  showTagline?: boolean
}

const markSize: Record<NonNullable<BrandLogoProps["size"]>, number> = {
  sm: 22,
  md: 28,
  lg: 40,
}

const wordmarkClass: Record<NonNullable<BrandLogoProps["size"]>, string> = {
  sm: "text-[0.8125rem]",
  md: "text-[0.9375rem]",
  lg: "text-[1.375rem]",
}

/**
 * Proposed DAYMARK lockup. The wordmark leads the customer storefront;
 * the preserved swallow remains available as an optional provisional asset.
 */
export default function BrandLogo({
  variant = "full",
  size = "md",
  className,
  showTagline = false,
}: BrandLogoProps) {
  const dimension = markSize[size]

  return (
    <span
      className={clx("inline-flex items-center gap-2.5 text-ink", className)}
      aria-label="DAYMARK"
    >
      {variant !== "wordmark" && (
        <Image
          src="/brand/daymark-swallow.svg"
          alt=""
          width={dimension}
          height={Math.round((dimension * 853) / 923)}
          unoptimized
          aria-hidden="true"
          className="shrink-0"
        />
      )}
      {variant !== "mark" && (
        <span className="flex flex-col leading-none">
          <span
            className={clx("font-sans font-semibold uppercase", wordmarkClass[size])}
            style={{ letterSpacing: "0.22em" }}
          >
            DAYMARK
          </span>
          {showTagline && (
            <span
              className="mt-1.5 text-dm-micro uppercase text-ink-faint"
              style={{ letterSpacing: "0.16em" }}
            >
              Cho mọi ngày thường
            </span>
          )}
        </span>
      )}
    </span>
  )
}
