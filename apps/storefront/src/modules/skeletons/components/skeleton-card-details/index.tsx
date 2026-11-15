const SkeletonCardDetails = () => {
  return (
    <div
      className="my-4 flex flex-col gap-2 transition-all duration-150 ease-dm-out"
      aria-hidden="true"
    >
      <div className="dm-skeleton h-3 w-1/4" />
      <div className="dm-skeleton h-11 w-full" />
    </div>
  )
}

export default SkeletonCardDetails
