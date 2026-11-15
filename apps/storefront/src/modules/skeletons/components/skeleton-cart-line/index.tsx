const SkeletonCartLine = () => {
  return (
    <div
      className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-x-5 gap-y-4 border-b border-line py-6 first:pt-0 last:border-b-0 small:grid-cols-[96px_minmax(0,1fr)_11rem_7rem] small:gap-x-6"
      aria-hidden="true"
    >
      <div className="dm-skeleton aspect-[3/4] w-full" />
      <div className="flex min-w-0 flex-col gap-y-2">
        <div className="dm-skeleton h-4 w-40" />
        <div className="dm-skeleton h-3 w-24" />
      </div>
      <div className="col-span-2 flex items-center gap-4 small:col-span-1">
        <div className="dm-skeleton h-12 w-20" />
        <div className="dm-skeleton h-3 w-16" />
      </div>
      <div className="col-span-2 flex justify-end small:col-span-1">
        <div className="dm-skeleton h-4 w-16" />
      </div>
    </div>
  )
}

export default SkeletonCartLine
