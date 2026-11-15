import { Text, clx } from "@modules/common/components/ui"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import React from "react"

type AccordionItemProps = AccordionPrimitive.AccordionItemProps & {
  title: string
  subtitle?: string
  description?: string
  required?: boolean
  tooltip?: string
  forceMountContent?: true
  headingSize?: "small" | "medium" | "large"
  customTrigger?: React.ReactNode
  complete?: boolean
  active?: boolean
  triggerable?: boolean
  children: React.ReactNode
}

type AccordionProps =
  | (AccordionPrimitive.AccordionSingleProps & React.RefAttributes<HTMLDivElement>)
  | (AccordionPrimitive.AccordionMultipleProps & React.RefAttributes<HTMLDivElement>)

const Accordion: React.FC<AccordionProps> & {
  Item: React.FC<AccordionItemProps>
} = ({ children, ...props }) => {
  return <AccordionPrimitive.Root {...props}>{children}</AccordionPrimitive.Root>
}

const Item: React.FC<AccordionItemProps> = ({
  title,
  subtitle,
  description,
  children,
  className,
  headingSize: _headingSize = "large",
  customTrigger = undefined,
  forceMountContent = undefined,
  triggerable: _triggerable,
  ...props
}) => {
  return (
    <AccordionPrimitive.Item
      {...props}
      className={clx("group border-t border-line last:mb-0 last:border-b", "py-1", className)}
    >
      <AccordionPrimitive.Header className="px-0">
        <div className="flex flex-col">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-4">
              <Text as="span" className="text-dm-small font-semibold text-ink">
                {title}
              </Text>
            </div>
            <AccordionPrimitive.Trigger
              className="dm-btn-icon"
              aria-label={`Mở hoặc thu gọn ${title}`}
            >
              {customTrigger || <MorphingTrigger />}
            </AccordionPrimitive.Trigger>
          </div>
          {subtitle && (
            <Text as="span" className="mt-1 text-dm-caption text-ink-faint">
              {subtitle}
            </Text>
          )}
        </div>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content
        forceMount={forceMountContent}
        className={clx(
          "radix-state-closed:animate-accordion-close radix-state-open:animate-accordion-open radix-state-closed:pointer-events-none px-0",
        )}
      >
        <div className="group-radix-state-closed:animate-accordion-close">
          {description && <Text className="text-dm-small text-ink-muted">{description}</Text>}
          <div className="w-full">{children}</div>
        </div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  )
}

Accordion.Item = Item

const MorphingTrigger = () => {
  return (
    <div className="relative h-4 w-4">
      <span className="absolute inset-y-[31%] left-[48%] right-[48%] w-px bg-current duration-300 group-radix-state-open:rotate-90" />
      <span className="absolute inset-x-[31%] top-[48%] bottom-[48%] h-px bg-current duration-300 group-radix-state-open:rotate-90" />
    </div>
  )
}

export default Accordion
