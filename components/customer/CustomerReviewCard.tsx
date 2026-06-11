'use client'
import { useTranslation } from 'react-i18next'
import { dateLocaleOf } from '@/components/pandit/format'
import type { CustomerReviewDTO } from '@/types/dashboard'

export function CustomerReviewCard({ review }: { review: CustomerReviewDTO }) {
  const { t, i18n } = useTranslation()

  const stars = '★'.repeat(review.overall) + '☆'.repeat(5 - review.overall)
  const date = new Date(review.createdAt).toLocaleDateString(dateLocaleOf(i18n.language), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const dimensions: Array<[string, number | undefined]> = [
    [t('panditDash.reviews.ritualKnowledge'), review.ritualKnowledge],
    [t('panditDash.reviews.punctuality'), review.punctuality],
    [t('panditDash.reviews.behaviour'), review.behaviour],
    [t('panditDash.reviews.communication'), review.communication],
  ]

  return (
    <div className="px-4 py-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium text-neutral-900">{review.panditName}</span>
          <span className="flex-shrink-0 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] text-green-700">
            {t('customerDash.myReviews.verifiedBooking')}
          </span>
        </div>
        <span className="flex-shrink-0 text-sm text-orange-500">{stars}</span>
      </div>

      <p className="text-xs text-neutral-400">
        {review.poojaName ? `${review.poojaName} · ` : ''}
        {date}
      </p>

      {dimensions.some(([, v]) => v) && (
        <div className="mt-1.5 flex flex-wrap gap-3">
          {dimensions
            .filter(([, v]) => v)
            .map(([label, val]) => (
              <span key={label} className="text-[10px] text-neutral-500">
                {label} <span className="text-orange-500">{'★'.repeat(val as number)}</span>
              </span>
            ))}
        </div>
      )}

      {review.comment && <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{review.comment}</p>}

      {review.panditReply && (
        <div className="mt-2 rounded-r-md border-l-2 border-orange-200 bg-orange-50 py-2 pl-3 pr-2">
          <p className="mb-0.5 text-xs font-medium text-orange-800">{t('customerDash.myReviews.panditReply')}</p>
          <p className="text-xs text-orange-700">{review.panditReply.text}</p>
        </div>
      )}
    </div>
  )
}
