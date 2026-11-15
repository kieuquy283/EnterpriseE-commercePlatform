import { clx } from "@modules/common/components/ui"
import React, { useEffect, useImperativeHandle, useState } from "react"

import Eye from "@modules/common/icons/eye"
import EyeOff from "@modules/common/icons/eye-off"

type InputProps = Omit<Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">, "placeholder"> & {
  label: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  name: string
  topLabel?: string
}

/**
 * Fixed-label text field used by the account and checkout forms.
 *
 * Accessibility: the label element is associated with the input through
 * `htmlFor`/`name`, and the inline error is announced through `aria-live` with
 * `aria-invalid` set on the control.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { type, name, label, touched: _touched, required, topLabel, errors, className, ...props },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [inputType, setInputType] = useState(type)

    useEffect(() => {
      if (type === "password" && showPassword) {
        setInputType("text")
      }

      if (type === "password" && !showPassword) {
        setInputType("password")
      }
    }, [type, showPassword])

    useImperativeHandle(ref, () => inputRef.current!)

    const inputId = props.id || name
    const errorMessage =
      errors && typeof errors[inputId] === "string" ? (errors[inputId] as string) : null
    const errorId = `${inputId}-error`

    return (
      <div className="flex w-full flex-col">
        {topLabel && <span className="dm-label">{topLabel}</span>}
        <label htmlFor={inputId} className="dm-label">
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
        <div className="relative z-0 w-full">
          <input
            ref={inputRef}
            id={inputId}
            type={inputType}
            name={name}
            placeholder=" "
            required={required}
            aria-invalid={errorMessage ? true : undefined}
            aria-describedby={errorMessage ? errorId : props["aria-describedby"]}
            className={clx(
              "dm-field appearance-none pr-12 transition-colors hover:border-ink-faint",
              errorMessage && "border-danger",
              className,
            )}
            {...props}
          />
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="dm-btn-icon absolute right-0 top-0"
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          )}
        </div>
        {errorMessage && (
          <p id={errorId} className="dm-error-text dm-hint" role="alert" aria-live="polite">
            {errorMessage}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = "Input"

export default Input
