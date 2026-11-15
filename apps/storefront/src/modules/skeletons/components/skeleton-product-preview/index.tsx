import { Container } from "@modules/common/components/ui"

const SkeletonProductPreview = () => {
  return (
    <div>
      <Container className="aspect-[3/4] w-full bg-line/60 bg-surface" />
      <div className="flex justify-between text-base-regular mt-2">
        <div className="w-2/5 h-6 bg-line/60"></div>
        <div className="w-1/5 h-6 bg-line/60"></div>
      </div>
    </div>
  )
}

export default SkeletonProductPreview
