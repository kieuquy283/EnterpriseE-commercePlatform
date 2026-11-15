import { Badge } from "@modules/common/components/ui"

export type OrderStatusTone = "neutral" | "accent" | "success" | "warning" | "danger"

const successStatuses = ["delivered", "fulfilled", "shipped", "captured", "paid", "completed"]

const pendingStatuses = [
  "awaiting",
  "authorized",
  "requires_action",
  "partially_captured",
  "partially_delivered",
  "partially_fulfilled",
  "partially_refunded",
  "partially_shipped",
  "partially_returned",
  "returned",
  "refunded",
]

export const formatOrderStatus = (status?: string | null) => {
  if (!status) {
    return "Chưa ghi nhận"
  }

  const labels: Record<string, string> = {
    pending: "Đang xử lý",
    completed: "Hoàn tất",
    canceled: "Đã huỷ",
    canceled_by_customer: "Khách đã huỷ",
    archived: "Đã lưu trữ",
    requires_action: "Cần xác nhận",
    not_paid: "Chưa thanh toán",
    awaiting: "Đang chờ",
    authorized: "Đã chấp nhận",
    captured: "Đã thu tiền",
    paid: "Đã thanh toán",
    refunded: "Đã hoàn tiền",
    partially_captured: "Đã thu một phần",
    partially_refunded: "Đã hoàn một phần",
    not_fulfilled: "Chưa chuẩn bị hàng",
    fulfilled: "Đã chuẩn bị hàng",
    partially_fulfilled: "Đã chuẩn bị một phần",
    shipped: "Đang giao",
    partially_shipped: "Đã gửi một phần",
    delivered: "Đã giao",
    partially_delivered: "Đã giao một phần",
    returned: "Đã trả hàng",
    partially_returned: "Đã trả một phần",
    failed: "Thất bại",
    unpaid: "Chưa thanh toán",
  }
  return labels[status] ?? "Đang cập nhật"
}

export const orderStatusTone = (status?: string | null): OrderStatusTone => {
  if (!status) {
    return "neutral"
  }

  if (status === "canceled" || status === "canceled_by_customer") {
    return "danger"
  }

  if (successStatuses.includes(status)) {
    return "success"
  }

  if (pendingStatuses.includes(status)) {
    return "warning"
  }

  return "neutral"
}

/**
 * Distinct delivery and payment status chips. Fulfilment and payment are
 * independent, so they are never merged into one "order status".
 */
const OrderStatusBadge = ({
  label,
  status,
  statusTestId,
}: {
  label: string
  status?: string | null
  statusTestId?: string
}) => {
  return (
    <Badge tone={orderStatusTone(status)}>
      {label}: <span data-testid={statusTestId}>{formatOrderStatus(status)}</span>
    </Badge>
  )
}

export default OrderStatusBadge
