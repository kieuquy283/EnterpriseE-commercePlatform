const SkeletonOrderItems = () => {
  return (
    <div className="flex flex-col gap-y-6 border-y border-line py-10" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <div key={index} className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-5">
          <div className="dm-skeleton aspect-[3/4] w-full" />
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-y-2">
              <div className="dm-skeleton h-4 w-48" />
              <div className="dm-skeleton h-3 w-24" />
              <div className="dm-skeleton h-3 w-32" />
            </div>
            <div className="dm-skeleton h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default SkeletonOrderItems
