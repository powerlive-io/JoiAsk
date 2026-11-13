import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import type { ReactNode } from 'react'
import { Provider } from '@/components/provider'
import { siteDescription, siteName, siteURL } from '@/lib/shared'
import './global.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(siteURL),
  title: { default: siteName, template: `%s | ${siteName}` },
  description: siteDescription,
  icons: { icon: '/favicon.png', apple: '/favicon.png' }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className={inter.className} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}
