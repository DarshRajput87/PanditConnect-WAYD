'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Check, Calendar, MapPin, Receipt, User, CreditCard } from 'lucide-react'
import { dateLocaleOf, formatINR } from '@/components/pandit/format'
import type { BookingConfirmedDTO } from '@/types/dashboard'

export function BookingConfirmedSection({ booking }: { booking: BookingConfirmedDTO }) {
  const { t, i18n } = useTranslation()
  const locale = dateLocaleOf(i18n.language)

  const scheduled = new Date(booking.scheduledAt).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })

  const methodLabel =
    booking.paymentMethod === 'razorpay'
      ? t('bookingConfirmed.methodRazorpay')
      : t('bookingConfirmed.methodCash')

  return (
    <div className="min-h-[70vh] bg-neutral-50">
      <div className="mx-auto w-full max-w-xl space-y-4 p-4 py-8 md:p-6 md:py-10">
        {/* Success header */}
        <div className="text-center">
          <span className="relative mx-auto flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-green-200 opacity-75 [animation-iteration-count:1]" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white">
              <Check className="h-8 w-8" strokeWidth={3} />
            </span>
          </span>
          <h1 className="mt-4 text-xl font-semibold text-neutral-900">{t('bookingConfirmed.title')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('bookingConfirmed.subtitle')}</p>
        </div>

        {/* Summary */}
        <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 text-sm">
          <Row icon={User} label={t('bookingConfirmed.pandit')} value={booking.panditName} />
          <Row icon={Receipt} label={t('bookingWizard.steps.service')} value={booking.poojaName} />
          <Row icon={Calendar} label={t('bookingWizard.dateTime')} value={scheduled} />
          <Row
            icon={MapPin}
            label={t('bookingWizard.addressLabel')}
            value={`${booking.address.line1}, ${booking.address.city}, ${booking.address.state} – ${booking.address.pincode}`}
          />
          <Row
            icon={CreditCard}
            label={t('bookingWizard.paymentMethod')}
            value={`${formatINR(booking.price)} · ${methodLabel}`}
          />
        </div>

        {/* What happens next */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
          <h2 className="text-sm font-medium text-neutral-900">{t('bookingConfirmed.whatNext')}</h2>
          <ol className="mt-3 space-y-2.5">
            {[1, 2, 3].map((n) => (
              <li key={n} className="flex gap-2.5 text-sm text-neutral-600">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-medium text-blue-700">
                  {n}
                </span>
                {t(`bookingConfirmed.step${n}`)}
              </li>
            ))}
          </ol>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/dashboard/customer/bookings/${booking._id}`}
            className="flex-1 rounded-lg bg-orange-500 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-600"
          >
            {t('bookingConfirmed.viewBooking')}
          </Link>
          <Link
            href="/"
            className="flex-1 rounded-lg border border-neutral-200 bg-white py-2.5 text-center text-sm text-neutral-700 hover:bg-neutral-50"
          >
            {t('bookingConfirmed.backHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
      <div className="min-w-0">
        <p className="mb-0.5 text-xs text-neutral-400">{label}</p>
        <p className="text-neutral-900">{value}</p>
      </div>
    </div>
  )
}
