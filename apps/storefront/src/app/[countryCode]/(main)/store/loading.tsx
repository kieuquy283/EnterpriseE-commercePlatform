export default function StoreLoading() {
  return (
    <div
      className="content-container py-10 small:py-14"
      aria-busy="true"
      aria-label="Đang tải sản phẩm"
    >
      <div className="h-10 w-64 animate-pulse bg-surface" />
      <div className="mt-8 h-12 max-w-xl animate-pulse bg-surface" />
      <div
        className="mt-16 grid grid-cols-2 gap-x-4 gap-y-10 small:grid-cols-3 small:gap-x-6"
        data-testid="products-list-loader"
      >
        {Array.from({ length: 12 }, (_, index) => (
          <div key={index} className="animate-pulse">
            <div className="aspect-[3/4] bg-surface" />
            <div className="mt-3 h-4 w-3/4 bg-surface" />
            <div className="mt-2 h-4 w-1/3 bg-surface" />
          </div>
        ))}
      </div>
    </div>
  )
}
