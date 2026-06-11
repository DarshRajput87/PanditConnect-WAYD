import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/Providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PanditConnect — Book Trusted Pandit Ji Online',
  description:
    'Find and book verified Pandits for poojas, sanskars and ceremonies. Transparent pricing, clear samagri lists, real reviews.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-white font-sans text-neutral-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
