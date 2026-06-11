'use client'
import { useState, useTransition } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Check, Eye, EyeOff } from 'lucide-react'
import { changePassword } from '@/actions/customer-dashboard'

const inputClass =
  'w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const { t } = useTranslation()
  const [isPending, startTransition] = useTransition()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showNext, setShowNext] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  // Google-only accounts have no password to change.
  if (!hasPassword) {
    return <p className="text-xs text-neutral-500">{t('customerDash.settings.noPassword')}</p>
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    if (next.length < 8) {
      setError(t('customerDash.settings.passwordTooShort'))
      return
    }
    if (next !== confirm) {
      setError(t('customerDash.settings.passwordsDontMatch'))
      return
    }
    startTransition(async () => {
      const result = await changePassword(current, next)
      if ('error' in result) {
        setError(t(`customerDash.settings.errors.${result.error.code}`))
        return
      }
      setSaved(true)
      setCurrent('')
      setNext('')
      setConfirm('')
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-xs text-neutral-500">{t('customerDash.settings.changePassword')}</p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="pw-current" className="mb-1 block text-xs font-medium text-neutral-700">
            {t('customerDash.settings.currentPassword')}
          </label>
          <input
            id="pw-current"
            type="password"
            value={current}
            onChange={(e) => {
              setCurrent(e.target.value)
              setSaved(false)
            }}
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="pw-new" className="mb-1 block text-xs font-medium text-neutral-700">
            {t('customerDash.settings.newPassword')}
          </label>
          <div className="relative">
            <input
              id="pw-new"
              type={showNext ? 'text' : 'password'}
              value={next}
              onChange={(e) => {
                setNext(e.target.value)
                setError('')
                setSaved(false)
              }}
              autoComplete="new-password"
              minLength={8}
              required
              className={`${inputClass} pr-9`}
            />
            <button
              type="button"
              onClick={() => setShowNext((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              aria-label={showNext ? t('customerDash.settings.hidePassword') : t('customerDash.settings.showPassword')}
            >
              {showNext ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="pw-confirm" className="mb-1 block text-xs font-medium text-neutral-700">
          {t('customerDash.settings.confirmPassword')}
        </label>
        <input
          id="pw-confirm"
          type="password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value)
            setError('')
            setSaved(false)
          }}
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || !current || next.length < 8 || !confirm}
          className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          {t('customerDash.settings.updatePassword')}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs text-green-700">
            <Check className="h-3.5 w-3.5" />
            {t('customerDash.settings.passwordUpdated')}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  )
}
