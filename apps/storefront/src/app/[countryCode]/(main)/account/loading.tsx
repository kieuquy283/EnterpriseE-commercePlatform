export default function Loading() {
  return (
    <div className="dm-section" aria-busy="true">
      <div className="content-container">
        <div className="grid grid-cols-1 gap-x-16 gap-y-8 small:grid-cols-[200px_minmax(0,1fr)]">
          <div className="hidden flex-col gap-y-3 small:flex">
            <div className="dm-skeleton h-3 w-16" />
            <div className="dm-skeleton h-4 w-24" />
            <div className="dm-skeleton h-4 w-20" />
            <div className="dm-skeleton h-4 w-24" />
            <div className="dm-skeleton h-4 w-20" />
          </div>
          <div className="flex flex-col gap-y-4">
            <div className="dm-skeleton h-3 w-16" />
            <div className="dm-skeleton h-8 w-64 max-w-full" />
            <div className="dm-skeleton h-4 w-80 max-w-full" />
            <div className="dm-skeleton mt-6 h-40 w-full" />
            <div className="dm-skeleton h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
