'use client'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { ReviewCard } from './ReviewCard'
import { EmptyState } from './EmptyState'
import type { ReviewStatsDTO, ReviewDTO } from '@/types/dashboard'

interface Props {
  stats: ReviewStatsDTO
  reviews: ReviewDTO[]
}

export function ReviewsSection({ stats, reviews }: Props) {
  const { t } = useTranslation()

  const dimensions: Array<[string, number]> = [
    [t('panditDash.reviews.ritualKnowledge'), stats.ritualKnowledge],
    [t('panditDash.reviews.behaviour'), stats.behaviour],
    [t('panditDash.reviews.punctuality'), stats.punctuality],
    [t('panditDash.reviews.communication'), stats.communication],
  ]

  return (
    <div className="w-full space-y-5 p-4 pb-24 md:p-6 md:pb-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="mb-1 text-xs text-neutral-500">{t('panditDash.reviews.overallRating')}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-medium text-neutral-900">{stats.avg.toFixed(1)}</span>
            <span className="text-sm text-orange-500">
              {'★'.repeat(Math.round(stats.avg))}
              {'☆'.repeat(5 - Math.round(stats.avg))}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">{t('panditDash.reviews.fromCount', { count: stats.count })}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="mb-2 text-xs text-neutral-500">{t('panditDash.reviews.byDimension')}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {dimensions.map(([label, val]) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-neutral-500">{label}</span>
                <span className="font-medium text-neutral-900">{val.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews list */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="text-sm font-medium text-neutral-900">{t('panditDash.reviews.allReviews')}</h2>
        </div>
        {reviews.length === 0 ? (
          <EmptyState icon={Star} text={t('panditDash.reviews.noReviews')} tall />
        ) : (
          <div className="divide-y divide-neutral-100">
            {reviews.map((r) => (
              <ReviewCard key={r._id} review={r} showReply />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
