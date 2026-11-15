import ArrowBadge from "../arrow-badge"
import LocalizedClientLink from "../localized-client-link"

type InteractiveLinkProps = {
  href: string
  children?: React.ReactNode
  onClick?: () => void
  className?: string
}

const InteractiveLink = ({
  href,
  children,
  onClick,
  className,
  ...props
}: InteractiveLinkProps) => {
  return (
    <LocalizedClientLink
      className={`dm-action-link ${className ?? ""}`}
      href={href}
      onClick={onClick}
      {...props}
    >
      <span>{children}</span>
      <ArrowBadge />
    </LocalizedClientLink>
  )
}

export default InteractiveLink
