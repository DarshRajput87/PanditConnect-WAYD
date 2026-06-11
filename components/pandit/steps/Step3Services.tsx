'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { MaterialsEditor } from '../MaterialsEditor'
import { POOJA_CATALOGUE } from '@/types'
import { emptyService, type ServiceRow, type WizardState } from '../types'

interface Props {
  state: WizardState
  set: (patch: Partial<WizardState>) => void
  errors: Record<string, string>
}

const MAX_SERVICES = 12

export function Step3Services({ state, set, errors }: Props) {
  const { t } = useTranslation()
  const services = state.services
  // Collapse state is UI-only; kept in lockstep with `services` via the handlers below.
  const [collapsed, setCollapsed] = useState<boolean[]>(() => services.map(() => false))
  const atMax = services.length >= MAX_SERVICES

  const isCollapsed = (i: number) => collapsed[i] ?? false

  function updateService(index: number, patch: Partial<ServiceRow>) {
    set({ services: services.map((s, i) => (i === index ? { ...s, ...patch } : s)) })
  }
  function addService() {
    if (atMax) return
    set({ services: [...services, emptyService()] })
    setCollapsed((c) => [...c, false])
  }
  function removeService(index: number) {
    if (!window.confirm(t('pandit.deleteConfirm'))) return
    const next = services.filter((_, i) => i !== index)
    set({ services: next.length ? next : [emptyService()] })
    setCollapsed((c) => {
      const nc = c.filter((_, i) => i !== index)
      return next.length ? nc : [false]
    })
  }
  function toggleCollapse(index: number) {
    setCollapsed((c) => services.map((_, i) => (i === index ? !(c[i] ?? false) : (c[i] ?? false))))
  }

  function summary(svc: ServiceRow): string {
    const name = svc.name || t('pandit.newService')
    const price = svc.price ? `₹${Number(svc.price).toLocaleString('en-IN')}` : ''
    const dur = svc.durationMin ? `${svc.durationMin} ${t('pandit.minutesShort')}` : ''
    return [name, price, dur].filter(Boolean).join(' · ')
  }

  return (
    <div className="space-y-4">
      {errors.services && <p className="text-sm text-red-600">{errors.services}</p>}

      {services.map((svc, i) => {
        const open = !isCollapsed(i)
        return (
          <div key={i} className="rounded-lg border border-neutral-200">
            <div className="flex items-center justify-between gap-2 p-4">
              <button
                type="button"
                onClick={() => toggleCollapse(i)}
                aria-expanded={open}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                {open ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-neutral-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />
                )}
                <span className="truncate text-sm font-semibold text-neutral-900">
                  {open ? `${t('pandit.service')} ${i + 1}` : summary(svc)}
                </span>
              </button>
              {services.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeService(i)}
                  className="inline-flex shrink-0 items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-red-600"
                  aria-label={t('pandit.deleteService')}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('pandit.remove')}</span>
                </button>
              )}
            </div>

            {open && (
              <div className="space-y-4 border-t border-neutral-200 p-4">
                <div className="space-y-1.5">
                  <Label>{t('pandit.pooja')}</Label>
                  <Select
                    value={svc.catalogKey}
                    onChange={(e) => {
                      const entry = POOJA_CATALOGUE.find((p) => p.key === e.target.value)
                      updateService(i, { catalogKey: e.target.value, name: entry?.name ?? '' })
                    }}
                  >
                    <option value="">{t('pandit.select')}</option>
                    {POOJA_CATALOGUE.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{t('pandit.price')}</Label>
                    <Input
                      type="number"
                      min={100}
                      inputMode="numeric"
                      value={svc.price}
                      onChange={(e) => updateService(i, { price: e.target.value })}
                      placeholder="2500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('pandit.duration')}</Label>
                    <Input
                      type="number"
                      min={15}
                      inputMode="numeric"
                      value={svc.durationMin}
                      onChange={(e) => updateService(i, { durationMin: e.target.value })}
                      placeholder="90"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>{t('pandit.description')}</Label>
                  <Textarea
                    value={svc.description}
                    maxLength={300}
                    onChange={(e) => updateService(i, { description: e.target.value })}
                    placeholder={t('pandit.descriptionPlaceholder')}
                  />
                  <p className="text-xs text-neutral-400">{svc.description.length}/300</p>
                </div>

                <MaterialsEditor
                  value={svc.materials}
                  onChange={(materials) => updateService(i, { materials })}
                />
              </div>
            )}
          </div>
        )
      })}

      <button
        type="button"
        onClick={addService}
        disabled={atMax}
        title={atMax ? t('pandit.maxServices') : undefined}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 py-3 text-sm font-medium text-neutral-600 transition-colors hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-neutral-300 disabled:hover:text-neutral-600"
      >
        <Plus className="h-4 w-4" />
        {atMax ? t('pandit.maxServices') : t('pandit.addService')}
      </button>
    </div>
  )
}
