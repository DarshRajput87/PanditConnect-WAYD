'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Calendar, Clock, Check, Star, BadgeCheck } from 'lucide-react'
import { StatCard } from '@/components/pandit/StatCard'
import { EmptyState } from '@/components/pandit/EmptyState'
import { BookingCard } from './BookingCard'
import type { CustomerStatsDTO, CustomerBookingDTO, SuggestedPanditDTO } from '@/types/dashboard'

interface Props {
  stats: CustomerStatsDTO
  upcoming: CustomerBookingDTO[]
  pendingReviews: CustomerBookingDTO[]
  suggested: SuggestedPanditDTO[]
}

export function CustomerOverviewSection({ stats, upcoming, pendingReviews, suggested }: Props) {
  const { t } = useTranslation()

  return (
    <div className="w-full space-y-6 p-4 pb-24 md:p-6 md:pb-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t('customerDash.overview.statTotal')}
          value={stats.total}
          sub={t('customerDash.overview.allTime')}
          icon={Calendar}
        />
        <StatCard
          label={t('customerDash.overview.statUpcoming')}
          value={stats.upcoming}
          sub={t('customerDash.overview.confirmedSub')}
          icon={Clock}
          alert={stats.upcoming > 0}
        />
        <StatCard
          label={t('customerDash.overview.statCompleted')}
          value={stats.completed}
          sub={t('customerDash.overview.poojasDone')}
          icon={Check}
        />
        <StatCard
          label={t('customerDash.overview.statToReview')}
          value={stats.pendingReviews}
          sub={t('customerDash.overview.pendingReviewSub')}
          icon={Star}
          alert={stats.pendingReviews > 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Upcoming bookings */}
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-medium text-neutral-900">{t('customerDash.overview.upcomingBookings')}</h2>
            <Link href="/dashboard/customer/bookings?tab=upcoming" className="text-xs text-blue-600 hover:underline">
              {t('customerDash.overview.viewAll')}
            </Link>
          </div>
          <div className="min-h-[180px] divide-y divide-neutral-100">
            {upcoming.length === 0 ? (
              <EmptyState
                icon={Calendar}
                text={
                  <>
                    {t('customerDash.overview.noUpcoming')}
                    <Link href="/dashboard/customer/search" className="mt-1 block text-xs text-blue-600 hover:underline">
                      {t('customerDash.overview.bookAPooja')}
                    </Link>
                  </>
                }
              />
            ) : (
              upcoming.slice(0, 2).map((b) => <BookingCard key={b._id} booking={b} compact />)
            )}
          </div>
        </div>

        {/* Suggested pandits */}
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-medium text-neutral-900">{t('customerDash.overview.suggestedPandits')}</h2>
            <Link href="/dashboard/customer/search" className="text-xs text-blue-600 hover:underline">
              {t('customerDash.overview.searchAll')}
            </Link>
          </div>
          <div className="min-h-[180px] divide-y divide-neutral-100">
            {suggested.length === 0 ? (
              <EmptyState icon={Star} text={t('customerDash.overview.noSuggestions')} />
            ) : (
              suggested.slice(0, 2).map((p) => <SuggestedPanditRow key={p._id} pandit={p} />)
            )}
          </div>
        </div>
      </div>

      {/* Pending reviews */}
      {pendingReviews.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-medium text-neutral-900">{t('customerDash.overview.pendingReview')}</h2>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              {t('customerDash.overview.awaitingCount', { count: pendingReviews.length })}
            </span>
          </div>
          <div className="grid grid-cols-1 divide-y divide-neutral-100 md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-3">
            {pendingReviews.slice(0, 3).map((b) => (
              <BookingCard key={b._id} booking={b} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SuggestedPanditRow({ pandit }: { pandit: SuggestedPanditDTO }) {
  const { t } = useTranslation()
  const initials = pandit.name
    .split(' ')
    .filter((w) => !['Pt.', 'Pandit'].includes(w))
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-xs font-medium text-orange-700">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-neutral-900">{pandit.name}</span>
          {pandit.verificationStatus === 'verified' && (
            <span className="inline-flex flex-shrink-0 items-center gap-0.5 rounded-full border border-green-200 bg-green-50 px-1.5 py-0.5 text-[10px] text-green-700">
              <BadgeCheck className="h-2.5 w-2.5" />
              {t('customerDash.search.verified')}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-neutral-500">
          {pandit.ratingCount > 0 ? (
            <>
              <span className="text-orange-500">{'★'.repeat(Math.round(pandit.ratingAvg))}</span> {pandit.ratingAvg.toFixed(1)}
            </>
          ) : (
            t('customerDash.search.newOnPlatform')
          )}
          {pandit.specialization.length > 0 && <> · {pandit.specialization.slice(0, 2).join(', ')}</>}
        </p>
      </div>
      <Link
        href={`/pandit/${pandit._id}`}
        className="flex-shrink-0 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600"
      >
        {t('customerDash.search.bookNow')}
      </Link>
    </div>
  )
}
