'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Loader2, Check } from 'lucide-react'
import { updateCustomerProfile } from '@/actions/customer-dashboard'

interface Props {
  initialName: string
  initialLanguage: string
  email: string
  phone: string
}

const inputClass =
  'w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export function ProfileForm({ initialName, initialLanguage, email, phone }: Props) {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(initialName)
  const [language, setLanguage] = useState(initialLanguage)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    if (name.trim().length < 2) {
      setError(t('customerDash.settings.nameTooShort'))
      return
    }
    startTransition(async () => {
      const result = await updateCustomerProfile({ name: name.trim(), preferredLanguage: language })
      if ('error' in result) {
        setError(t(`panditDash.errors.${result.error.code === 'invalid_input' ? 'invalid_input' : 'server'}`))
        return
      }
      // Apply the language preference to the live UI as well.
      if (language !== i18n.language) i18n.changeLanguage(language)
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="profile-name" className="mb-1 block text-xs font-medium text-neutral-700">
          {t('customerDash.settings.name')}
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setSaved(false)
          }}
          minLength={2}
          maxLength={60}
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="profile-email" className="mb-1 block text-xs font-medium text-neutral-700">
            {t('customerDash.settings.email')}
          </label>
          <input id="profile-email" type="email" value={email} readOnly disabled className={`${inputClass} bg-neutral-50 text-neutral-500`} />
        </div>
        <div>
          <label htmlFor="profile-phone" className="mb-1 block text-xs font-medium text-neutral-700">
            {t('customerDash.settings.phone')}
          </label>
          <input id="profile-phone" type="tel" value={phone} readOnly disabled className={`${inputClass} bg-neutral-50 text-neutral-500`} />
        </div>
      </div>

      <div>
        <label htmlFor="profile-lang" className="mb-1 block text-xs font-medium text-neutral-700">
          {t('customerDash.settings.language')}
        </label>
        <select
          id="profile-lang"
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value)
            setSaved(false)
          }}
          className={inputClass}
        >
          <option value="en">{t('panditDash.langs.en')}</option>
          <option value="hi">{t('panditDash.langs.hi')}</option>
          <option value="gu">{t('panditDash.langs.gu')}</option>
        </select>
      </div>

      <div className="space-y-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-500 px-4 py-2 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          {t('customerDash.settings.saveChanges')}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs text-green-700">
            <Check className="h-3.5 w-3.5" />
            {t('customerDash.settings.saved')}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  )
}
