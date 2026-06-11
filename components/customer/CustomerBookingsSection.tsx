'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Calendar } from 'lucide-react'
import { BookingCard } from './BookingCard'
import { EmptyState } from '@/components/pandit/EmptyState'
import { cn } from '@/lib/utils'
import type { CustomerBookingDTO } from '@/types/dashboard'

const TAB_IDS = ['all', 'upcoming', 'completed', 'cancelled'] as const

interface Props {
  tab: string
  page: number
  bookings: CustomerBookingDTO[]
  pages: number
}

export function CustomerBookingsSection({ tab, page, bookings, pages }: Props) {
  const { t } = useTranslation()

  return (
    <div className="w-full p-4 pb-24 md:p-6 md:pb-6">
      {/* Tab bar */}
      <div className="mb-4 flex border-b border-neutral-200">
        {TAB_IDS.map((id) => (
          <Link
            key={id}
            href={`/dashboard/customer/bookings?tab=${id}`}
            className={cn(
              'border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === id
                ? 'border-blue-500 text-blue-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            )}
          >
            {t(`customerDash.tabs.${id}`)}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {bookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            tall
            text={
              <>
                {t(`customerDash.bookings.empty.${tab}`)}
                <Link href="/dashboard/customer/search" className="mt-1 block text-xs text-blue-600 hover:underline">
                  {t('customerDash.bookings.findAndBook')}
                </Link>
              </>
            }
          />
        ) : (
          <div className="divide-y divide-neutral-100">
            {bookings.map((b) => (
              <BookingCard key={b._id} booking={b} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/dashboard/customer/bookings?tab=${tab}&page=${p}`}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors',
                page === p
                  ? 'border-blue-500 bg-blue-50 font-medium text-blue-700'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              )}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
