'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Calendar, MapPin, Receipt, Star, User } from 'lucide-react'
import { BookingTimeline } from './BookingTimeline'
import { dateLocaleOf, formatINR } from '@/components/pandit/format'
import { cn } from '@/lib/utils'
import type { CustomerBookingDetailDTO } from '@/types/dashboard'

const STATUS_CLASSES: Record<string, string> = {
  requested: 'bg-amber-50 text-amber-800 border-amber-200',
  confirmed: 'bg-green-50 text-green-800 border-green-200',
  declined: 'bg-red-50 text-red-800 border-red-200',
  expired: 'bg-neutral-50 text-neutral-600 border-neutral-200',
  cancelled: 'bg-neutral-50 text-neutral-600 border-neutral-200',
  completed: 'bg-blue-50 text-blue-800 border-blue-200',
}

export function CustomerBookingDetailSection({ booking }: { booking: CustomerBookingDetailDTO }) {
  const { t, i18n } = useTranslation()
  const locale = dateLocaleOf(i18n.language)

  const initials = booking.panditName
    .split(' ')
    .filter((w) => !['Pt.', 'Pandit'].includes(w))
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const scheduled = new Date(booking.scheduledAt).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })

  return (
    <div className="w-full space-y-4 p-4 pb-24 md:p-6 md:pb-6">
      <Link
        href="/dashboard/customer/bookings"
        className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {t('customerDash.detail.back')}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium text-neutral-900">{booking.poojaName}</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {t('customerDash.detail.bookingNo', { id: booking._id.slice(-8).toUpperCase() })}
          </p>
        </div>
        <span
          className={cn(
            'flex-shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium',
            STATUS_CLASSES[booking.status] ?? STATUS_CLASSES.expired
          )}
        >
          {t(`customerDash.status.${booking.status}`)}
        </span>
      </div>

      {/* Status timeline */}
      <BookingTimeline
        status={booking.status}
        hasReview={booking.hasReview}
        timestamps={booking.timestamps}
        cancelledAt={booking.cancellation?.at ?? null}
      />

      {/* Booking info card */}
      <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-sm font-medium text-orange-700">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-900">{booking.panditName}</p>
            <p className="text-xs text-neutral-500">
              {booking.sampraday ? `${booking.sampraday} · ` : ''}
              {t('customerDash.detail.yearsExp', { count: booking.experienceYears })}
            </p>
          </div>
          <Link href={`/pandit/${booking.panditId}`} className="ml-auto flex-shrink-0 text-xs text-blue-600 hover:underline">
            {t('customerDash.detail.viewProfile')}
          </Link>
        </div>

        <Row icon={Calendar} label={t('customerDash.detail.dateTime')} value={scheduled} />
        <Row
          icon={MapPin}
          label={t('customerDash.detail.address')}
          value={`${booking.address.line1}, ${booking.address.city}, ${booking.address.state} – ${booking.address.pincode}`}
        />
        <Row icon={Receipt} label={t('customerDash.detail.amount')} value={formatINR(booking.price)} />
      </div>

      {/* Cancellation info */}
      {booking.cancellation && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
          <p className="mb-1 font-medium text-neutral-700">{t('customerDash.detail.cancellationDetails')}</p>
          <p className="text-neutral-500">
            {t('customerDash.detail.reason')}: {booking.cancellation.reason}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {t(
              booking.cancellation.byRole === 'you'
                ? 'customerDash.detail.cancelledByYou'
                : 'customerDash.detail.cancelledByPandit',
              {
                date: new Date(booking.cancellation.at).toLocaleDateString(locale),
              }
            )}
          </p>
        </div>
      )}

      {/* Review CTA */}
      {booking.status === 'completed' && !booking.hasReview && (
        <Link
          href={`/dashboard/customer/bookings/${booking._id}/review`}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 text-sm font-medium text-white hover:bg-orange-600"
        >
          <Star className="h-4 w-4" />
          {t('customerDash.detail.writeReview')}
        </Link>
      )}

      {booking.status === 'completed' && booking.hasReview && (
        <Link
          href="/dashboard/customer/reviews"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          <User className="h-4 w-4 text-neutral-400" />
          {t('customerDash.detail.seeYourReview')}
        </Link>
      )}
    </div>
  )
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
      <div className="min-w-0">
        <p className="mb-0.5 text-xs text-neutral-400">{label}</p>
        <p className="text-neutral-900">{value}</p>
      </div>
    </div>
  )
}
