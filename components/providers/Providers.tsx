'use client'
import { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { I18nProvider } from './I18nProvider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <I18nProvider>{children}</I18nProvider>
    </SessionProvider>
  )
}
