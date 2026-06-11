'use client'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface Props {
  percent: number
  /** i18n key suffixes under panditDash.profile.fields.* for the missing items. */
  missing: string[]
}

export function ProfileCompletion({ percent, missing }: Props) {
  const { t } = useTranslation()

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-neutral-500">{t('panditDash.profile.completeness')}</p>
        <span className={cn('text-sm font-medium', percent === 100 ? 'text-green-700' : 'text-neutral-900')}>
          {percent}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={cn('h-full rounded-full transition-all', percent === 100 ? 'bg-green-500' : 'bg-orange-500')}
          style={{ width: `${percent}%` }}
        />
      </div>
      {missing.length > 0 && (
        <p className="mt-2 text-xs text-neutral-400">
          {t('panditDash.profile.missingPrefix')}{' '}
          {missing.map((k) => t(`panditDash.profile.fields.${k}`)).join(' · ')}
        </p>
      )}
    </div>
  )
}
