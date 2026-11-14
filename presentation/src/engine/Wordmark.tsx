import type { DeckBrand } from "./types.ts"

export function Wordmark({
  brand,
  size = "compact",
  decorative = false,
}: {
  brand: DeckBrand
  size?: "compact" | "hero"
  decorative?: boolean
}) {
  const [first, second] = brand.split ?? [brand.name, ""]

  return (
    <span
      className={`wordmark wordmark--${size}`}
      {...(decorative
        ? { "aria-hidden": true as const }
        : { role: "img", "aria-label": brand.name })}
    >
      {brand.logoSrc ? (
        <img
          className="wordmark__logo"
          src={brand.logoSrc}
          alt={decorative ? "" : (brand.logoAlt ?? brand.name)}
          aria-hidden={decorative ? true : undefined}
        />
      ) : null}
      <span className="wordmark__first" aria-hidden="true">
        {first}
      </span>
      {second ? (
        <span className="wordmark__second" aria-hidden="true">
          {second}
        </span>
      ) : null}
    </span>
  )
}
