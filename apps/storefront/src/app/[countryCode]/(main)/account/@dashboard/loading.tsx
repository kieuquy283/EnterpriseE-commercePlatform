export default function Loading() {
  return (
    <div className="flex w-full flex-col gap-y-6" aria-busy="true">
      <div className="flex flex-col gap-y-3">
        <div className="dm-skeleton h-3 w-20" />
        <div className="dm-skeleton h-8 w-64 max-w-full" />
        <div className="dm-skeleton h-4 w-80 max-w-full" />
      </div>
      <div className="dm-skeleton h-40 w-full" />
      <div className="dm-skeleton h-24 w-full" />
    </div>
  )
}
