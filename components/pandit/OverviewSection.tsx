'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Check, Clock, Star, Activity, Inbox, Calendar } from 'lucide-react'
import { StatCard } from './StatCard'
import { InquiryCard } from './InquiryCard'
import { ReviewCard } from './ReviewCard'
import { BookingsChart } from './BookingsChart'
import { EmptyState } from './EmptyState'
import type { OverviewStatsDTO, BookingSummaryDTO, ReviewDTO, MonthCountDTO } from '@/types/dashboard'

interface Props {
  stats: OverviewStatsDTO
  inquiries: BookingSummaryDTO[]
  reviews: ReviewDTO[]
  upcoming: BookingSummaryDTO[]
  chartData: MonthCountDTO[]
}

export function OverviewSection({ stats, inquiries, reviews, upcoming, chartData }: Props) {
  const { t } = useTranslation()

  return (
    <div className="w-full space-y-5 p-4 pb-24 md:p-6 md:pb-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label={t('panditDash.overview.statCompleted')}
          value={stats.totalCompleted}
          sub={t('panditDash.overview.thisMonthPlus', { count: stats.thisMonthCompleted })}
          icon={Check}
        />
        <StatCard
          label={t('panditDash.overview.statPending')}
          value={stats.pendingRequests}
          sub={t('panditDash.overview.awaitingResponse')}
          icon={Clock}
          alert={stats.pendingRequests > 0}
        />
        <StatCard
          label={t('panditDash.overview.statRating')}
          value={stats.avgRating.toFixed(1)}
          sub={t('panditDash.overview.fromReviews', { count: stats.ratingCount })}
          icon={Star}
        />
        <StatCard
          label={t('panditDash.overview.statResponseRate')}
          value={`${Math.min(Math.round(stats.responseRate * 100), 100)}%`}
          sub={t('panditDash.overview.requestsAnswered')}
          icon={Activity}
        />
      </div>

      {/* Two column grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* New inquiries */}
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-medium text-neutral-900">{t('panditDash.overview.newInquiries')}</h2>
            <Link href="/dashboard/pandit/inquiries" className="text-xs text-orange-600 hover:underline">
              {t('panditDash.overview.viewAll')}
            </Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {inquiries.length === 0 ? (
              <EmptyState icon={Inbox} text={t('panditDash.overview.noNewInquiries')} />
            ) : (
              inquiries.map((b) => <InquiryCard key={b._id} booking={b} compact />)
            )}
          </div>
        </div>

        {/* Bookings chart */}
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-medium text-neutral-900">{t('panditDash.overview.bookingsChartTitle')}</h2>
          </div>
          <div className="p-4">
            <BookingsChart data={chartData} />
          </div>
        </div>

        {/* Recent reviews */}
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-medium text-neutral-900">{t('panditDash.overview.recentReviews')}</h2>
            <Link href="/dashboard/pandit/reviews" className="text-xs text-orange-600 hover:underline">
              {t('panditDash.overview.viewAll')}
            </Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {reviews.length === 0 ? (
              <EmptyState icon={Star} text={t('panditDash.overview.noReviewsYet')} />
            ) : (
              reviews.map((r) => <ReviewCard key={r._id} review={r} compact />)
            )}
          </div>
        </div>

        {/* Upcoming confirmed */}
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-medium text-neutral-900">{t('panditDash.overview.upcomingConfirmed')}</h2>
            <Link href="/dashboard/pandit/inquiries?tab=confirmed" className="text-xs text-orange-600 hover:underline">
              {t('panditDash.overview.viewAll')}
            </Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {upcoming.length === 0 ? (
              <EmptyState icon={Calendar} text={t('panditDash.overview.noUpcoming')} />
            ) : (
              upcoming.map((b) => <InquiryCard key={b._id} booking={b} compact confirmed />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
