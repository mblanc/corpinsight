import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CorpInsight: Company Research Agent",
  description: "AI-powered company research and analysis tool",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-slate-50">
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}

