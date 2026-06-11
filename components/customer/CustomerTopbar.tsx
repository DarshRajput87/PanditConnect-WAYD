'use client'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'

const SECTIONS = ['overview', 'bookings', 'search', 'reviews', 'settings'] as const

export function CustomerTopbar({ name }: { name: string }) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const section = SECTIONS.find((s) => pathname.startsWith(`/dashboard/customer/${s}`))
  const title = section ? t(`customerDash.nav.${section}`) : t('customerDash.topbar.dashboard')
  const sub = section ? t(`customerDash.topbar.${section}Sub`) : ''
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 md:px-6">
      <div className="min-w-0">
        <h1 className="text-sm font-medium text-neutral-900">{title}</h1>
        {sub && <p className="truncate text-xs text-neutral-500">{sub}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
          aria-label={t('customerDash.topbar.notifications')}
        >
          <Bell className="h-3.5 w-3.5" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-xs font-medium text-blue-700">
          {initials}
        </div>
      </div>
    </header>
  )
}
