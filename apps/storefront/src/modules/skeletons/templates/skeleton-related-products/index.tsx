import repeat from "@lib/util/repeat"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

const SkeletonRelatedProducts = () => {
  return (
    <div className="dm-section" aria-busy="true">
      <div className="mb-10 flex flex-col gap-4">
        <div className="dm-skeleton h-3 w-20" />
        <div className="dm-skeleton h-8 w-72 max-w-full" />
      </div>
      <ul className="grid flex-1 grid-cols-2 gap-x-6 gap-y-10 small:grid-cols-3 medium:grid-cols-4">
        {repeat(3).map((index) => (
          <li key={index}>
            <SkeletonProductPreview />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SkeletonRelatedProducts
