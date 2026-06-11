'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Props {
  value: string[]
  onChange: (value: string[]) => void
  max?: number
  placeholder?: string
}

export function TagInput({ value, onChange, max = 10, placeholder }: Props) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')

  function add(raw: string) {
    const tag = raw.trim()
    if (!tag) return
    if (value.length >= max) return
    if (value.some((v) => v.toLowerCase() === tag.toLowerCase())) return
    onChange([...value, tag])
    setDraft('')
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(draft)
    } else if (e.key === 'Backspace' && !draft && value.length) {
      remove(value.length - 1)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-md border border-neutral-200 bg-white p-2 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20">
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700"
          >
            {tag}
            <button type="button" onClick={() => remove(i)} aria-label={`Remove ${tag}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={value.length >= max ? '' : placeholder}
          disabled={value.length >= max}
          className="min-w-[8rem] flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
      </div>
      <p className="mt-1.5 text-xs text-neutral-400">
        {value.length}/{max} · {t('pandit.tagHint')}
      </p>
    </div>
  )
}
