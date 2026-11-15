import { deleteLineItem } from "@lib/data/cart"
import { Spinner, Trash } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import { useState } from "react"

const DeleteButton = ({
  id,
  children,
  className,
}: {
  id: string
  children?: React.ReactNode
  className?: string
}) => {
  const [error, setError] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (id: string) => {
    setError(false)
    setIsDeleting(true)
    await deleteLineItem(id).catch((_err) => {
      setIsDeleting(false)
      setError(true)
    })
  }

  return (
    <div className={clx("flex items-center justify-between text-small-regular", className)}>
      <button
        className="dm-action-link"
        onClick={() => handleDelete(id)}
        disabled={isDeleting}
        aria-busy={isDeleting || undefined}
        aria-label={typeof children === "string" ? children : "Xoá sản phẩm"}
      >
        {isDeleting ? <Spinner className="animate-spin" /> : <Trash />}
        <span>{children}</span>
      </button>
      {error && (
        <span className="dm-error-text" role="alert">
          Không thể xoá sản phẩm. Vui lòng thử lại.
        </span>
      )}
    </div>
  )
}

export default DeleteButton
