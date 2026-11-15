import { ReactNode } from "react"

import { clx } from "@modules/common/components/ui"

type CheckoutSectionProps = {
  /** Zero-based position of the section inside the checkout flow. */
  index: number
  title: string
  isOpen: boolean
  isComplete: boolean
  onEdit?: () => void
  editTestId?: string
  id: string
  children: ReactNode
}

/**
 * Presentational shell for one checkout step: numbered heading, optional
 * "Edit" affordance for a completed step and a consistent rule between
 * sections. All flow state stays in the step components.
 */
const CheckoutSection = ({
  index,
  title,
  isOpen,
  isComplete,
  onEdit,
  editTestId,
  id,
  children,
}: CheckoutSectionProps) => {
  return (
    <section aria-labelledby={id} className="border-b border-line pb-8 last:border-b-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-baseline gap-x-3">
          <span
            aria-hidden="true"
            className={clx(
              "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-dm-pill text-dm-micro font-semibold tabular-nums",
              isComplete && !isOpen
                ? "bg-accent-soft text-accent-ink"
                : "border border-line text-ink-faint",
              isOpen && "border-ink text-ink",
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <h2 id={id} className={clx("dm-heading", !isOpen && !isComplete && "text-ink-faint")}>
            {title}
          </h2>
        </div>
        {!isOpen && isComplete && onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="dm-btn dm-btn-ghost dm-btn-sm shrink-0"
            data-testid={editTestId}
          >
            Chỉnh sửa
          </button>
        ) : null}
      </div>
      <div className={isOpen ? "mt-6" : "mt-4"}>{children}</div>
    </section>
  )
}

export default CheckoutSection
