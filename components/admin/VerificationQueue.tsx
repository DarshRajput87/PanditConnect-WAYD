'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, X, Check, ShieldX, ExternalLink, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Address, Gender, Language } from '@/types'

export interface PendingPandit {
  id: string
  name: string
  email: string
  phone: string
  profilePhoto: string
  idDocumentUrl: string
  sampraday: string
  experienceYears: number
  age?: number
  gender?: Gender
  address?: Address
  specialization: string[]
  languages: Language[]
  serviceAreas: string[]
  bio: string
  aadhaarLast4: string
  serviceCount: number
  submittedAt: string | null
}

export function VerificationQueue({ items }: { items: PendingPandit[] }) {
  const { t } = useTranslation()
  const [list, setList] = useState(items)
  const [selected, setSelected] = useState<PendingPandit | null>(null)

  function onResolved(id: string) {
    setList((prev) => prev.filter((p) => p.id !== id))
    setSelected(null)
  }

  if (list.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center">
        <Inbox className="mx-auto h-8 w-8 text-neutral-300" />
        <p className="mt-3 text-sm font-medium text-neutral-700">{t('admin.queueEmptyTitle')}</p>
        <p className="mt-1 text-sm text-neutral-500">{t('admin.queueEmptyDesc')}</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {/* Header row (desktop) */}
        <div className="hidden grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 sm:grid">
          <span>{t('admin.colPandit')}</span>
          <span>{t('admin.colSampraday')}</span>
          <span>{t('admin.colExperience')}</span>
          <span>{t('admin.colSubmitted')}</span>
          <span className="text-right">{t('admin.colAction')}</span>
        </div>

        <ul className="divide-y divide-neutral-200">
          {list.map((p) => (
            <li
              key={p.id}
              className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-[2fr_1.5fr_1fr_1fr_auto] sm:items-center sm:gap-4"
            >
              <div className="flex items-center gap-3">
                <Avatar src={p.profilePhoto} name={p.name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-900">{p.name}</p>
                  <p className="truncate text-xs text-neutral-500">{p.email}</p>
                </div>
              </div>
              <span className="text-sm text-neutral-600">{p.sampraday || '—'}</span>
              <span className="text-sm text-neutral-600">
                {p.experienceYears} {t('admin.years')}
              </span>
              <span className="text-sm text-neutral-500">{formatDate(p.submittedAt)}</span>
              <div className="sm:text-right">
                <Button size="sm" variant="outline" onClick={() => setSelected(p)}>
                  {t('admin.review')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {selected && (
        <DetailModal
          pandit={selected}
          onClose={() => setSelected(null)}
          onResolved={() => onResolved(selected.id)}
        />
      )}
    </>
  )
}

function DetailModal({
  pandit,
  onClose,
  onResolved,
}: {
  pandit: PendingPandit
  onClose: () => void
  onResolved: () => void
}) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'view' | 'reject'>('view')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState('')

  async function act(action: 'approve' | 'reject') {
    setError('')
    setLoading(action)
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panditId: pandit.id, action, reason: action === 'reject' ? reason : undefined }),
      })
      const data = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok || !data.success) {
        setError(data.error || t('errors.generic'))
        setLoading(null)
        return
      }
      onResolved()
    } catch {
      setError(t('errors.generic'))
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-lg bg-white sm:rounded-lg">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">{t('admin.reviewTitle')}</h2>
          <button onClick={onClose} aria-label={t('admin.close')} className="p-1 text-neutral-400 hover:text-neutral-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-5 py-5">
          <div className="flex items-center gap-3">
            <Avatar src={pandit.profilePhoto} name={pandit.name} size="lg" />
            <div className="min-w-0">
              <p className="text-base font-semibold text-neutral-900">{pandit.name}</p>
              <p className="truncate text-sm text-neutral-500">{pandit.email}</p>
              <p className="text-sm text-neutral-500">{pandit.phone}</p>
            </div>
          </div>

          <DetailGrid
            rows={[
              [t('pandit.age'), pandit.age ? String(pandit.age) : '—'],
              [t('pandit.genderLabel'), pandit.gender ? t(`pandit.gender.${pandit.gender}`) : '—'],
              [t('pandit.sampraday'), pandit.sampraday || '—'],
              [t('pandit.experience'), `${pandit.experienceYears} ${t('admin.years')}`],
              [t('pandit.address'), formatAddress(pandit.address)],
              [t('admin.servicesOffered'), String(pandit.serviceCount)],
              [t('admin.aadhaar'), pandit.aadhaarLast4 ? `•••• •••• ${pandit.aadhaarLast4}` : '—'],
            ]}
          />

          {pandit.specialization.length > 0 && (
            <ChipRow label={t('pandit.specialization')} items={pandit.specialization} />
          )}
          {pandit.serviceAreas.length > 0 && (
            <ChipRow label={t('pandit.serviceAreas')} items={pandit.serviceAreas} />
          )}

          {pandit.bio && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{t('pandit.bio')}</p>
              <p className="mt-1 text-sm text-neutral-700">{pandit.bio}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{t('admin.idDocument')}</p>
            {pandit.idDocumentUrl ? (
              <a
                href={pandit.idDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:underline"
              >
                {t('admin.viewDocument')}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <p className="mt-1 text-sm text-neutral-400">{t('admin.noDocument')}</p>
            )}
          </div>

          {mode === 'reject' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">{t('admin.rejectionReason')}</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('admin.rejectionPlaceholder')}
                minLength={10}
              />
              <p className="text-xs text-neutral-400">{t('admin.rejectionHint')}</p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-neutral-200 bg-white px-5 py-4">
          {mode === 'view' ? (
            <>
              <Button
                variant="outline"
                onClick={() => setMode('reject')}
                disabled={loading !== null}
                className="text-red-600 hover:bg-red-50"
              >
                <ShieldX className="mr-2 h-4 w-4" />
                {t('admin.reject')}
              </Button>
              <Button onClick={() => act('approve')} disabled={loading !== null}>
                {loading === 'approve' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {t('admin.approve')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setMode('view')} disabled={loading !== null}>
                {t('pandit.back')}
              </Button>
              <Button
                onClick={() => act('reject')}
                disabled={reason.trim().length < 10 || loading !== null}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading === 'reject' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('admin.confirmReject')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Avatar({ src, name, size = 'md' }: { src: string; name: string; size?: 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'h-12 w-12' : 'h-9 w-9'
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={`${dim} shrink-0 rounded-full object-cover`} />
  }
  return (
    <span className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-semibold text-orange-600`}>
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

function DetailGrid({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</dt>
          <dd className="mt-0.5 text-sm text-neutral-800">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function formatAddress(a?: Address): string {
  if (!a) return '—'
  return [a.line1, a.city, a.state, a.pincode].filter(Boolean).join(', ') || '—'
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
