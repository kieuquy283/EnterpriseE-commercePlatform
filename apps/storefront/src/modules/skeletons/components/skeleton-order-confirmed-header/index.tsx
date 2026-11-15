const SkeletonOrderConfirmedHeader = () => {
  return (
    <div className="flex flex-col gap-y-3 pb-10" aria-hidden="true">
      <div className="dm-skeleton h-3 w-2/5" />
      <div className="dm-skeleton h-7 w-3/6" />
      <div className="flex gap-x-4">
        <div className="dm-skeleton h-3 w-16" />
        <div className="dm-skeleton h-3 w-12" />
      </div>
    </div>
  )
}

export default SkeletonOrderConfirmedHeader
