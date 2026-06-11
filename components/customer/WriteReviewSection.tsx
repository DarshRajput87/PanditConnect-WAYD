'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'
import { WriteReviewForm } from './WriteReviewForm'
import { dateLocaleOf } from '@/components/pandit/format'
import type { BookingForReviewDTO } from '@/types/dashboard'

export function WriteReviewSection({ booking }: { booking: BookingForReviewDTO }) {
  const { t, i18n } = useTranslation()
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
  })

  return (
    <div className="w-full space-y-4 p-4 pb-24 md:p-6 md:pb-6">
      <Link
        href={`/dashboard/customer/bookings/${booking._id}`}
        className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {t('customerDash.review.backToBooking')}
      </Link>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        {/* Context */}
        <div className="mb-4 flex items-center gap-3 border-b border-neutral-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-sm font-medium text-orange-700">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-900">{booking.panditName}</p>
            <p className="text-xs text-neutral-500">
              {booking.poojaName} · {date}
            </p>
          </div>
        </div>

        <WriteReviewForm bookingId={booking._id} />
      </div>
    </div>
  )
}
