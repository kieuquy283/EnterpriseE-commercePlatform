const SkeletonCartTotals = ({ header = true }: { header?: boolean }) => {
  return (
    <div className="flex flex-col" aria-hidden="true">
      {header && <div className="dm-skeleton mb-5 h-4 w-32" />}
      <div className="flex items-center justify-between py-2">
        <div className="dm-skeleton h-3 w-32" />
        <div className="dm-skeleton h-3 w-16" />
      </div>

      <div className="flex items-center justify-between py-2">
        <div className="dm-skeleton h-3 w-24" />
        <div className="dm-skeleton h-3 w-16" />
      </div>

      <div className="flex items-center justify-between py-2">
        <div className="dm-skeleton h-3 w-28" />
        <div className="dm-skeleton h-3 w-16" />
      </div>

      <div className="dm-divider my-4" />

      <div className="flex items-center justify-between">
        <div className="dm-skeleton h-5 w-24" />
        <div className="dm-skeleton h-5 w-24" />
      </div>
    </div>
  )
}

export default SkeletonCartTotals
