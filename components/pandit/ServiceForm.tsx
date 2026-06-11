'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { createPooja, updatePooja } from '@/actions/pandit-services'
import { POOJA_CATALOGUE } from '@/types'
import type { ServiceDTO } from '@/types/dashboard'

export function ServiceForm({ service }: { service?: ServiceDTO }) {
  const router = useRouter()
  const { t } = useTranslation()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [catalogKey, setCatalogKey] = useState(service?.catalogKey ?? '')
  const [price, setPrice] = useState(service ? String(service.price) : '')
  const [durationMin, setDurationMin] = useState(service ? String(service.durationMin) : '60')
  const [description, setDescription] = useState(service?.description ?? '')

  const isEdit = Boolean(service)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const catalogue = POOJA_CATALOGUE.find((p) => p.key === catalogKey)
    if (!catalogue) {
      setError(t('panditDash.serviceForm.selectRequired'))
      return
    }
    const input = {
      catalogKey: catalogue.key,
      name: catalogue.name,
      price: Number(price),
      durationMin: Number(durationMin),
      description: description.trim() || undefined,
    }
    startTransition(async () => {
      const result = isEdit ? await updatePooja(service!._id, input) : await createPooja(input)
      if ('error' in result) {
        setError(t(`panditDash.errors.${result.error.code}`))
        return
      }
      router.push('/dashboard/pandit/services')
      router.refresh()
    })
  }

  const inputClass =
    'w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500'

  return (
    <div className="max-w-xl space-y-4 p-4 pb-24 md:p-6 md:pb-6">
      <Link
        href="/dashboard/pandit/services"
        className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {t('panditDash.serviceForm.back')}
      </Link>

      <form onSubmit={submit} className="rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="text-sm font-medium text-neutral-900">
            {isEdit ? t('panditDash.serviceForm.editTitle') : t('panditDash.serviceForm.createTitle')}
          </h2>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <label htmlFor="svc-pooja" className="mb-1 block text-xs font-medium text-neutral-700">
              {t('panditDash.serviceForm.pooja')}
            </label>
            <select
              id="svc-pooja"
              value={catalogKey}
              onChange={(e) => setCatalogKey(e.target.value)}
              required
              className={inputClass}
            >
              <option value="" disabled>
                {t('panditDash.serviceForm.selectPooja')}
              </option>
              {POOJA_CATALOGUE.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="svc-price" className="mb-1 block text-xs font-medium text-neutral-700">
                {t('panditDash.serviceForm.price')}
              </label>
              <input
                id="svc-price"
                type="number"
                min={100}
                step={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="svc-duration" className="mb-1 block text-xs font-medium text-neutral-700">
                {t('panditDash.serviceForm.durationMin')}
              </label>
              <input
                id="svc-duration"
                type="number"
                min={15}
                max={1440}
                step={15}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="svc-desc" className="mb-1 block text-xs font-medium text-neutral-700">
              {t('panditDash.serviceForm.description')}
            </label>
            <textarea
              id="svc-desc"
              rows={3}
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('panditDash.serviceForm.descriptionPlaceholder')}
              className={`${inputClass} resize-none`}
            />
          </div>

          <p className="text-xs text-neutral-400">{t('panditDash.serviceForm.materialsNote')}</p>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-200 px-4 py-3">
          <Link
            href="/dashboard/pandit/services"
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
          >
            {t('panditDash.serviceForm.cancel')}
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            {isPending ? t('panditDash.serviceForm.saving') : t('panditDash.serviceForm.save')}
          </button>
        </div>
      </form>
    </div>
  )
}
