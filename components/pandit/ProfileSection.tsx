'use client'
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Pencil, BadgeCheck, Star } from 'lucide-react'
import { ProfileCompletion } from './ProfileCompletion'
import type { PanditProfileSummaryDTO } from '@/types/dashboard'

export function ProfileSection({ profile }: { profile: PanditProfileSummaryDTO }) {
  const { t } = useTranslation()

  // Completeness checklist — key suffixes resolve under panditDash.profile.fields.*
  const checks: Array<[string, boolean]> = [
    ['photo', Boolean(profile.profilePhoto)],
    ['bio', profile.bio.trim().length > 0],
    ['address', Boolean(profile.address?.city && profile.address?.state)],
    ['sampraday', profile.sampraday.trim().length > 0],
    ['specialization', profile.specialization.length > 0],
    ['languages', profile.languages.length > 0],
    ['serviceAreas', profile.serviceAreas.length > 0],
    ['experience', profile.experienceYears > 0],
    ['services', profile.servicesCount > 0],
    ['idDocument', profile.hasIdDocument],
  ]
  const done = checks.filter(([, ok]) => ok).length
  const percent = Math.round((done / checks.length) * 100)
  const missing = checks.filter(([, ok]) => !ok).map(([k]) => k)

  const initials = profile.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="w-full space-y-4 p-4 pb-24 md:p-6 md:pb-6">
      <ProfileCompletion percent={percent} missing={missing} />

      {/* Identity card */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 className="text-sm font-medium text-neutral-900">{t('panditDash.profile.publicProfile')}</h2>
          <Link
            href="/dashboard/pandit/register"
            className="flex items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100"
          >
            <Pencil className="h-3 w-3" />
            {t('panditDash.profile.editInWizard')}
          </Link>
        </div>

        <div className="p-4">
          <div className="flex items-start gap-4">
            {profile.profilePhoto ? (
              <img
                src={profile.profilePhoto}
                alt={profile.name}
                className="h-16 w-16 flex-shrink-0 rounded-full border border-neutral-200 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-lg font-medium text-orange-700">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-neutral-900">{profile.name}</p>
                {profile.verificationStatus === 'verified' && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-2 py-0.5 text-[10px] text-green-700">
                    <BadgeCheck className="h-2.5 w-2.5" />
                    {t('panditDash.nav.verified')}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-neutral-500">
                {profile.email}
                {profile.phone ? ` · ${profile.phone}` : ''}
              </p>
              {profile.ratingCount > 0 && (
                <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                  <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                  {profile.ratingAvg.toFixed(1)} · {t('panditDash.reviews.fromCount', { count: profile.ratingCount })}
                </p>
              )}
              {profile.bio && <p className="mt-2 text-sm leading-relaxed text-neutral-600">{profile.bio}</p>}
            </div>
          </div>
        </div>

        <dl className="divide-y divide-neutral-100 border-t border-neutral-100 text-sm">
          <ProfileRow label={t('panditDash.profile.sampraday')} value={profile.sampraday || '—'} />
          <ProfileRow
            label={t('panditDash.profile.experience')}
            value={t('panditDash.profile.experienceYears', { count: profile.experienceYears })}
          />
          <ProfileRow
            label={t('panditDash.profile.languages')}
            value={
              profile.languages.length > 0
                ? profile.languages.map((l) => t(`panditDash.langs.${l}`)).join(', ')
                : '—'
            }
          />
          <ProfileRow
            label={t('panditDash.profile.specialization')}
            value={
              profile.specialization.length > 0 ? (
                <span className="flex flex-wrap gap-1.5">
                  {profile.specialization.map((s) => (
                    <span key={s} className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-600">
                      {s}
                    </span>
                  ))}
                </span>
              ) : (
                '—'
              )
            }
          />
          <ProfileRow
            label={t('panditDash.profile.serviceAreas')}
            value={profile.serviceAreas.length > 0 ? profile.serviceAreas.join(', ') : '—'}
          />
          <ProfileRow
            label={t('panditDash.profile.location')}
            value={
              profile.address?.city
                ? [profile.address.line1, profile.address.city, profile.address.state, profile.address.pincode]
                    .filter(Boolean)
                    .join(', ')
                : '—'
            }
          />
          <ProfileRow
            label={t('panditDash.profile.activeServices')}
            value={
              <Link href="/dashboard/pandit/services" className="text-orange-600 hover:underline">
                {t('panditDash.profile.servicesActive', { count: profile.servicesCount })}
              </Link>
            }
          />
        </dl>
      </div>
    </div>
  )
}

function ProfileRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 px-4 py-2.5">
      <dt className="w-32 flex-shrink-0 text-xs text-neutral-400">{label}</dt>
      <dd className="min-w-0 flex-1 text-neutral-700">{value}</dd>
    </div>
  )
}
