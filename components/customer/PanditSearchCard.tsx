'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { BadgeCheck } from 'lucide-react'
import { formatINR } from '@/components/pandit/format'
import type { PanditSearchResultDTO } from '@/types/dashboard'

interface Props {
  pandit: PanditSearchResultDTO
  // Logged-out visitors (public /search) get sent to login with a callback to
  // the pandit profile when they hit "Book Now".
  isLoggedIn?: boolean
}

export function PanditSearchCard({ pandit, isLoggedIn = true }: Props) {
  const { t } = useTranslation()
  const profileHref = `/pandit/${pandit._id}`
  const bookHref = isLoggedIn ? profileHref : `/login?callbackUrl=${encodeURIComponent(profileHref)}`
  const initials = pandit.name
    .split(' ')
    .filter((w) => !['Pt.', 'Pandit'].includes(w))
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="w-full rounded-lg border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-sm font-medium text-orange-700">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-neutral-900">{pandit.name}</span>
            {pandit.verificationStatus === 'verified' && (
              <span className="inline-flex flex-shrink-0 items-center gap-0.5 rounded-full border border-green-200 bg-green-50 px-1.5 py-0.5 text-[10px] text-green-700">
                <BadgeCheck className="h-2.5 w-2.5" />
                {t('customerDash.search.verified')}
              </span>
            )}
            {/* Never show "0.0 ★" for new pandits */}
            {pandit.ratingCount === 0 ? (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700">
                {t('customerDash.search.newOnPlatform')}
              </span>
            ) : (
              <span className="text-xs text-neutral-500">
                <span className="text-orange-500">★</span> {pandit.ratingAvg.toFixed(1)} ({pandit.ratingCount})
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-neutral-500">
            {t('customerDash.search.experienceYears', { count: pandit.experienceYears })}
            {pandit.languages.length > 0 && (
              <>
                <span className="mx-1.5 text-neutral-300">·</span>
                {pandit.languages.map((l) => t(`panditDash.langs.${l}`)).join(', ')}
              </>
            )}
          </p>

          {pandit.serviceAreas.length > 0 && (
            <p className="mt-0.5 truncate text-xs text-neutral-400">{pandit.serviceAreas.join(', ')}</p>
          )}

          {pandit.matchedPoojas.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {pandit.matchedPoojas.slice(0, 3).map((name) => (
                <span key={name} className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] text-neutral-600">
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          {pandit.startingPrice > 0 && (
            <p className="text-xs text-neutral-500">
              {t('customerDash.search.startingFrom')}{' '}
              <span className="font-medium text-neutral-900">{formatINR(pandit.startingPrice)}</span>
            </p>
          )}
          <div className="flex gap-2">
            <Link
              href={profileHref}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-50"
            >
              {t('customerDash.search.viewProfile')}
            </Link>
            <Link
              href={bookHref}
              className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600"
            >
              {t('customerDash.search.bookNow')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
