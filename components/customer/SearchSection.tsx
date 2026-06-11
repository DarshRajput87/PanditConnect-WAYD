'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Search, Flame } from 'lucide-react'
import { SearchFilters } from './SearchFilters'
import { PanditSearchCard } from './PanditSearchCard'
import type { PanditSearchResultDTO } from '@/types/dashboard'

const SUGGESTIONS = ['Satyanarayan Katha', 'Griha Pravesh', 'Mundan Sanskar', 'Rudrabhishek']

interface Props {
  query: string
  results: PanditSearchResultDTO[]
  // The public /search page reuses this section outside the dashboard shell.
  basePath?: string
  isLoggedIn?: boolean
}

export function SearchSection({ query, results, basePath = '/dashboard/customer/search', isLoggedIn = true }: Props) {
  const { t } = useTranslation()

  return (
    <div className="w-full space-y-4 p-4 pb-24 md:p-6 md:pb-6">
      <SearchFilters basePath={basePath} />

      {!query ? (
        <div className="space-y-3 rounded-xl border border-neutral-200 bg-white py-16 text-center">
          <Flame className="mx-auto h-10 w-10 text-neutral-200" />
          <p className="text-sm text-neutral-400">{t('customerDash.search.emptyPrompt')}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <Link
                key={s}
                href={`${basePath}?q=${encodeURIComponent(s)}`}
                className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="space-y-2 rounded-xl border border-neutral-200 bg-white py-16 text-center">
          <Search className="mx-auto h-8 w-8 text-neutral-200" />
          <p className="text-sm text-neutral-500">{t('customerDash.search.noResults', { query })}</p>
          <p className="text-xs text-neutral-400">{t('customerDash.search.noResultsSub')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-neutral-500">{t('customerDash.search.resultsCount', { count: results.length, query })}</p>
            {!isLoggedIn && (
              <Link href="/login" className="text-xs font-medium text-orange-600 hover:underline">
                {t('customerDash.search.signInToBook')}
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {results.map((p) => (
              <PanditSearchCard key={p._id} pandit={p} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
