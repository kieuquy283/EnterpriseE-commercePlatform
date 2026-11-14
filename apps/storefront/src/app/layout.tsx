import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "DAYMARK",
  description: "Made for the everyday. Versatile clothing for life in the city.",
  icons: { icon: "/brand/daymark-swallow.svg", apple: "/brand/daymark-swallow.png" },
  openGraph: { siteName: "DAYMARK", images: [{ url: "/brand/daymark-swallow.png", alt: "DAYMARK swallow" }] },
  twitter: { card: "summary", images: ["/brand/daymark-swallow.png"] },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
