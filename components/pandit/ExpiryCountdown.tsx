'use client'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const { t } = useTranslation()
  // null until mounted — the server can't know "now", so render nothing on first paint
  // to avoid a hydration mismatch.
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    function tick() {
      setRemaining(Math.max(0, new Date(expiresAt).getTime() - Date.now()))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  if (remaining === null) return null

  if (remaining === 0) {
    return (
      <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-500">
        <Clock className="h-3 w-3" />
        {t('panditDash.inquiry.expired')}
      </span>
    )
  }

  const totalMin = Math.floor(remaining / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  const urgent = remaining < 30 * 60000 // < 30 min

  return (
    <span
      className={cn(
        'mt-1.5 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
        urgent
          ? 'border border-red-200 bg-red-50 text-red-700'
          : 'border border-amber-200 bg-amber-50 text-amber-700'
      )}
    >
      <Clock className="h-3 w-3" />
      {t('panditDash.inquiry.expiresIn', { time: h > 0 ? `${h}h ${m}m` : `${m}m` })}
    </span>
  )
}
