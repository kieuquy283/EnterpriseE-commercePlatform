import { getBaseURL } from "@lib/util/env"
import { Metadata, Viewport } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "DAYMARK — Cho mọi ngày thường",
    template: "%s — DAYMARK",
  },
  description: "Trang phục thường ngày dễ phối cho học tập, công sở và cuối tuần tại Việt Nam.",
  applicationName: "DAYMARK",
  icons: {
    icon: "/brand/daymark-swallow.svg",
    apple: "/brand/daymark-swallow.png",
  },
  openGraph: {
    siteName: "DAYMARK",
    type: "website",
    locale: "vi_VN",
    title: "DAYMARK — Cho mọi ngày thường",
    description: "Trang phục thường ngày dễ phối cho học tập, công sở và cuối tuần tại Việt Nam.",
    images: [{ url: "/brand/daymark-swallow.png", alt: "DAYMARK" }],
  },
  twitter: {
    card: "summary",
    images: ["/brand/daymark-swallow.png"],
  },
}

export const viewport: Viewport = {
  themeColor: "#FBF9F4",
  colorScheme: "light",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-mode="light">
      <body>
        <a href="#daymark-main" className="dm-skip-link">
          Đến nội dung chính
        </a>
        <div className="relative flex min-h-screen flex-col">
          <div className="flex-1">{props.children}</div>
        </div>
      </body>
    </html>
  )
}
