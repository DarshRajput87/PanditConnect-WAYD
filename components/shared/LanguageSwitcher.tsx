'use client'
import { Globe, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Language } from '@/types'
import { LANG_STORAGE_KEY } from '@/components/providers/I18nProvider'

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'gu', label: 'ગુજરાતી' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  function onChange(code: string) {
    i18n.changeLanguage(code)
    window.localStorage.setItem(LANG_STORAGE_KEY, code)
  }

  return (
    <div className="relative inline-flex items-center">
      <Globe className="pointer-events-none absolute left-2.5 h-4 w-4 text-neutral-500" />
      <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-neutral-400" />
      <select
        aria-label="Select language"
        value={i18n.language?.split('-')[0] || 'en'}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 cursor-pointer appearance-none rounded-md border border-neutral-200 bg-white pl-8 pr-7 text-sm text-neutral-700 transition-colors hover:border-neutral-300 focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/20"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  )
}
