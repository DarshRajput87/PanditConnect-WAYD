'use client'
import { useTranslation } from 'react-i18next'
import { Check, Clock } from 'lucide-react'
import { formatINR } from '@/components/pandit/format'
import { cn } from '@/lib/utils'
import type { BookPoojaDTO } from '@/types/dashboard'

interface Props {
  poojas: BookPoojaDTO[]
  selectedId: string
  onSelect: (id: string) => void
}

export function Step1Service({ poojas, selectedId, onSelect }: Props) {
  const { t } = useTranslation()

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-medium text-neutral-900">{t('bookingWizard.selectServiceTitle')}</h2>

      {poojas.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-400">{t('bookingWizard.noServices')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {poojas.map((p) => {
            const selected = p._id === selectedId
            return (
              <button
                key={p._id}
                onClick={() => onSelect(p._id)}
                aria-pressed={selected}
                className={cn(
                  'relative rounded-xl border p-4 text-left transition-colors',
                  selected
                    ? 'border-orange-400 bg-orange-50/50 ring-1 ring-orange-400'
                    : 'border-neutral-200 hover:border-orange-200 hover:bg-orange-50/30'
                )}
              >
                {selected && (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <p className="pr-6 text-sm font-medium text-neutral-900">{p.name}</p>
                <p className="mt-1.5 text-sm font-semibold text-neutral-900">{formatINR(p.price)}</p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-neutral-400">
                  <Clock className="h-3 w-3" />
                  {t('panditProfile.minutes', { count: p.durationMin })}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
