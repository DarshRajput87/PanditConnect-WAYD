'use client'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import type { MaterialRow } from './types'

interface Props {
  value: MaterialRow[]
  onChange: (rows: MaterialRow[]) => void
}

export function MaterialsEditor({ value, onChange }: Props) {
  const { t } = useTranslation()

  function update(index: number, patch: Partial<MaterialRow>) {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }
  function add() {
    onChange([...value, { itemName: '', quantity: '', notes: '' }])
  }
  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-neutral-700">{t('pandit.materials')}</p>
      {value.length === 0 && <p className="text-xs text-neutral-400">{t('pandit.noMaterials')}</p>}
      {value.map((row, i) => (
        <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <Input
            value={row.itemName}
            onChange={(e) => update(i, { itemName: e.target.value })}
            placeholder={t('pandit.itemName')}
          />
          <Input
            value={row.quantity}
            onChange={(e) => update(i, { quantity: e.target.value })}
            placeholder={t('pandit.quantity')}
          />
          <Input
            value={row.notes}
            onChange={(e) => update(i, { notes: e.target.value })}
            placeholder={t('pandit.notesOptional')}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 text-neutral-400 transition-colors hover:border-red-200 hover:text-red-600"
            aria-label={t('pandit.removeMaterial')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:underline"
      >
        <Plus className="h-4 w-4" />
        {t('pandit.addMaterial')}
      </button>
    </div>
  )
}
