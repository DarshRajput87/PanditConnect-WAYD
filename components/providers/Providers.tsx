'use client'
import { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { I18nProvider } from './I18nProvider'
import { ToastProvider } from '@/components/shared/Toast'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <I18nProvider>
        <ToastProvider>{children}</ToastProvider>
      </I18nProvider>
    </SessionProvider>
  )
}
