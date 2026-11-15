import { clx } from "@modules/common/components/ui"

/**
 * Presentational radio mark used inside option rows that are already driven by
 * a real input (Headless UI Radio/Listbox option). It replaces the nested
 * interactive element the starter rendered inside each row.
 */
const OptionMark = ({
  selected,
  "data-testid": dataTestId,
}: {
  selected: boolean
  "data-testid"?: string
}) => {
  return (
    <span
      aria-hidden="true"
      data-testid={dataTestId}
      className={clx(
        "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-dm-pill border transition-colors duration-200 ease-dm-out",
        selected ? "border-accent" : "border-line-strong",
      )}
    >
      <span
        className={clx(
          "h-2 w-2 rounded-dm-pill bg-accent transition-opacity duration-200 ease-dm-out",
          selected ? "opacity-100" : "opacity-0",
        )}
      />
    </span>
  )
}

export default OptionMark
