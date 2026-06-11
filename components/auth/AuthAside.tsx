'use client'
import Link from 'next/link'
import { Flame, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function AuthAside() {
  const { t } = useTranslation()
  return (
    <aside className="hidden w-1/2 flex-col justify-between bg-orange-500 p-12 text-white lg:flex">
      <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15">
          <Flame className="h-5 w-5 text-white" />
        </span>
        PanditConnect
      </Link>

      <p className="max-w-md text-2xl font-semibold leading-snug">{t('auth.joinHeadline')}</p>

      <div className="inline-flex items-center gap-2 text-sm text-orange-50">
        <ShieldCheck className="h-4 w-4" />
        {t('auth.secureBadge')}
      </div>
    </aside>
  )
}
