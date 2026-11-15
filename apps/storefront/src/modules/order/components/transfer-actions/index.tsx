"use client"

import { acceptTransferRequest, declineTransferRequest } from "@lib/data/orders"
import { Alert, Button } from "@modules/common/components/ui"
import { useState } from "react"

type TransferStatus = "pending" | "success" | "error"

const TransferActions = ({ id, token }: { id: string; token: string }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<{
    accept: TransferStatus | null
    decline: TransferStatus | null
  } | null>({
    accept: null,
    decline: null,
  })

  const acceptTransfer = async () => {
    setStatus({ accept: "pending", decline: null })
    setErrorMessage(null)

    const { success, error } = await acceptTransferRequest(id, token)

    if (error) setErrorMessage(error)
    setStatus({ accept: success ? "success" : "error", decline: null })
  }

  const declineTransfer = async () => {
    setStatus({ accept: null, decline: "pending" })
    setErrorMessage(null)

    const { success, error } = await declineTransferRequest(id, token)

    if (error) setErrorMessage(error)
    setStatus({ accept: null, decline: success ? "success" : "error" })
  }

  return (
    <div className="flex w-full flex-col gap-y-4">
      {status?.accept === "success" && (
        <Alert tone="success">
          Đã liên kết đơn hàng với chủ mới. Chủ mới chịu trách nhiệm về đơn hàng này.
        </Alert>
      )}
      {status?.decline === "success" && (
        <Alert tone="info">Đã từ chối liên kết. Đơn hàng vẫn thuộc về bạn.</Alert>
      )}
      {status?.accept !== "success" && status?.decline !== "success" && (
        <div className="flex flex-wrap gap-x-3 gap-y-3">
          <Button
            size="large"
            onClick={acceptTransfer}
            isLoading={status?.accept === "pending"}
            loadingLabel="Đang chấp nhận"
            disabled={status?.accept === "pending" || status?.decline === "pending"}
          >
            Chấp nhận liên kết
          </Button>
          <Button
            size="large"
            variant="secondary"
            onClick={declineTransfer}
            isLoading={status?.decline === "pending"}
            loadingLabel="Đang từ chối"
            disabled={status?.accept === "pending" || status?.decline === "pending"}
          >
            Từ chối liên kết
          </Button>
        </div>
      )}
      {errorMessage && <Alert tone="error">{errorMessage}</Alert>}
    </div>
  )
}

export default TransferActions
