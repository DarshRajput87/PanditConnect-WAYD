'use client'
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, Clock, MapPin, Star, Share2, Check, ChevronDown } from 'lucide-react'
import { dateLocaleOf, formatINR } from '@/components/pandit/format'
import { cn } from '@/lib/utils'
import type { PublicPanditProfileDTO, PublicServiceDTO, PublicReviewDTO } from '@/types/dashboard'

interface Props {
  pandit: PublicPanditProfileDTO
  isLoggedIn: boolean
}

const INITIAL_REVIEWS = 5

// Booking destination: logged-out visitors go to login and land in the wizard after.
function bookHref(panditId: string, poojaId: string | null, isLoggedIn: boolean) {
  const target = poojaId ? `/book/${panditId}?poojaId=${poojaId}` : `/book/${panditId}`
  return isLoggedIn ? target : `/login?callbackUrl=${encodeURIComponent(target)}`
}

export function PanditProfileSection({ pandit, isLoggedIn }: Props) {
  const { t } = useTranslation()

  const initials = pandit.name
    .split(' ')
    .filter((w) => !['Pt.', 'Pandit'].includes(w))
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const startingPrice = pandit.services.length > 0 ? Math.min(...pandit.services.map((s) => s.price)) : 0

  return (
    <div className="min-h-[70vh] bg-neutral-50 pb-20 lg:pb-0">
      <div className="mx-auto w-full max-w-6xl space-y-4 p-4 md:p-6">
        {/* Header card */}
        <div className="rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50/60 to-white p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {pandit.profilePhoto ? (
              <img
                src={pandit.profilePhoto}
                alt={pandit.name}
                className="h-24 w-24 flex-shrink-0 rounded-full border border-orange-200 object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-2xl font-medium text-orange-700">
                {initials}
              </div>
            )}

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
                {pandit.languages.length > 0 && (
                  <> · {pandit.languages.map((l) => t(`panditDash.langs.${l}`)).join(', ')}</>
                )}
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

              {pandit.serviceAreas.length > 0 && (
                <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-neutral-500">
                  <MapPin className="h-3 w-3" />
                  {t('panditProfile.serves')}: {pandit.serviceAreas.join(', ')}
                </p>
              )}
            </div>

            <div className="flex flex-shrink-0 flex-row items-stretch gap-2 sm:flex-col sm:items-end">
              <Link
                href={bookHref(pandit._id, null, isLoggedIn)}
                className="flex-1 rounded-lg bg-orange-500 px-5 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-orange-600 sm:flex-none"
              >
                {isLoggedIn ? t('customerDash.search.bookNow') : t('panditProfile.signInToBook')}
              </Link>
              <ShareButton />
            </div>
          </div>

          {/* Specialization chips */}
          {pandit.specialization.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-orange-100 pt-4">
              {pandit.specialization.map((s) => (
                <span key={s} className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] text-orange-700">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0 space-y-4">
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
                    <ServiceCard key={s._id} service={s} panditId={pandit._id} isLoggedIn={isLoggedIn} />
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <ReviewsSection pandit={pandit} />
          </div>

          {/* Sticky booking card — desktop */}
          <div className="sticky top-20 hidden lg:block">
            <BookingCard pandit={pandit} isLoggedIn={isLoggedIn} startingPrice={startingPrice} />
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white p-3 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-neutral-500">{pandit.name}</p>
            {startingPrice > 0 && (
              <p className="text-sm font-medium text-neutral-900">
                {t('panditProfile.startingFrom', { price: formatINR(startingPrice) })}
              </p>
            )}
          </div>
          <Link
            href={bookHref(pandit._id, null, isLoggedIn)}
            className="flex-shrink-0 rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-600"
          >
            {isLoggedIn ? t('customerDash.search.bookNow') : t('panditProfile.signInToBook')}
          </Link>
        </div>
      </div>
    </div>
  )
}

function ShareButton() {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ url })
        return
      }
    } catch {
      // user dismissed the share sheet — fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — nothing else to do
    }
  }

  return (
    <button
      onClick={share}
      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? t('panditProfile.linkCopied') : t('panditProfile.share')}
    </button>
  )
}

function BookingCard({
  pandit,
  isLoggedIn,
  startingPrice,
}: {
  pandit: PublicPanditProfileDTO
  isLoggedIn: boolean
  startingPrice: number
}) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState(pandit.services[0]?._id ?? '')
  const selected = pandit.services.find((s) => s._id === selectedId)

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="text-sm font-medium text-neutral-900">{t('panditProfile.bookCardTitle')}</h2>

      {pandit.services.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-400">{t('panditProfile.noServices')}</p>
      ) : (
        <>
          <label htmlFor="profile-service" className="mb-1 mt-4 block text-xs font-medium text-neutral-700">
            {t('panditProfile.selectService')}
          </label>
          <select
            id="profile-service"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {pandit.services.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} — {formatINR(s.price)}
              </option>
            ))}
          </select>

          {selected && (
            <div className="mt-3 flex items-baseline justify-between rounded-lg bg-neutral-50 px-3 py-2.5">
              <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                <Clock className="h-3 w-3" />
                {t('panditProfile.minutes', { count: selected.durationMin })}
              </span>
              <span className="text-base font-semibold text-neutral-900">{formatINR(selected.price)}</span>
            </div>
          )}

          {!selected && startingPrice > 0 && (
            <p className="mt-3 text-sm text-neutral-500">
              {t('panditProfile.startingFrom', { price: formatINR(startingPrice) })}
            </p>
          )}

          <Link
            href={bookHref(pandit._id, selectedId || null, isLoggedIn)}
            className="mt-4 block w-full rounded-lg bg-orange-500 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-orange-600"
          >
            {isLoggedIn ? t('panditProfile.checkAvailability') : t('panditProfile.signInToBook')}
          </Link>
          {!isLoggedIn && <p className="mt-2 text-center text-[11px] text-neutral-400">{t('panditProfile.signInNote')}</p>}
        </>
      )}
    </div>
  )
}

function ServiceCard({
  service,
  panditId,
  isLoggedIn,
}: {
  service: PublicServiceDTO
  panditId: string
  isLoggedIn: boolean
}) {
  const { t } = useTranslation()
  const [showSamagri, setShowSamagri] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const longDesc = service.description.length > 100

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neutral-900">{service.name}</p>
          {service.description && (
            <p className={cn('mt-0.5 text-xs leading-relaxed text-neutral-500', !descExpanded && longDesc && 'line-clamp-2')}>
              {service.description}
            </p>
          )}
          {longDesc && (
            <button
              onClick={() => setDescExpanded(!descExpanded)}
              className="mt-0.5 text-xs text-orange-600 hover:underline"
            >
              {descExpanded ? t('panditProfile.readLess') : t('panditProfile.readMore')}
            </button>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
              <Clock className="h-3 w-3" />
              {t('panditProfile.minutes', { count: service.durationMin })}
            </span>
            {service.materials.length > 0 && (
              <button
                onClick={() => setShowSamagri(!showSamagri)}
                className="inline-flex items-center gap-0.5 text-xs text-orange-600 hover:underline"
                aria-expanded={showSamagri}
              >
                {showSamagri ? t('panditProfile.hideSamagri') : t('panditProfile.viewSamagri')}
                <ChevronDown className={cn('h-3 w-3 transition-transform', showSamagri && 'rotate-180')} />
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          <p className="text-sm font-medium text-neutral-900">{formatINR(service.price)}</p>
          <Link
            href={bookHref(panditId, service._id, isLoggedIn)}
            className="rounded-md border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100"
          >
            {t('panditProfile.bookThisService')}
          </Link>
        </div>
      </div>

      {showSamagri && (
        <ul className="mt-3 space-y-1 rounded-lg bg-neutral-50 p-3">
          {service.materials.map((m, i) => (
            <li key={i} className="flex items-center gap-2 text-xs">
              <span className="h-1 w-1 flex-shrink-0 rounded-full bg-orange-400" />
              <span className="font-medium text-neutral-800">{m.itemName}</span>
              <span className="text-neutral-400">{m.quantity}</span>
              {m.notes && <span className="text-neutral-400">· {m.notes}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ReviewsSection({ pandit }: { pandit: PublicPanditProfileDTO }) {
  const { t } = useTranslation()
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? pandit.reviews : pandit.reviews.slice(0, INITIAL_REVIEWS)
  const stats = pandit.reviewStats
  const total = stats.dist.reduce((a, b) => a + b, 0)

  const dimensions: Array<[string, number]> = [
    [t('panditDash.reviews.ritualKnowledge'), stats.ritualKnowledge],
    [t('panditDash.reviews.punctuality'), stats.punctuality],
    [t('panditDash.reviews.behaviour'), stats.behaviour],
    [t('panditDash.reviews.communication'), stats.communication],
  ]

  return (
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
        <p className="px-5 py-8 text-center text-sm text-neutral-400">{t('panditProfile.firstReview')}</p>
      ) : (
        <>
          {/* Breakdown */}
          <div className="grid grid-cols-1 gap-5 border-b border-neutral-100 px-5 py-4 sm:grid-cols-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-neutral-900">{pandit.ratingAvg.toFixed(1)}</span>
                <span className="text-sm text-orange-500">
                  {'★'.repeat(Math.round(pandit.ratingAvg))}
                  {'☆'.repeat(5 - Math.round(pandit.ratingAvg))}
                </span>
              </div>
              <div className="mt-2 space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.dist[star - 1] ?? 0
                  const pct = total > 0 ? (count / total) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs text-neutral-500">
                      <span className="w-3 text-right">{star}</span>
                      <Star className="h-3 w-3 fill-orange-300 text-orange-300" />
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                        <div className="h-full rounded-full bg-orange-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-right text-neutral-400">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-neutral-500">{t('panditDash.reviews.byDimension')}</p>
              <div className="space-y-1.5">
                {dimensions.map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">{label}</span>
                    <span className="font-medium text-neutral-900">{val > 0 ? val.toFixed(1) : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Review cards */}
          <div className="divide-y divide-neutral-100">
            {visible.map((r) => (
              <ReviewItem key={r._id} review={r} />
            ))}
          </div>

          {!showAll && pandit.reviews.length > INITIAL_REVIEWS && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full border-t border-neutral-100 py-2.5 text-center text-xs font-medium text-orange-600 hover:bg-orange-50"
            >
              {t('panditProfile.showAllReviews', { count: pandit.reviews.length })}
            </button>
          )}
        </>
      )}
    </div>
  )
}

function ReviewItem({ review }: { review: PublicReviewDTO }) {
  const { t, i18n } = useTranslation()
  const locale = dateLocaleOf(i18n.language)

  return (
    <div className="px-5 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-900">
          {review.customerName}
          <span className="inline-flex items-center gap-0.5 rounded-full border border-green-200 bg-green-50 px-1.5 py-px text-[10px] text-green-700">
            <BadgeCheck className="h-2.5 w-2.5" />
            {t('panditDash.reviews.verified')}
          </span>
        </p>
        <span className="text-xs text-orange-500">{'★'.repeat(review.overall)}</span>
      </div>
      {review.comment && <p className="mt-1 text-sm text-neutral-600">{review.comment}</p>}
      <p className="mt-1 text-[11px] text-neutral-400">
        {new Date(review.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
      {review.panditReply && (
        <div className="mt-2 rounded-lg bg-neutral-50 p-2.5">
          <p className="text-[11px] font-medium text-neutral-500">{t('panditProfile.panditReply')}</p>
          <p className="mt-0.5 text-xs text-neutral-600">{review.panditReply.text}</p>
        </div>
      )}
    </div>
  )
}
