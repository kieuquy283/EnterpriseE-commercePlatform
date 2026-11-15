import { Alert } from "@modules/common/components/ui"
import { cookies as nextCookies } from "next/headers"

/**
 * Admin onboarding helper for a freshly created demo product. It renders only
 * when the storefront onboarding cookie is present, so a normal customer never
 * sees it.
 */
async function ProductOnboardingCta() {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  if (!isOnboarding) {
    return null
  }

  return (
    <Alert tone="info" className="mb-6" title="Sản phẩm thử đã được tạo">
      <p className="text-dm-small">
        Sản phẩm thử cần được bổ sung hình ảnh, tồn kho và giá trong trang quản trị trước khi xuất
        bản.
      </p>
      <a
        href="http://localhost:7001/a/orders?onboarding_step=create_order_nextjs"
        className="dm-link mt-2 inline-block text-dm-caption"
      >
        Tiếp tục trong trang quản trị
      </a>
    </Alert>
  )
}

export default ProductOnboardingCta
