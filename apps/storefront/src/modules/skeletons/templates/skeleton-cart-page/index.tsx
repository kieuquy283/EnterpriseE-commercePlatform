import { Table } from "@modules/common/components/ui"

import repeat from "@lib/util/repeat"
import SkeletonCartItem from "@modules/skeletons/components/skeleton-cart-item"
import SkeletonCodeForm from "@modules/skeletons/components/skeleton-code-form"
import SkeletonOrderSummary from "@modules/skeletons/components/skeleton-order-summary"

const SkeletonCartPage = () => {
  return (
    <div className="dm-section">
      <div className="content-container">
        <div
          className="grid grid-cols-1 gap-x-16 gap-y-12 small:grid-cols-[minmax(0,1fr)_22rem]"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="flex flex-col gap-y-8">
            <div className="flex flex-col gap-y-3">
              <div className="dm-skeleton h-3 w-20" />
              <div className="dm-skeleton h-9 w-60" />
              <div className="dm-skeleton h-4 w-48" />
            </div>
            <Table>
              <Table.Body>
                {repeat(3).map((index) => (
                  <SkeletonCartItem key={index} />
                ))}
              </Table.Body>
            </Table>
          </div>
          <div className="flex flex-col gap-y-8">
            <div className="dm-panel p-6">
              <SkeletonOrderSummary />
            </div>
            <SkeletonCodeForm />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonCartPage
