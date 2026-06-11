'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { respondToBooking, markBookingCompleted, cancelBooking } from '@/actions/booking'
import { ExpiryCountdown } from './ExpiryCountdown'
import { dateLocaleOf, formatINR, formatDuration } from './format'
import type { BookingSummaryDTO } from '@/types/dashboard'

interface Props {
  booking: BookingSummaryDTO
  compact?: boolean
  /** Rendered inside the "upcoming confirmed" overview card — hides action buttons. */
  confirmed?: boolean
}

export function InquiryCard({ booking, compact, confirmed }: Props) {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const [isPending, startTransition] = useTransition()
  const [action, setAction] = useState<'accept' | 'decline' | 'complete' | 'cancel' | null>(null)
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [error, setError] = useState('')

  const initials = booking.customerName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  function handleResult(result: { error: { code: string } } | { success: true }) {
    if ('error' in result) setError(t(`panditDash.errors.${result.error.code}`))
    else router.refresh()
  }

  function respond(act: 'accept' | 'decline') {
    setAction(act)
    setError('')
    startTransition(async () => {
      handleResult(await respondToBooking(booking._id, act))
    })
  }

  function complete() {
    setAction('complete')
    setError('')
    startTransition(async () => {
      handleResult(await markBookingCompleted(booking._id))
    })
  }

  function cancel() {
    if (cancelReason.trim().length < 5) return
    setAction('cancel')
    setError('')
    startTransition(async () => {
      handleResult(await cancelBooking(booking._id, cancelReason))
    })
  }

  const scheduledDate = new Date(booking.scheduledAt).toLocaleDateString(dateLocaleOf(i18n.language), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-xs font-medium text-neutral-600">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <Link
            href={`/dashboard/pandit/inquiries/${booking._id}`}
            className="text-sm font-medium text-neutral-900 hover:underline"
          >
            {booking.customerName}
          </Link>
          <p className="mt-0.5 text-xs text-neutral-500">
            {booking.poojaName}
            <span className="mx-1.5 text-neutral-300">·</span>
            {scheduledDate}
          </p>

          {!compact && (
            <p className="mt-0.5 text-xs text-neutral-500">
              {booking.address.city}, {booking.address.state}
              <span className="mx-1.5 text-neutral-300">·</span>
              {formatINR(booking.price)} · {formatDuration(booking.durationMin)}
            </p>
          )}

          {/* Expiry timer — only for requested status */}
          {booking.status === 'requested' && <ExpiryCountdown expiresAt={booking.expiresAt} />}

          {/* Actions */}
          {booking.status === 'requested' && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => respond('accept')}
                disabled={isPending}
                className="rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-800 transition-colors hover:bg-green-100 disabled:opacity-50"
              >
                {isPending && action === 'accept' ? t('panditDash.inquiry.accepting') : t('panditDash.inquiry.accept')}
              </button>
              <button
                onClick={() => respond('decline')}
                disabled={isPending}
                className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50"
              >
                {isPending && action === 'decline' ? t('panditDash.inquiry.declining') : t('panditDash.inquiry.decline')}
              </button>
            </div>
          )}

          {booking.status === 'confirmed' && !confirmed && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={complete}
                disabled={isPending}
                className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800 transition-colors hover:bg-blue-100 disabled:opacity-50"
              >
                {isPending && action === 'complete' ? t('panditDash.inquiry.marking') : t('panditDash.inquiry.markComplete')}
              </button>
              {!showCancel && (
                <button
                  onClick={() => setShowCancel(true)}
                  className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
                >
                  {t('panditDash.inquiry.cancel')}
                </button>
              )}
            </div>
          )}

          {/* Cancel reason input */}
          {showCancel && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                placeholder={t('panditDash.inquiry.cancelReasonPlaceholder')}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                maxLength={200}
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={cancel}
                  disabled={isPending || cancelReason.trim().length < 5}
                  className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-40"
                >
                  {isPending && action === 'cancel' ? t('panditDash.inquiry.cancelling') : t('panditDash.inquiry.confirmCancel')}
                </button>
                <button
                  onClick={() => {
                    setShowCancel(false)
                    setCancelReason('')
                  }}
                  className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
                >
                  {t('panditDash.inquiry.back')}
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
