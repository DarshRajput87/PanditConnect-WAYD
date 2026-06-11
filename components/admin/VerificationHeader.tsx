'use client'
import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'

export function VerificationHeader({ count }: { count: number }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-orange-500">
        <ShieldCheck className="h-5 w-5" />
      </span>
      <div>
        <h1 className="text-xl font-bold text-neutral-900">{t('admin.verificationQueue')}</h1>
        <p className="text-sm text-neutral-500">
          {count} {t('admin.pendingCount')}
        </p>
      </div>
    </div>
  )
}
