import type { ReactNode } from "react"

const paths = {
  play: <path d="m8 5 12 7-12 7z" />,
  pause: <><path d="M8 5v14M16 5v14" /></>,
  library: <><rect x="4" y="5" width="16" height="14" rx="1" /><path d="M8 9h8M8 13h8" /></>,
  prev: <path d="M15 5l-7 7 7 7" />,
  next: <path d="M9 5l7 7-7 7" />,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof paths

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  )
}
