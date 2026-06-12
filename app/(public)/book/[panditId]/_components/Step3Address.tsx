'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { INDIAN_STATES, type Address } from '@/types'

interface Props {
  address: Address
  onChange: (a: Address) => void
  savedAddress: Address | null
  serviceAreas: string[]
}

const inputClass =
  'w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500'

export function Step3Address({ address, onChange, savedAddress, serviceAreas }: Props) {
  const { t } = useTranslation()
  const [useSaved, setUseSaved] = useState(
    Boolean(savedAddress && address.line1 === savedAddress.line1 && address.city === savedAddress.city)
  )

  function set(patch: Partial<Address>) {
    setUseSaved(false)
    onChange({ ...address, ...patch })
  }

  function toggleSaved() {
    if (!savedAddress) return
    const next = !useSaved
    setUseSaved(next)
    if (next) onChange(savedAddress)
  }

  const pincodeInvalid = address.pincode.length > 0 && !/^\d{6}$/.test(address.pincode)

  // Non-blocking heads-up when the city doesn't match the pandit's areas.
  const outsideAreas =
    address.city.trim().length >= 2 &&
    serviceAreas.length > 0 &&
    !serviceAreas.some(
      (a) =>
        a.toLowerCase().includes(address.city.trim().toLowerCase()) ||
        address.city.trim().toLowerCase().includes(a.toLowerCase())
    )

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-medium text-neutral-900">{t('bookingWizard.addressTitle')}</h2>

      {savedAddress && (
        <label className="mb-4 flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={useSaved}
            onChange={toggleSaved}
            className="h-4 w-4 rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
          />
          <span className="min-w-0">
            {t('bookingWizard.useSaved')}
            <span className="ml-1 block truncate text-xs text-neutral-400 sm:inline">
              ({savedAddress.line1}, {savedAddress.city})
            </span>
          </span>
        </label>
      )}

      <div className="space-y-3">
        <div>
          <label htmlFor="bk-line1" className="mb-1 block text-xs font-medium text-neutral-700">
            {t('bookingWizard.line1')}
          </label>
          <input
            id="bk-line1"
            type="text"
            value={address.line1}
            onChange={(e) => set({ line1: e.target.value })}
            required
            maxLength={200}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="bk-city" className="mb-1 block text-xs font-medium text-neutral-700">
              {t('bookingWizard.city')}
            </label>
            <input
              id="bk-city"
              type="text"
              value={address.city}
              onChange={(e) => set({ city: e.target.value })}
              required
              maxLength={60}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="bk-state" className="mb-1 block text-xs font-medium text-neutral-700">
              {t('bookingWizard.state')}
            </label>
            <select
              id="bk-state"
              value={address.state}
              onChange={(e) => set({ state: e.target.value })}
              required
              className={inputClass}
            >
              <option value="" disabled>
                {t('bookingWizard.selectState')}
              </option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="bk-pincode" className="mb-1 block text-xs font-medium text-neutral-700">
              {t('bookingWizard.pincode')}
            </label>
            <input
              id="bk-pincode"
              type="text"
              inputMode="numeric"
              value={address.pincode}
              onChange={(e) => set({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              required
              className={inputClass}
            />
            {pincodeInvalid && <p className="mt-1 text-xs text-red-600">{t('bookingWizard.pincodeInvalid')}</p>}
          </div>
        </div>
      </div>

      {outsideAreas && (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
          {t('bookingWizard.outsideAreas', { areas: serviceAreas.join(', ') })}
        </p>
      )}
    </div>
  )
}
