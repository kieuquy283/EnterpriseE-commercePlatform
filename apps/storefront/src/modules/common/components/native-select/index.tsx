import { ChevronUpDown } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import {
  SelectHTMLAttributes,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

export type NativeSelectProps = {
  placeholder?: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
} & SelectHTMLAttributes<HTMLSelectElement>

const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ placeholder = "Chọn...", defaultValue, className, children, ...props }, ref) => {
    const innerRef = useRef<HTMLSelectElement>(null)
    const [isPlaceholder, setIsPlaceholder] = useState(false)

    useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
      ref,
      () => innerRef.current,
    )

    useEffect(() => {
      if (innerRef.current && innerRef.current.value === "") {
        setIsPlaceholder(true)
      } else {
        setIsPlaceholder(false)
      }
    }, [innerRef.current?.value])

    return (
      <div
        className={clx(
          "relative flex min-h-12 items-center rounded-none border border-line-strong bg-canvas text-dm-body transition-colors hover:border-ink-faint",
          className,
          isPlaceholder ? "text-ink-faint" : "text-ink",
        )}
      >
        <select
          ref={innerRef}
          defaultValue={defaultValue}
          {...props}
          className="min-h-12 w-full flex-1 appearance-none border-none bg-transparent px-3 py-2.5 outline-none"
        >
          <option disabled value="">
            {placeholder}
          </option>
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink-faint">
          <ChevronUpDown />
        </span>
      </div>
    )
  },
)

NativeSelect.displayName = "NativeSelect"

export default NativeSelect
