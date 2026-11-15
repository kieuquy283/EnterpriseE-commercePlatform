"use client"
import { createTransferRequest } from "@lib/data/orders"
import { CheckCircleMiniSolid, XCircleSolid } from "@medusajs/icons"
import { Alert, Heading, IconButton, Input } from "@modules/common/components/ui"
import { useActionState } from "react"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { useEffect, useState } from "react"

export default function TransferRequestForm() {
  const [showSuccess, setShowSuccess] = useState(false)

  const [state, formAction] = useActionState(createTransferRequest, {
    success: false,
    error: null,
    order: null,
  })

  useEffect(() => {
    if (state.success && state.order) {
      setShowSuccess(true)
    }
  }, [state.success, state.order])

  return (
    <div className="flex w-full flex-col gap-y-4">
      <div className="grid w-full grid-cols-1 items-center gap-x-8 gap-y-4 sm:grid-cols-2">
        <div className="flex flex-col gap-y-1">
          <Heading level="h3" className="text-dm-title-sm">
            Liên kết đơn hàng
          </Heading>
          <p className="dm-caption">
            Không tìm thấy đơn hàng? Bạn có thể yêu cầu liên kết đơn với tài khoản của mình.
          </p>
        </div>
        <form action={formAction} className="flex flex-col gap-y-2 sm:items-end">
          <div className="flex w-full flex-col gap-y-2">
            <Input name="order_id" label="Mã đơn hàng" placeholder="order_..." autoComplete="off" />
            <SubmitButton
              variant="secondary"
              size="small"
              className="w-fit self-end whitespace-nowrap"
            >
              Yêu cầu liên kết
            </SubmitButton>
          </div>
        </form>
      </div>
      {!state.success && state.error && (
        <div data-testid="transfer-request-error">
          <Alert tone="error">{state.error}</Alert>
        </div>
      )}
      {showSuccess && (
        <div className="flex w-full items-start justify-between gap-4 rounded-dm-sm border border-line bg-surface p-4">
          <div className="flex items-start gap-x-3">
            <CheckCircleMiniSolid className="mt-0.5 h-4 w-4 text-success" />
            <div className="flex flex-col gap-y-1">
              <p className="text-dm-small font-medium text-ink">
                Yêu cầu liên kết đơn {state.order?.id} đã được gửi
              </p>
              <p className="dm-caption">Yêu cầu liên kết đã được tạo cho {state.order?.email}.</p>
            </div>
          </div>
          <IconButton
            className="h-fit"
            label="Đóng thông báo liên kết đơn"
            onClick={() => setShowSuccess(false)}
          >
            <XCircleSolid className="h-4 w-4 text-ink-faint" />
          </IconButton>
        </div>
      )}
    </div>
  )
}
