'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Clock, AlertCircle } from 'lucide-react'

export function VerificationBanner({ status }: { status: string }) {
  const { t } = useTranslation()

  if (status === 'pending') {
    return (
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 md:px-6">
        <Clock className="h-4 w-4 flex-shrink-0 text-amber-600" />
        {t('panditDash.banner.pending')}
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="flex flex-shrink-0 flex-wrap items-center gap-x-2 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 md:px-6">
        <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
        {t('panditDash.banner.rejected')}
        <Link href="/dashboard/pandit/register" className="font-medium underline">
          {t('panditDash.banner.rejectedLink')}
        </Link>
      </div>
    )
  }

  return null
}
