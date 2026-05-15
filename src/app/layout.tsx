import type { Metadata } from 'next'

import StoreProvider from '@/providers/store'

import GlobalProvider from './global-provider'

import '@/assets/globals.css'

export const metadata: Metadata = {
  title: 'MobiXpert',
  description: 'iOS utility toolkit'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-Hant">
      <body>
        <StoreProvider>
          <GlobalProvider>{children}</GlobalProvider>
        </StoreProvider>
      </body>
    </html>
  )
}
