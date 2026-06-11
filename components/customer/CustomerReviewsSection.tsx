'use client'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { CustomerReviewCard } from './CustomerReviewCard'
import { EmptyState } from '@/components/pandit/EmptyState'
import type { CustomerReviewDTO } from '@/types/dashboard'

export function CustomerReviewsSection({ reviews }: { reviews: CustomerReviewDTO[] }) {
  const { t } = useTranslation()

  return (
    <div className="w-full p-4 pb-24 md:p-6 md:pb-6">
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 className="text-sm font-medium text-neutral-900">{t('customerDash.myReviews.title')}</h2>
          <span className="text-xs text-neutral-400">{t('customerDash.myReviews.total', { count: reviews.length })}</span>
        </div>
        {reviews.length === 0 ? (
          <EmptyState
            icon={Star}
            tall
            text={
              <>
                {t('customerDash.myReviews.empty')}
                <span className="mt-1 block text-xs text-neutral-400">{t('customerDash.myReviews.emptySub')}</span>
              </>
            }
          />
        ) : (
          <div className="grid grid-cols-1 divide-y divide-neutral-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            {reviews.map((r) => (
              <CustomerReviewCard key={r._id} review={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
