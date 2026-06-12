import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { PageTransition } from '@/components/shared/PageTransition'
import { APP_URL } from '@/lib/app-url'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PanditConnect — Book Trusted Pandit Ji Online',
  description:
    'Find and book verified Pandits for poojas, sanskars and ceremonies. Transparent pricing, clear samagri lists, real reviews.',
  metadataBase: new URL(APP_URL),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Warm up the image CDNs before the first <Image> request */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className="min-h-screen bg-white font-sans text-neutral-900">
        <Providers>
          <PageTransition>{children}</PageTransition>
        </Providers>
      </body>
    </html>
  )
}
