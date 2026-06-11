'use client'
import { useTranslation } from 'react-i18next'

export function LoadError() {
  const { t } = useTranslation()
  return <div className="p-6 text-sm text-red-600">{t('panditDash.loadError')}</div>
}
