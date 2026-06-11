'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Search, MapPin, X } from 'lucide-react'
import { POOJA_CATALOGUE } from '@/types'
import { cn } from '@/lib/utils'

const LANGS = ['hi', 'gu', 'en'] as const
const RATINGS = ['3', '4', '4.5'] as const
const PRICES = ['1000', '2500', '5000'] as const

// The visible query: prefer ?q=, else resolve a legacy ?pooja=<slug> to its
// display name (catalogue lookup, falling back to title-cased slug) so the
// input is pre-filled when arriving from old links.
function queryFromParams(params: URLSearchParams): string {
  const q = params.get('q')
  if (q) return q
  const pooja = params.get('pooja')
  if (!pooja) return ''
  const entry = POOJA_CATALOGUE.find((p) => p.key === pooja.toLowerCase())
  if (entry) return entry.name
  return pooja
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function SearchFilters({ basePath = '/dashboard/customer/search' }: { basePath?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()

  const [q, setQ] = useState(() => queryFromParams(searchParams))
  const [area, setArea] = useState(searchParams.get('area') ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lang = searchParams.get('lang') ?? ''
  const minRating = searchParams.get('minRating') ?? ''
  const maxPrice = searchParams.get('maxPrice') ?? ''

  // Keep local inputs in sync when the URL changes externally (e.g. suggestion chips).
  useEffect(() => {
    setQ(queryFromParams(searchParams))
    setArea(searchParams.get('area') ?? '')
  }, [searchParams])

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    // Typing a query supersedes the legacy ?pooja= catalogue link.
    if (overrides.q !== undefined) params.delete('pooja')
    for (const [key, value] of Object.entries(overrides)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  function pushDebounced(overrides: Record<string, string>) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => router.replace(buildUrl(overrides)), 400)
  }

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  const activeFilters: Array<{ key: string; label: string }> = []
  if (lang) activeFilters.push({ key: 'lang', label: t(`panditDash.langs.${lang}`) })
  if (minRating) activeFilters.push({ key: 'minRating', label: `★ ${minRating}+` })
  if (maxPrice) activeFilters.push({ key: 'maxPrice', label: `≤ ₹${Number(maxPrice).toLocaleString('en-IN')}` })
  if (area) activeFilters.push({ key: 'area', label: area })

  return (
    <div className="space-y-3">
      {/* Inputs */}
      <div className="flex flex-col gap-2 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              pushDebounced({ q: e.target.value.trim() })
            }}
            placeholder={t('customerDash.search.placeholder')}
            className="w-full rounded-lg border border-neutral-200 py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                if (debounceRef.current) clearTimeout(debounceRef.current)
                setQ('')
                router.replace(buildUrl({ q: '' }))
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              aria-label={t('customerDash.search.clearAll')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="relative md:w-56">
          <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={area}
            onChange={(e) => {
              setArea(e.target.value)
              pushDebounced({ area: e.target.value.trim() })
            }}
            placeholder={t('customerDash.search.area')}
            className="w-full rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <ChipGroup
          label={t('customerDash.search.language')}
          options={LANGS.map((l) => ({ value: l, label: t(`panditDash.langs.${l}`) }))}
          selected={lang}
          onSelect={(v) => router.replace(buildUrl({ lang: v === lang ? '' : v }))}
        />
        <ChipGroup
          label={t('customerDash.search.minRating')}
          options={RATINGS.map((r) => ({ value: r, label: `${r}+` }))}
          selected={minRating}
          onSelect={(v) => router.replace(buildUrl({ minRating: v === minRating ? '' : v }))}
        />
        <ChipGroup
          label={t('customerDash.search.maxPrice')}
          options={PRICES.map((p) => ({ value: p, label: `₹${Number(p).toLocaleString('en-IN')}` }))}
          selected={maxPrice}
          onSelect={(v) => router.replace(buildUrl({ maxPrice: v === maxPrice ? '' : v }))}
        />
      </div>

      {/* Active filter pills */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                if (f.key === 'area') setArea('')
                router.replace(buildUrl({ [f.key]: '' }))
              }}
              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] text-blue-700 hover:bg-blue-100"
            >
              {f.label}
              <X className="h-2.5 w-2.5" />
            </button>
          ))}
          <button
            onClick={() => {
              setArea('')
              router.replace(buildUrl({ lang: '', minRating: '', maxPrice: '', area: '' }))
            }}
            className="text-[11px] text-neutral-500 underline hover:text-neutral-700"
          >
            {t('customerDash.search.clearAll')}
          </button>
        </div>
      )}
    </div>
  )
}

function ChipGroup({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string
  options: Array<{ value: string; label: string }>
  selected: string
  onSelect: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-neutral-400">{label}</span>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onSelect(o.value)}
          className={cn(
            'rounded-full border px-2.5 py-1 transition-colors',
            selected === o.value
              ? 'border-blue-500 bg-blue-50 font-medium text-blue-700'
              : 'border-neutral-200 text-neutral-600 hover:border-blue-300 hover:text-blue-700'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
