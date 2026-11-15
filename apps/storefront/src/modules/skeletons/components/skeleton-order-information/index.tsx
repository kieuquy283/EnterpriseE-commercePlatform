import SkeletonCartTotals from "@modules/skeletons/components/skeleton-cart-totals"

const SkeletonOrderInformation = () => {
  return (
    <div aria-hidden="true">
      <div className="grid grid-cols-1 gap-8 border-b border-line py-10 lg:grid-cols-2">
        <div className="flex flex-col">
          <div className="dm-skeleton mb-4 h-4 w-32" />
          <div className="dm-skeleton h-3 w-2/6" />
          <div className="dm-skeleton my-2 h-3 w-3/6" />
          <div className="dm-skeleton h-3 w-1/6" />
        </div>
        <div className="flex flex-col">
          <div className="dm-skeleton mb-4 h-4 w-32" />
          <div className="dm-skeleton h-3 w-2/6" />
          <div className="dm-skeleton my-2 h-3 w-3/6" />
          <div className="dm-skeleton h-3 w-2/6" />
          <div className="dm-skeleton mt-2 h-3 w-1/6" />
          <div className="dm-skeleton my-4 h-4 w-32" />
          <div className="dm-skeleton h-3 w-1/6" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 py-10 lg:grid-cols-2">
        <div className="flex flex-col">
          <div className="dm-skeleton mb-4 h-4 w-32" />
          <div className="dm-skeleton h-3 w-2/6" />
          <div className="dm-skeleton my-4 h-3 w-3/6" />
        </div>

        <SkeletonCartTotals />
      </div>
    </div>
  )
}

export default SkeletonOrderInformation
