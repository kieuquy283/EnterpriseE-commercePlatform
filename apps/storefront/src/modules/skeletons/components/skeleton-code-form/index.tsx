const SkeletonCodeForm = () => {
  return (
    <div className="flex w-full flex-col" aria-hidden="true">
      <div className="dm-skeleton mb-3 h-3 w-28" />
      <div className="grid grid-cols-[1fr_88px] gap-x-2">
        <div className="dm-skeleton h-11" />
        <div className="dm-skeleton h-11" />
      </div>
    </div>
  )
}

export default SkeletonCodeForm
