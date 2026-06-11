'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Phone, Mail, MapPin } from 'lucide-react'
import { InquiryCard } from './InquiryCard'
import { dateLocaleOf, formatINR, formatDuration } from './format'
import { cn } from '@/lib/utils'
import type { BookingDetailDTO } from '@/types/dashboard'

const STATUS_TONE: Record<string, string> = {
  requested: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  declined: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  expired: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
}

export function BookingDetail({ booking }: { booking: BookingDetailDTO }) {
  const { t, i18n } = useTranslation()
  const locale = dateLocaleOf(i18n.language)
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    })

  return (
    <div className="max-w-2xl space-y-4 p-4 pb-24 md:p-6 md:pb-6">
      <Link
        href="/dashboard/pandit/inquiries"
        className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {t('panditDash.detail.backToInquiries')}
      </Link>

      {/* Summary + actions (shared card handles accept/decline/complete/cancel) */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 className="text-sm font-medium text-neutral-900">{t('panditDash.detail.title')}</h2>
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 text-[10px] font-medium',
              STATUS_TONE[booking.status] ?? STATUS_TONE.requested
            )}
          >
            {t(`panditDash.status.${booking.status}`)}
          </span>
        </div>
        <InquiryCard booking={booking} />
      </div>

      {/* Full details */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="text-sm font-medium text-neutral-900">{t('panditDash.detail.infoTitle')}</h2>
        </div>
        <dl className="divide-y divide-neutral-100 text-sm">
          <DetailRow label={t('panditDash.detail.pooja')} value={`${booking.poojaName} · ${formatINR(booking.price)} · ${formatDuration(booking.durationMin)}`} />
          <DetailRow label={t('panditDash.detail.schedule')} value={fmt(booking.scheduledAt)} />
          <DetailRow
            label={t('panditDash.detail.location')}
            value={
              <span className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-neutral-400" />
                {booking.address.line1}, {booking.address.city}, {booking.address.state} — {booking.address.pincode}
              </span>
            }
          />
          {booking.customerPhone && (
            <DetailRow
              label={t('panditDash.detail.phone')}
              value={
                <a href={`tel:${booking.customerPhone}`} className="flex items-center gap-1.5 text-orange-600 hover:underline">
                  <Phone className="h-3.5 w-3.5" />
                  {booking.customerPhone}
                </a>
              }
            />
          )}
          {booking.customerEmail && (
            <DetailRow
              label={t('panditDash.detail.email')}
              value={
                <a href={`mailto:${booking.customerEmail}`} className="flex items-center gap-1.5 text-orange-600 hover:underline">
                  <Mail className="h-3.5 w-3.5" />
                  {booking.customerEmail}
                </a>
              }
            />
          )}
          <DetailRow label={t('panditDash.detail.requestedOn')} value={fmt(booking.createdAt)} />
          {booking.respondedAt && <DetailRow label={t('panditDash.detail.respondedOn')} value={fmt(booking.respondedAt)} />}
          {booking.cancellation && (
            <DetailRow label={t('panditDash.detail.cancellationReason')} value={booking.cancellation.reason} />
          )}
        </dl>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 px-4 py-2.5">
      <dt className="w-28 flex-shrink-0 text-xs text-neutral-400">{label}</dt>
      <dd className="min-w-0 flex-1 text-neutral-700">{value}</dd>
    </div>
  )
}
