"use client"

import { clx } from "@modules/common/components/ui"
import {
  SelectHTMLAttributes,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

import ChevronDown from "@modules/common/icons/chevron-down"

type NativeSelectProps = {
  placeholder?: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">

const CartItemSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ placeholder = "Chọn...", className, children, ...props }, ref) => {
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
      <div className={clx("relative inline-flex items-center", className)}>
        <select
          ref={innerRef}
          {...props}
          className={clx("dm-field w-20 appearance-none pl-4 pr-8 tabular-nums", {
            "text-ink-faint": isPlaceholder,
          })}
        >
          <option disabled value="">
            {placeholder}
          </option>
          {children}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-2.5 flex items-center text-ink-faint"
        >
          <ChevronDown />
        </span>
      </div>
    )
  },
)

CartItemSelect.displayName = "CartItemSelect"

export default CartItemSelect
