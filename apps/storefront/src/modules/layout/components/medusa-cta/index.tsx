import Medusa from "../../../common/icons/medusa"
import NextJs from "../../../common/icons/nextjs"

/**
 * Quiet platform attribution. Kept as small monochrome marks so it reads as a
 * footnote rather than competing with the DAYMARK identity.
 */
const MedusaCTA = () => {
  return (
    <span className="inline-flex items-center gap-2 text-dm-micro uppercase text-ink-faint">
      <span style={{ letterSpacing: "0.1em" }}>Vận hành bằng</span>
      <a
        href="https://www.medusajs.com"
        target="_blank"
        rel="noreferrer"
        aria-label="Medusa"
        className="transition-opacity hover:opacity-70"
      >
        <Medusa className="fill-ink-faint" />
      </a>
      <span aria-hidden="true">&</span>
      <a
        href="https://nextjs.org"
        target="_blank"
        rel="noreferrer"
        aria-label="Next.js"
        className="transition-opacity hover:opacity-70"
      >
        <NextJs className="fill-ink-faint" />
      </a>
    </span>
  )
}

export default MedusaCTA
