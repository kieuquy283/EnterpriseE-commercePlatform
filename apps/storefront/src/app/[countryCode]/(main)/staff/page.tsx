import { lookupStaffOrder, retrieveStaffOrder, staffLogin, staffLogout } from "@lib/data/staff"
import { Button, Input } from "@modules/common/components/ui"

export default async function StaffPage({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ order?: string; error?: string }>
}) {
  const { countryCode } = await params
  const query = await searchParams
  const result = await retrieveStaffOrder(query.order)
  const statuses: Record<string, string> = {
    pending: "Đang xử lý",
    completed: "Hoàn tất",
    canceled: "Đã hủy",
    archived: "Đã lưu trữ",
    requires_action: "Cần xử lý",
    draft: "Bản nháp",
  }
  return (
    <section className="content-container py-16" data-testid="staff-page">
      <h1 className="dm-title">Đơn hàng được giao</h1>
      <p className="dm-body mt-3 mb-8">
        Khu vực nhân viên DAYMARK. Tra cứu đơn hàng trong phạm vi được phân công.
      </p>
      {!result.signedIn ? (
        <form action={staffLogin.bind(null, countryCode)} className="max-w-md space-y-4">
          <Input
            label="Email nhân viên"
            name="email"
            type="email"
            autoComplete="username"
            required
          />
          <Input
            label="Mật khẩu"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <Button type="submit">Đăng nhập nhân viên</Button>
          {query.error && <p role="alert">Không thể đăng nhập bằng tài khoản này.</p>}
        </form>
      ) : (
        <div className="space-y-6">
          <form action={lookupStaffOrder.bind(null, countryCode)} className="max-w-md space-y-4">
            <Input label="Mã đơn hàng" name="order_id" required />
            <Button type="submit">Tra cứu đơn được giao</Button>
          </form>
          {(result.error || query.error) && <p role="alert">Không tìm thấy đơn hàng được giao.</p>}
          {result.order && (
            <article data-testid="staff-order">
              <h2 className="dm-heading">Đơn #{result.order.display_id}</h2>
              <p>Trạng thái: {statuses[result.order.status] || "Chưa xác định"}</p>
              <ul>
                {result.order.items.map((item) => (
                  <li key={item.id}>
                    {item.title} × {item.quantity}
                  </li>
                ))}
              </ul>
            </article>
          )}
          <form action={staffLogout.bind(null, countryCode)}>
            <Button type="submit" variant="secondary">
              Đăng xuất nhân viên
            </Button>
          </form>
        </div>
      )}
    </section>
  )
}
