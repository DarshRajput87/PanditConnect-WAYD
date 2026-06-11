'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ReplyForm } from './ReplyForm'
import { dateLocaleOf } from './format'
import type { ReviewDTO } from '@/types/dashboard'

interface Props {
  review: ReviewDTO
  compact?: boolean
  showReply?: boolean
}

export function ReviewCard({ review, compact, showReply }: Props) {
  const { t, i18n } = useTranslation()
  const [showForm, setShowForm] = useState(false)

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
      {/* Header */}
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-900">{review.customerName}</span>
          <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] text-green-700">
            {t('panditDash.reviews.verified')}
          </span>
        </div>
        <span className="text-sm text-orange-500">{stars}</span>
      </div>

      {/* Meta */}
      <p className="text-xs text-neutral-400">
        {review.poojaName ? `${review.poojaName} · ` : ''}
        {date}
      </p>

      {/* Dimensions (non-compact) */}
      {!compact && dimensions.some(([, v]) => v) && (
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

      {/* Comment */}
      {review.comment && <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{review.comment}</p>}

      {/* Pandit reply */}
      {review.panditReply ? (
        <div className="mt-2 rounded-r-md border-l-2 border-orange-200 bg-orange-50 py-2 pl-3 pr-2">
          <p className="mb-0.5 text-xs font-medium text-orange-800">{t('panditDash.reviews.yourReply')}</p>
          <p className="text-xs text-orange-700">{review.panditReply.text}</p>
        </div>
      ) : (
        showReply && (
          <div className="mt-2">
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
              >
                {t('panditDash.reviews.reply')}
              </button>
            ) : (
              <ReplyForm reviewId={review._id} onDone={() => setShowForm(false)} />
            )}
          </div>
        )
      )}
    </div>
  )
}
