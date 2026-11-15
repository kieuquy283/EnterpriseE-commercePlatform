import clsx from "clsx"
import {
  ButtonHTMLAttributes,
  forwardRef,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  TextareaHTMLAttributes,
  ThHTMLAttributes,
} from "react"

// Re-export clsx as clx for compatibility with the starter components.
export { clsx as clx }

/* -------------------------------------------------------------------------- */
/* Typography                                                                  */
/* -------------------------------------------------------------------------- */

type TextProps = HTMLAttributes<HTMLParagraphElement> & {
  as?: "p" | "span" | "div"
}

export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, as: Component = "p", children, ...props }, ref) => {
    return (
      <Component ref={ref} className={clsx("dm-body text-dm-body", className)} {...props}>
        {children}
      </Component>
    )
  },
)
Text.displayName = "Text"

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: "h1" | "h2" | "h3" | "h4"
}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level: Component = "h2", children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={clsx(
          "font-sans font-medium text-ink",
          Component === "h1" && "text-dm-display",
          Component === "h2" && "text-dm-title-lg",
          Component === "h3" && "text-dm-title",
          Component === "h4" && "text-dm-title-sm",
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    )
  },
)
Heading.displayName = "Heading"

/* -------------------------------------------------------------------------- */
/* Buttons                                                                     */
/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "accent" | "transparent" | "danger"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: "small" | "medium" | "large"
  isLoading?: boolean
  loadingLabel?: string
}

const buttonVariantClass: Record<ButtonVariant, string> = {
  primary: "dm-btn-primary",
  secondary: "dm-btn-secondary",
  accent: "dm-btn-accent",
  transparent: "dm-btn-ghost",
  danger: "dm-btn border-danger bg-danger text-canvas hover:opacity-90",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size: _size = "medium",
      isLoading,
      loadingLabel,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        // Interactivity is removed while pending so a double activation cannot
        // submit twice; the label still describes the in-flight operation.
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={clsx(buttonVariantClass[variant], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <SpinnerMark />
            <span>{loadingLabel ?? children}</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  },
)
Button.displayName = "Button"

export function SpinnerMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        "inline-block h-3.5 w-3.5 animate-[ring_1.2s_linear_infinite] rounded-full border-[1.5px] border-current border-t-transparent",
        className,
      )}
    />
  )
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, label, children, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={label}
        className={clsx("dm-btn-icon", className)}
        {...props}
      >
        {children}
      </button>
    )
  },
)
IconButton.displayName = "IconButton"

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

type ContainerProps = HTMLAttributes<HTMLDivElement>

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx("dm-card", className)} {...props}>
        {children}
      </div>
    )
  },
)
Container.displayName = "Container"

/* -------------------------------------------------------------------------- */
/* Status and feedback                                                         */
/* -------------------------------------------------------------------------- */

type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger"

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone
  /** Legacy prop kept so existing callers keep compiling. */
  color?: "green" | "red" | "blue" | "orange" | "grey" | "purple"
}

const legacyBadgeTone: Record<NonNullable<BadgeProps["color"]>, BadgeTone> = {
  green: "success",
  red: "danger",
  blue: "accent",
  orange: "warning",
  grey: "neutral",
  purple: "accent",
}

const badgeToneClass: Record<BadgeTone, string> = {
  neutral: "border-line bg-surface text-ink-muted",
  accent: "border-accent/30 bg-accent-soft text-accent-ink",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone, color = "grey", children, ...props }, ref) => {
    const resolved = tone ?? legacyBadgeTone[color] ?? "neutral"

    return (
      <span
        ref={ref}
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-none border-l px-2.5 py-1 text-dm-caption font-medium",
          badgeToneClass[resolved],
          className,
        )}

        {...props}
      >
        {children}
      </span>
    )
  },
)
Badge.displayName = "Badge"

type IconBadgeProps = HTMLAttributes<HTMLSpanElement>

export const IconBadge = forwardRef<HTMLSpanElement, IconBadgeProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center rounded-dm-pill bg-surface p-1.5 text-ink-muted",
          className,
        )}
        {...props}
      >
        {children}
      </span>
    )
  },
)
IconBadge.displayName = "IconBadge"

/**
 * Inline status message. `role` is chosen from the tone so that errors are
 * announced assertively and informational states politely.
 */
export function Alert({
  tone = "info",
  title,
  children,
  className,
  ...props
}: {
  tone?: "info" | "success" | "warning" | "error"
  title?: ReactNode
} & HTMLAttributes<HTMLDivElement>) {
  const toneClass = {
    info: "dm-alert-info",
    success: "dm-alert-success",
    warning: "dm-alert-warning",
    error: "dm-alert-error",
  }[tone]

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx(toneClass, className)}
      {...props}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={clsx(title && "mt-1", "leading-relaxed")}>{children}</div> : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Forms                                                                       */
/* -------------------------------------------------------------------------- */

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  /** Legacy alias: the starter passed a string `label` to `Label`. */
  label?: string
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, label, ...props }, ref) => {
    return (
      <label ref={ref} className={clsx("dm-label", className)} {...props}>
        {children ?? label}
      </label>
    )
  },
)
Label.displayName = "Label"

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const generatedId = id ?? props.name
    return (
      <div className="flex w-full flex-col">
        {label && <Label htmlFor={generatedId}>{label}</Label>}
        <input
          ref={ref}
          id={generatedId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${generatedId}-help` : undefined}
          className={clsx("dm-field", error && "border-danger focus:border-danger", className)}
          {...props}
        />
        {(hint || error) && (
          <p id={`${generatedId}-help`} className={error ? "dm-error-text dm-hint" : "dm-hint"}>
            {error ?? hint}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = "Input"

type NativeSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  hint?: string
  error?: string
}

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, label, hint, error, id, children, ...props }, ref) => {
    const generatedId = id ?? props.name
    return (
      <div className="flex w-full flex-col">
        {label && <Label htmlFor={generatedId}>{label}</Label>}
        <select
          ref={ref}
          id={generatedId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${generatedId}-help` : undefined}
          className={clsx("dm-field pr-8", error && "border-danger", className)}
          {...props}
        >
          {children}
        </select>
        {(hint || error) && (
          <p id={`${generatedId}-help`} className={error ? "dm-error-text dm-hint" : "dm-hint"}>
            {error ?? hint}
          </p>
        )}
      </div>
    )
  },
)
NativeSelect.displayName = "NativeSelect"

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, rows = 4, ...props }, ref) => {
    const generatedId = id ?? props.name
    return (
      <div className="flex w-full flex-col">
        {label && <Label htmlFor={generatedId}>{label}</Label>}
        <textarea
          ref={ref}
          id={generatedId}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${generatedId}-help` : undefined}
          className={clsx("dm-field h-auto py-2.5", error && "border-danger", className)}
          {...props}
        />
        {(hint || error) && (
          <p id={`${generatedId}-help`} className={error ? "dm-error-text dm-hint" : "dm-hint"}>
            {error ?? hint}
          </p>
        )}
      </div>
    )
  },
)
Textarea.displayName = "Textarea"

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="flex items-start gap-2.5">
        <input
          ref={ref}
          type="checkbox"
          id={id}
          className={clsx(
            "mt-0.5 h-4 w-4 shrink-0 rounded-dm-xs border-line-strong text-accent accent-accent focus:ring-accent",
            className,
          )}
          {...props}
        />
        {label && (
          <Label htmlFor={id} className="mb-0 normal-case tracking-normal">
            {label}
          </Label>
        )}
      </div>
    )
  },
)
Checkbox.displayName = "Checkbox"

/* -------------------------------------------------------------------------- */
/* Tables                                                                      */
/* -------------------------------------------------------------------------- */

type TableProps = TableHTMLAttributes<HTMLTableElement>

const TableRoot = forwardRef<HTMLTableElement, TableProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <table ref={ref} className={clsx("w-full caption-bottom text-dm-body", className)} {...props}>
        {children}
      </table>
    )
  },
)
TableRoot.displayName = "Table"

const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <thead ref={ref} className={clsx("border-b border-line", className)} {...props}>
        {children}
      </thead>
    )
  },
)
TableHeader.displayName = "TableHeader"

const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <tbody ref={ref} className={clsx("[&_tr:last-child]:border-0", className)} {...props}>
        {children}
      </tbody>
    )
  },
)
TableBody.displayName = "TableBody"

const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={clsx("border-b border-line transition-colors", className)}
        {...props}
      >
        {children}
      </tr>
    )
  },
)
TableRow.displayName = "TableRow"

const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <th
        ref={ref}
        scope="col"
        className={clsx("dm-eyebrow px-3 py-3 text-left font-semibold", className)}
        {...props}
      >
        {children}
      </th>
    )
  },
)
TableHead.displayName = "TableHead"

const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <td ref={ref} className={clsx("px-3 py-4 align-middle", className)} {...props}>
        {children}
      </td>
    )
  },
)
TableCell.displayName = "TableCell"

export const Table = Object.assign(TableRoot, {
  Header: TableHeader,
  Body: TableBody,
  Row: TableRow,
  Head: TableHead,
  HeaderCell: TableHead,
  Cell: TableCell,
})

/* -------------------------------------------------------------------------- */
/* Radio group                                                                 */
/* -------------------------------------------------------------------------- */

const RadioGroupRoot = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="radiogroup"
        className={clsx("flex flex-col gap-2", className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)
RadioGroupRoot.displayName = "RadioGroup"

const RadioGroupItem = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string }
>(({ className, label, id, ...props }, ref) => {
  return (
    <div className="flex items-center gap-2.5">
      <input
        ref={ref}
        type="radio"
        id={id}
        className={clsx(
          "h-4 w-4 border-line-strong text-accent accent-accent focus:ring-accent",
          className,
        )}
        {...props}
      />
      {label && <Label htmlFor={id}>{label}</Label>}
    </div>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export const RadioGroup = Object.assign(RadioGroupRoot, {
  Item: RadioGroupItem,
})
