import { declineTransferRequest } from "@lib/data/orders"
import { Alert } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import TransferImage from "@modules/order/components/transfer-image"

export default async function TransferPage({
  params,
}: {
  params: Promise<{ id: string; token: string }>
}) {
  const { id, token } = await params

  const { success, error } = await declineTransferRequest(id, token)

  return (
    <div className="dm-section">
      <div className="content-container flex flex-col items-start gap-y-6 small:max-w-2xl">
        <TransferImage />
        {success ? (
          <>
            <p className="dm-eyebrow">Liên kết đơn hàng</p>
            <h1 className="dm-title">Đã từ chối liên kết</h1>
            <p className="dm-body">
              Yêu cầu liên kết đơn <span className="font-medium text-ink">{id}</span> đã bị từ chối.
              Đơn hàng vẫn thuộc về bạn.
            </p>
          </>
        ) : (
          <>
            <p className="dm-eyebrow">Liên kết đơn hàng</p>
            <h1 className="dm-title">Không thể từ chối liên kết</h1>
            <p className="dm-body">Không thể từ chối yêu cầu. Liên kết có thể đã hết hạn.</p>
            {error && <Alert tone="error">Thông báo lỗi: {error}</Alert>}
          </>
        )}
        <LocalizedClientLink href="/account/orders" className="dm-btn dm-btn-secondary">
          Đến đơn hàng của bạn
        </LocalizedClientLink>
      </div>
    </div>
  )
}
