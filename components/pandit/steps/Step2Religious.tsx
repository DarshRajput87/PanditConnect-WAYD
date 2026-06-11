'use client'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChipMultiSelect } from '../ChipMultiSelect'
import { TagInput } from '../TagInput'
import { POOJA_CATALOGUE, type Language } from '@/types'
import { cn } from '@/lib/utils'
import type { WizardState } from '../types'

interface Props {
  state: WizardState
  set: (patch: Partial<WizardState>) => void
  errors: Record<string, string>
}

const LANGUAGES: Language[] = ['hi', 'gu', 'en']

export function Step2Religious({ state, set, errors }: Props) {
  const { t } = useTranslation()

  function toggleLanguage(lang: Language) {
    set({
      languages: state.languages.includes(lang)
        ? state.languages.filter((l) => l !== lang)
        : [...state.languages, lang],
    })
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sampraday">{t('pandit.sampraday')}</Label>
          <Input
            id="sampraday"
            value={state.sampraday}
            onChange={(e) => set({ sampraday: e.target.value })}
            placeholder={t('pandit.sampradayPlaceholder')}
          />
          {errors.sampraday && <p className="text-sm text-red-600">{errors.sampraday}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="experienceYears">{t('pandit.experience')}</Label>
          <Input
            id="experienceYears"
            type="number"
            min={0}
            max={80}
            inputMode="numeric"
            value={state.experienceYears}
            onChange={(e) => set({ experienceYears: e.target.value })}
          />
          {errors.experienceYears && <p className="text-sm text-red-600">{errors.experienceYears}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('pandit.specialization')}</Label>
        <ChipMultiSelect
          options={POOJA_CATALOGUE.map((p) => ({ key: p.key, label: p.name }))}
          value={state.specialization}
          onChange={(v) => set({ specialization: v })}
        />
        {errors.specialization && <p className="text-sm text-red-600">{errors.specialization}</p>}
      </div>

      <div className="space-y-2">
        <Label>{t('pandit.languages')}</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => {
            const active = state.languages.includes(lang)
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                aria-pressed={active}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                )}
              >
                {t(`common.${lang === 'hi' ? 'hindi' : lang === 'gu' ? 'gujarati' : 'english'}`)}
              </button>
            )
          })}
        </div>
        {errors.languages && <p className="text-sm text-red-600">{errors.languages}</p>}
      </div>

      <div className="space-y-2">
        <Label>{t('pandit.serviceAreas')}</Label>
        <TagInput
          value={state.serviceAreas}
          onChange={(v) => set({ serviceAreas: v })}
          max={10}
          placeholder={t('pandit.serviceAreasPlaceholder')}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">{t('pandit.bio')}</Label>
        <Textarea
          id="bio"
          value={state.bio}
          maxLength={1000}
          onChange={(e) => set({ bio: e.target.value })}
          placeholder={t('pandit.bioPlaceholder')}
        />
        <p className="text-xs text-neutral-400">{state.bio.length}/1000</p>
      </div>
    </div>
  )
}
