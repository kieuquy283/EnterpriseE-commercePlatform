import { forwardRef, useImperativeHandle, useMemo, useRef } from "react"

import { HttpTypes } from "@medusajs/types"
import { NativeSelect } from "@modules/common/components/ui"

type CountrySelectProps = {
  /** Legacy prop kept for callers that still pass it through. */
  placeholder?: string
  region?: HttpTypes.StoreRegion
  label?: string
  className?: string
  name?: string
  id?: string
  required?: boolean
  disabled?: boolean
  autoComplete?: string
  value?: string
  defaultValue?: string
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void
  "data-testid"?: string
  "aria-label"?: string
}

const CountrySelect = forwardRef<HTMLSelectElement, CountrySelectProps>(
  ({ placeholder = "Chọn quốc gia", region, label = "Quốc gia", defaultValue, ...props }, ref) => {
    const innerRef = useRef<HTMLSelectElement>(null)

    useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
      ref,
      () => innerRef.current,
    )

    const countryOptions = useMemo(() => {
      if (!region) {
        return []
      }

      return region.countries?.map((country) => ({
        value: country.iso_2,
        label: country.display_name,
      }))
    }, [region])

    return (
      <NativeSelect ref={innerRef} label={label} defaultValue={defaultValue} {...props}>
        <option disabled value="">
          {placeholder}
        </option>
        {countryOptions?.map(({ value, label }, index) => (
          <option key={index} value={value}>
            {label}
          </option>
        ))}
      </NativeSelect>
    )
  },
)

CountrySelect.displayName = "CountrySelect"

export default CountrySelect
