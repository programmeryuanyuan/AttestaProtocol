import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ArbiterEscrow",
  description: "The first agent-to-agent settlement where the arbiter sees nothing, yet proves everything.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
