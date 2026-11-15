import { Label, RadioGroup, clx } from "@modules/common/components/ui"

type FilterRadioGroupProps = {
  title: string
  items: {
    value: string
    label: string
  }[]
  value: string
  handleChange: (value: string) => void
  "data-testid"?: string
}

const FilterRadioGroup = ({
  title,
  items,
  value,
  handleChange,
  "data-testid": dataTestId,
}: FilterRadioGroupProps) => {
  return (
    <fieldset className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <legend className="dm-label mb-3">{title}</legend>
      <RadioGroup data-testid={dataTestId} className="!flex-row flex-wrap gap-x-6 gap-y-3">
        {items?.map((item) => {
          const isActive = item.value === value
          return (
            <div key={item.value} className="flex items-center gap-2">
              <RadioGroup.Item
                checked={isActive}
                onChange={() => handleChange(item.value)}
                name="sortBy"
                id={`sort-${item.value}`}
                value={item.value}
              />
              <Label
                htmlFor={`sort-${item.value}`}
                className={clx(
                  "mb-0 flex cursor-pointer items-center gap-2 text-dm-small normal-case tracking-normal transition-colors",
                  isActive ? "text-ink" : "text-ink-muted hover:text-ink",
                )}
                data-testid="radio-label"
                data-active={isActive}
              >
                {item.label}
              </Label>
            </div>
          )
        })}
      </RadioGroup>
    </fieldset>
  )
}

export default FilterRadioGroup
