import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LangProvider } from '@/lib/lang-context'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'AzTest — Test Hazırlıq Platforması',
  description: 'MİQ, Blok, Buraxılış və Dövlət Qulluğu sınaqları üçün online hazırlıq platforması',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="az">
      <body className={inter.className}>
        <LangProvider>
          {children}
        </LangProvider>
      </body>
    </html>
  )
}
