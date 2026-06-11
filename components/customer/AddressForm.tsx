'use client'
import { useState, useTransition } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Check } from 'lucide-react'
import { updateCustomerAddress } from '@/actions/customer-dashboard'
import { INDIAN_STATES } from '@/types'

const inputClass =
  'w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

interface Address {
  line1: string
  city: string
  state: string
  pincode: string
}

export function AddressForm({ initialAddress }: { initialAddress: Address }) {
  const { t } = useTranslation()
  const [isPending, startTransition] = useTransition()
  const [address, setAddress] = useState<Address>(initialAddress)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function set(field: keyof Address, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
    setError('')
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    if (address.pincode && !/^\d{6}$/.test(address.pincode)) {
      setError(t('customerDash.settings.pincodeInvalid'))
      return
    }
    startTransition(async () => {
      const result = await updateCustomerAddress(address)
      if ('error' in result) {
        setError(t(`customerDash.settings.errors.${result.error.code === 'invalid_input' ? 'invalid_input' : 'server'}`))
        return
      }
      setSaved(true)
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="addr-line1" className="mb-1 block text-xs font-medium text-neutral-700">
          {t('customerDash.settings.addressLine1')}
        </label>
        <input
          id="addr-line1"
          type="text"
          value={address.line1}
          onChange={(e) => set('line1', e.target.value)}
          placeholder={t('customerDash.settings.addressLine1Placeholder')}
          maxLength={200}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="addr-city" className="mb-1 block text-xs font-medium text-neutral-700">
            {t('customerDash.settings.city')}
          </label>
          <input
            id="addr-city"
            type="text"
            value={address.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Vadodara"
            maxLength={60}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="addr-pincode" className="mb-1 block text-xs font-medium text-neutral-700">
            {t('customerDash.settings.pincode')}
          </label>
          <input
            id="addr-pincode"
            type="text"
            value={address.pincode}
            onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="390001"
            inputMode="numeric"
            maxLength={6}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="addr-state" className="mb-1 block text-xs font-medium text-neutral-700">
          {t('customerDash.settings.state')}
        </label>
        <select id="addr-state" value={address.state} onChange={(e) => set('state', e.target.value)} className={inputClass}>
          <option value="">{t('customerDash.settings.selectState')}</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-500 px-4 py-2 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          {t('customerDash.settings.saveAddress')}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs text-green-700">
            <Check className="h-3.5 w-3.5" />
            {t('customerDash.settings.addressSaved')}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  )
}
