'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Inbox } from 'lucide-react'
import { InquiryCard } from './InquiryCard'
import { EmptyState } from './EmptyState'
import { cn } from '@/lib/utils'
import type { BookingSummaryDTO } from '@/types/dashboard'

interface Props {
  tab: string
  newBookings: BookingSummaryDTO[]
  confirmed: BookingSummaryDTO[]
  completed: BookingSummaryDTO[]
}

export function InquiriesSection({ tab, newBookings, confirmed, completed }: Props) {
  const { t } = useTranslation()

  const tabs = [
    { id: 'new', label: `${t('panditDash.inquiries.tabNew')} (${newBookings.length})` },
    { id: 'confirmed', label: `${t('panditDash.inquiries.tabConfirmed')} (${confirmed.length})` },
    { id: 'completed', label: t('panditDash.inquiries.tabCompleted') },
  ]

  const current = tab === 'confirmed' ? confirmed : tab === 'completed' ? completed : newBookings
  const emptyText =
    tab === 'confirmed'
      ? t('panditDash.inquiries.noConfirmed')
      : tab === 'completed'
        ? t('panditDash.inquiries.noCompleted')
        : t('panditDash.inquiries.noPending')

  return (
    <div className="w-full p-4 pb-24 md:p-6 md:pb-6">
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {/* Tabs */}
        <div className="flex border-b border-neutral-200">
          {tabs.map((tb) => (
            <Link
              key={tb.id}
              href={`/dashboard/pandit/inquiries?tab=${tb.id}`}
              className={cn(
                'border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                tab === tb.id
                  ? 'border-orange-500 text-orange-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              )}
            >
              {tb.label}
            </Link>
          ))}
        </div>

        {/* List */}
        {current.length === 0 ? (
          <EmptyState icon={Inbox} text={emptyText} tall />
        ) : (
          <div className="divide-y divide-neutral-100">
            {current.map((b) => (
              <InquiryCard key={b._id} booking={b} confirmed={tab !== 'confirmed' && tab !== 'new'} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
