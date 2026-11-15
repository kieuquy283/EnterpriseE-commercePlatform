export default function Loading() {
  return (
    <div className="content-container dm-section" role="status" aria-live="polite">
      <span className="sr-only">Đang tải nội dung</span>
      <div className="dm-skeleton h-12 w-3/4 max-w-xl" />
      <div className="mt-10 grid grid-cols-2 gap-5 small:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="dm-skeleton aspect-[3/4]" />
        ))}
      </div>
    </div>
  )
}
