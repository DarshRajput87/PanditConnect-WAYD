'use client'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Option {
  key: string
  label: string
}

interface Props {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
}

export function ChipMultiSelect({ options, value, onChange }: Props) {
  function toggle(key: string) {
    onChange(value.includes(key) ? value.filter((v) => v !== key) : [...value, key])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt.key)
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => toggle(opt.key)}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
            )}
          >
            {active && <Check className="h-3.5 w-3.5" />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
