import TransferActions from "@modules/order/components/transfer-actions"
import TransferImage from "@modules/order/components/transfer-image"

export default async function TransferPage({
  params,
}: {
  params: Promise<{ id: string; token: string }>
}) {
  const { id, token } = await params

  return (
    <div className="dm-section">
      <div className="content-container flex flex-col items-start gap-y-6 small:max-w-2xl">
        <TransferImage />
        <div className="flex flex-col gap-y-4">
          <p className="dm-eyebrow">Liên kết đơn hàng</p>
          <h1 className="dm-title">Yêu cầu liên kết đơn hàng {id}</h1>
        </div>
        <p className="dm-body">
          Bạn nhận được yêu cầu chuyển quyền sở hữu đơn hàng{" "}
          <span className="font-medium text-ink">{id}</span>. Nếu đồng ý, bạn có thể chấp nhận yêu
          cầu bên dưới.
        </p>
        <div className="dm-divider" />
        <p className="dm-body">
          Khi chấp nhận, chủ mới sẽ tiếp nhận quyền hạn và trách nhiệm đối với đơn hàng.
        </p>
        <p className="dm-body">
          Nếu không nhận ra yêu cầu hoặc muốn giữ quyền sở hữu, bạn không cần thực hiện thêm thao
          tác.
        </p>
        <div className="dm-divider" />
        <TransferActions id={id} token={token} />
      </div>
    </div>
  )
}
