'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { cancelBooking } from '@/actions/booking'
import { dateLocaleOf, formatINR } from '@/components/pandit/format'
import { cn } from '@/lib/utils'
import type { CustomerBookingDTO } from '@/types/dashboard'

const STATUS_CLASSES: Record<string, string> = {
  requested: 'bg-amber-50 text-amber-800 border-amber-200',
  confirmed: 'bg-green-50 text-green-800 border-green-200',
  declined: 'bg-red-50 text-red-800 border-red-200',
  expired: 'bg-neutral-50 text-neutral-600 border-neutral-200',
  cancelled: 'bg-neutral-50 text-neutral-600 border-neutral-200',
  completed: 'bg-blue-50 text-blue-800 border-blue-200',
}

interface Props {
  booking: CustomerBookingDTO
  compact?: boolean
}

export function BookingCard({ booking, compact }: Props) {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const [isPending, startTransition] = useTransition()
  const [showCancel, setShowCancel] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const initials = booking.panditName
    .split(' ')
    .filter((w) => !['Pt.', 'Pandit'].includes(w))
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const date = new Date(booking.scheduledAt).toLocaleDateString(dateLocaleOf(i18n.language), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(compact ? {} : { hour: '2-digit' as const, minute: '2-digit' as const }),
    timeZone: 'Asia/Kolkata',
  })

  function cancel() {
    if (reason.trim().length < 5) return
    setError('')
    startTransition(async () => {
      const result = await cancelBooking(booking._id, reason)
      if ('error' in result) setError(t(`panditDash.errors.${result.error.code}`))
      else router.refresh()
    })
  }

  const canCancel = booking.status === 'requested' || booking.status === 'confirmed'

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        {/* Pandit initials */}
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-xs font-medium text-orange-700">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/dashboard/customer/bookings/${booking._id}`}
              className="text-sm font-medium text-neutral-900 hover:underline"
            >
              {booking.poojaName}
            </Link>
            <span
              className={cn(
                'flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                STATUS_CLASSES[booking.status] ?? STATUS_CLASSES.expired
              )}
            >
              {t(`customerDash.status.${booking.status}`)}
            </span>
          </div>

          <p className="mt-0.5 text-xs text-neutral-500">
            {booking.panditName}
            <span className="mx-1.5 text-neutral-300">·</span>
            {date}
          </p>

          {!compact && <p className="mt-0.5 text-xs text-neutral-500">{formatINR(booking.price)}</p>}

          {/* Actions per status */}
          <div className="mt-2 flex flex-wrap gap-2">
            {booking.status === 'confirmed' && (
              <Link
                href={`/dashboard/customer/bookings/${booking._id}`}
                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                {t('customerDash.booking.viewDetails')}
              </Link>
            )}

            {canCancel && !showCancel && (
              <button
                onClick={() => setShowCancel(true)}
                className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
              >
                {t('customerDash.booking.cancel')}
              </button>
            )}

            {booking.status === 'completed' && !booking.hasReview && (
              <Link
                href={`/dashboard/customer/bookings/${booking._id}/review`}
                className="inline-flex items-center gap-1 rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600"
              >
                <Star className="h-3 w-3" />
                {t('customerDash.booking.writeReview')}
              </Link>
            )}

            {booking.status === 'completed' && booking.hasReview && (
              <Link
                href={`/dashboard/customer/bookings/${booking._id}`}
                className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
              >
                {t('customerDash.booking.viewDetails')}
              </Link>
            )}

            {(booking.status === 'expired' || booking.status === 'declined') && (
              <Link
                href="/dashboard/customer/search"
                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                {t('customerDash.booking.rebook')}
              </Link>
            )}
          </div>

          {/* Cancel reason input */}
          {showCancel && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('customerDash.booking.cancelReasonPlaceholder')}
                maxLength={200}
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={cancel}
                  disabled={isPending || reason.trim().length < 5}
                  className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-40"
                >
                  {isPending ? t('customerDash.booking.cancelling') : t('customerDash.booking.confirmCancel')}
                </button>
                <button
                  onClick={() => {
                    setShowCancel(false)
                    setReason('')
                  }}
                  className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
                >
                  {t('customerDash.booking.back')}
                </button>
              </div>
            </div>
          )}

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  )
}
