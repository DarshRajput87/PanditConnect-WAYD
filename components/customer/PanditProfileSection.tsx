'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, Clock, MapPin, Star } from 'lucide-react'
import { dateLocaleOf, formatINR } from '@/components/pandit/format'
import type { PublicPanditProfileDTO } from '@/types/dashboard'

interface Props {
  pandit: PublicPanditProfileDTO
  isLoggedIn: boolean
}

export function PanditProfileSection({ pandit, isLoggedIn }: Props) {
  const { t, i18n } = useTranslation()
  const locale = dateLocaleOf(i18n.language)

  const initials = pandit.name
    .split(' ')
    .filter((w) => !['Pt.', 'Pandit'].includes(w))
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Logged-out visitors are sent to login and come straight back here after.
  const bookHref = isLoggedIn ? '#services' : `/login?callbackUrl=${encodeURIComponent(`/pandit/${pandit._id}`)}`

  return (
    <div className="min-h-[70vh] bg-neutral-50">
      <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
        {/* Header card */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-lg font-medium text-orange-700">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-neutral-900">{pandit.name}</h1>
                <span className="inline-flex items-center gap-0.5 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] text-green-700">
                  <BadgeCheck className="h-3 w-3" />
                  {t('customerDash.search.verified')}
                </span>
              </div>

              <p className="mt-1 text-sm text-neutral-500">
                {t('customerDash.search.experienceYears', { count: pandit.experienceYears })}
                {pandit.sampraday && <> · {pandit.sampraday}</>}
              </p>

              <p className="mt-1.5 text-sm">
                {pandit.ratingCount > 0 ? (
                  <>
                    <span className="text-orange-500">{'★'.repeat(Math.round(pandit.ratingAvg))}</span>{' '}
                    <span className="font-medium text-neutral-900">{pandit.ratingAvg.toFixed(1)}</span>{' '}
                    <span className="text-neutral-400">
                      ({t('panditProfile.reviewCount', { count: pandit.ratingCount })})
                    </span>
                  </>
                ) : (
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                    {t('customerDash.search.newOnPlatform')}
                  </span>
                )}
                {pandit.completedBookings > 0 && (
                  <span className="ml-2 text-xs text-neutral-400">
                    {t('panditProfile.completedPoojas', { count: pandit.completedBookings })}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-shrink-0 flex-col items-stretch gap-1.5 sm:items-end">
              <Link
                href={bookHref}
                className="rounded-lg bg-orange-500 px-5 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-orange-600"
              >
                {t('customerDash.search.bookNow')}
              </Link>
              {!isLoggedIn && <p className="text-center text-[11px] text-neutral-400">{t('panditProfile.signInNote')}</p>}
            </div>
          </div>

          {/* Languages + areas + specialization chips */}
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-neutral-100 pt-4">
            {pandit.languages.map((l) => (
              <span key={l} className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-600">
                {t(`panditDash.langs.${l}`)}
              </span>
            ))}
            {pandit.serviceAreas.map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-0.5 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-600"
              >
                <MapPin className="h-2.5 w-2.5" />
                {a}
              </span>
            ))}
            {pandit.specialization.map((s) => (
              <span key={s} className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] text-orange-700">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* About */}
        {pandit.bio && (
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="text-sm font-medium text-neutral-900">{t('panditProfile.about')}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-600">{pandit.bio}</p>
          </div>
        )}

        {/* Services & pricing */}
        <div id="services" className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-5 py-3">
            <h2 className="text-sm font-medium text-neutral-900">{t('panditProfile.services')}</h2>
          </div>
          {pandit.services.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-neutral-400">{t('panditProfile.noServices')}</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {pandit.services.map((s) => (
                <div key={s._id} className="flex items-start justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900">{s.name}</p>
                    {s.description && <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{s.description}</p>}
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-400">
                      <Clock className="h-3 w-3" />
                      {t('panditProfile.minutes', { count: s.durationMin })}
                    </p>
                  </div>
                  <p className="flex-shrink-0 text-sm font-medium text-neutral-900">{formatINR(s.price)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
            <h2 className="text-sm font-medium text-neutral-900">{t('panditProfile.reviewsTitle')}</h2>
            {pandit.ratingCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                {pandit.ratingAvg.toFixed(1)} · {t('panditProfile.reviewCount', { count: pandit.ratingCount })}
              </span>
            )}
          </div>
          {pandit.reviews.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-neutral-400">{t('panditProfile.noReviews')}</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {pandit.reviews.map((r) => (
                <div key={r._id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-neutral-900">{r.customerName}</p>
                    <span className="text-xs text-orange-500">{'★'.repeat(r.overall)}</span>
                  </div>
                  {r.comment && <p className="mt-1 text-sm text-neutral-600">{r.comment}</p>}
                  <p className="mt-1 text-[11px] text-neutral-400">
                    {new Date(r.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
