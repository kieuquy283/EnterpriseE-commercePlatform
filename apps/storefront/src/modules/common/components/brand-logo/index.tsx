import Image from "next/image"

export default function BrandLogo() {
  return (
    <span className="inline-flex items-center gap-2" aria-label="DAYMARK">
      <Image
        src="/brand/daymark-swallow.svg"
        alt=""
        width={30}
        height={28}
        unoptimized
        aria-hidden="true"
      />
      <span className="font-semibold tracking-widest">DAYMARK</span>
    </span>
  )
}
