import repeat from "@lib/util/repeat"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

const SkeletonProductGrid = ({ numberOfProducts = 8 }: { numberOfProducts?: number }) => {
  return (
    <ul
      className="grid flex-1 grid-cols-2 gap-x-6 gap-y-10 small:grid-cols-4"
      data-testid="products-list-loader"
      aria-busy="true"
    >
      {repeat(numberOfProducts).map((index) => (
        <li key={index}>
          <SkeletonProductPreview />
        </li>
      ))}
    </ul>
  )
}

export default SkeletonProductGrid
