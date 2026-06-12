'use client'
import { useTranslation } from 'react-i18next'
import { Info, IndianRupee, Calendar, Receipt, Check } from 'lucide-react'
import { StatCard } from './StatCard'
import { EmptyState } from './EmptyState'
import { dateLocaleOf, formatINR } from './format'
import type { RevenueStatsDTO, RevenueRowDTO } from '@/types/dashboard'

interface Props {
  stats: RevenueStatsDTO
  rows: RevenueRowDTO[]
}

export function RevenueSection({ stats, rows }: Props) {
  const { t, i18n } = useTranslation()

  return (
    <div className="w-full space-y-5 p-4 pb-24 md:p-6 md:pb-6">
      {/* MVP payment notice */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
        {t('panditDash.revenue.indicativeNotice')}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label={t('panditDash.revenue.totalEarnings')}
          value={formatINR(stats.total)}
          sub={t('panditDash.revenue.allTime')}
          icon={IndianRupee}
        />
        <StatCard
          label={t('panditDash.revenue.thisMonth')}
          value={formatINR(stats.thisMonth)}
          sub={
            stats.monthGrowth !== null
              ? t('panditDash.revenue.vsLastMonth', { percent: `${stats.monthGrowth > 0 ? '+' : ''}${stats.monthGrowth}` })
              : undefined
          }
          icon={Calendar}
        />
        <StatCard
          label={t('panditDash.revenue.avgPerBooking')}
          value={formatINR(stats.avgValue)}
          sub={t('panditDash.revenue.bookingsCount', { count: stats.totalCompleted })}
          icon={Receipt}
        />
        <StatCard
          label={t('panditDash.revenue.statCompleted')}
          value={stats.totalCompleted}
          sub={t('panditDash.revenue.cancelledExcluded')}
          icon={Check}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="text-sm font-medium text-neutral-900">{t('panditDash.revenue.tableTitle')}</h2>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={Receipt} text={t('panditDash.revenue.noCompleted')} tall />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="w-[30%] px-4 py-2.5 text-left text-xs font-medium text-neutral-500">
                    {t('panditDash.revenue.colCustomer')}
                  </th>
                  <th className="w-[30%] px-4 py-2.5 text-left text-xs font-medium text-neutral-500">
                    {t('panditDash.revenue.colPooja')}
                  </th>
                  <th className="w-[22%] px-4 py-2.5 text-left text-xs font-medium text-neutral-500">
                    {t('panditDash.revenue.colDate')}
                  </th>
                  <th className="w-[18%] px-4 py-2.5 text-right text-xs font-medium text-neutral-500">
                    {t('panditDash.revenue.colAmount')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((row) => (
                  <tr key={row._id} className="hover:bg-neutral-50">
                    <td className="truncate px-4 py-2.5 text-neutral-900">{row.customerName}</td>
                    <td className="truncate px-4 py-2.5 text-neutral-500">{row.poojaName}</td>
                    <td className="px-4 py-2.5 text-neutral-500">
                      {new Date(row.completedAt).toLocaleDateString(dateLocaleOf(i18n.language))}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-neutral-900">{formatINR(row.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
